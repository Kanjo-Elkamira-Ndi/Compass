package com.yibs.advisor.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.ai.CareerRecommendation;
import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.course.CourseStatus;
import com.yibs.advisor.domain.course.Enrolment;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.dto.response.CourseRecommendationResponse;
import com.yibs.advisor.repository.CareerRecommendationRepository;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.EnrolmentRepository;
import com.yibs.advisor.repository.StudentRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseRecommendationService {

    private static final int MAX_RECOMMENDATIONS = 5;

    private final AIProviderStrategy aiProvider;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final CareerRecommendationRepository careerRecommendationRepository;
    private final ObjectMapper objectMapper;

    public List<CourseRecommendationResponse> recommendCourses(UUID studentId, String careerGoal) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        String resolvedGoal = resolveCareerGoal(student, careerGoal);

        Set<UUID> enrolledCourseIds = new HashSet<>();
        for (Enrolment enrolment : enrolmentRepository.findByStudentId(studentId)) {
            enrolledCourseIds.add(enrolment.getCourse().getId());
        }

        List<Course> candidates = courseRepository
                .findByProgrammeAndStatus(student.getProgramme(), CourseStatus.OPEN)
                .stream()
                .filter(course -> !enrolledCourseIds.contains(course.getId()))
                .toList();

        if (candidates.isEmpty()) {
            return List.of();
        }

        String systemPrompt = """
                You are a university academic advisor AI. Based on the student's career goal and profile,
                recommend up to %d courses they should take next, chosen from the provided course catalog.
                Only recommend courses whose courseCode appears in the catalog. Return a JSON array:
                [
                    {
                        "courseCode": "CSE-501",
                        "matchScore": 92,
                        "rationale": "Why this course helps the student reach their career goal",
                        "alignedSkills": ["skill1", "skill2"]
                    }
                ]
                Only return the JSON array, no other text.
                """.formatted(MAX_RECOMMENDATIONS);

        String userMessage = String.format("""
                Student profile:
                - Programme: %s
                - Year of Study: %d
                - Skills: %s
                - Career goal: %s

                Available courses (code, title, credits, semester, academic year):
                %s

                Rank the courses most relevant to the career goal. Return up to %d recommendations,
                each with a match score from 0 to 100.
                """,
                student.getProgramme(),
                student.getYearOfStudy(),
                skillsString(student),
                resolvedGoal,
                formatCatalog(candidates),
                MAX_RECOMMENDATIONS);

        String aiResponse = aiProvider.chatWithJsonResponse(systemPrompt, userMessage);

        Map<String, Course> courseByCode = new HashMap<>();
        for (Course course : candidates) {
            courseByCode.put(course.getCode().trim().toLowerCase(), course);
        }

        List<CourseRecommendationResponse> recommendations = new ArrayList<>();
        try {
            String jsonStr = aiResponse.trim();
            if (jsonStr.contains("```json")) {
                jsonStr = jsonStr.replaceAll("```json\\s*", "").replaceAll("```", "");
            }
            JsonNode json = objectMapper.readTree(jsonStr);
            if (json.isArray()) {
                for (JsonNode rec : json) {
                    String code = rec.has("courseCode") ? rec.get("courseCode").asText() : "";
                    Course course = courseByCode.get(code.trim().toLowerCase());
                    if (course == null) {
                        continue;
                    }
                    recommendations.add(CourseRecommendationResponse.builder()
                            .courseId(course.getId())
                            .courseCode(course.getCode())
                            .courseTitle(course.getTitle())
                            .credits(course.getCreditHours())
                            .semester(course.getSemester())
                            .academicYear(course.getAcademicYear())
                            .matchScore(BigDecimal.valueOf(rec.has("matchScore") ? rec.get("matchScore").asDouble() : 50))
                            .rationale(rec.has("rationale") ? rec.get("rationale").asText() : "")
                            .alignedSkills(parseStringList(rec, "alignedSkills"))
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse course recommendations: {}", e.getMessage());
        }

        recommendations.sort(Comparator.comparing(CourseRecommendationResponse::getMatchScore).reversed());
        for (int i = 0; i < recommendations.size(); i++) {
            recommendations.get(i).setRank(i + 1);
        }
        return recommendations;
    }

    private String resolveCareerGoal(Student student, String explicitGoal) {
        if (explicitGoal != null && !explicitGoal.isBlank()) {
            return explicitGoal.trim();
        }
        List<CareerRecommendation> careerRecommendations =
                careerRecommendationRepository.findByStudentIdOrderByMatchScoreDesc(student.getId());
        if (!careerRecommendations.isEmpty()) {
            return careerRecommendations.get(0).getTitle();
        }
        return "Build a strong career in " + student.getProgramme();
    }

    private String skillsString(Student student) {
        return student.getSkills() != null && !student.getSkills().isEmpty()
                ? String.join(", ", student.getSkills())
                : "Not specified";
    }

    private String formatCatalog(List<Course> courses) {
        StringBuilder sb = new StringBuilder();
        for (Course course : courses) {
            sb.append("- ").append(course.getCode())
                    .append(" | ").append(course.getTitle())
                    .append(" | ").append(course.getCreditHours()).append(" credits")
                    .append(" | semester ").append(course.getSemester())
                    .append(" | ").append(course.getAcademicYear())
                    .append("\n");
        }
        return sb.toString();
    }

    private List<String> parseStringList(JsonNode json, String field) {
        List<String> result = new ArrayList<>();
        if (json.has(field) && json.get(field).isArray()) {
            for (JsonNode item : json.get(field)) {
                result.add(item.asText());
            }
        }
        return result;
    }
}
