package com.yibs.advisor.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.ai.CareerRecommendation;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.dto.response.CareerRecommendationResponse;
import com.yibs.advisor.repository.CareerRecommendationRepository;
import com.yibs.advisor.repository.StudentRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import com.yibs.advisor.service.ai.provider.PromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CareerRecommendationService {

    private final AIProviderStrategy aiProvider;
    private final CareerRecommendationRepository careerRecommendationRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public List<CareerRecommendationResponse> getRecommendations(UUID studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Build student profile
        String skillsStr = student.getSkills() != null && !student.getSkills().isEmpty()
                ? String.join(", ", student.getSkills())
                : "Not specified";

        String systemPrompt = """
                You are a career recommendation AI. Based on the student's profile,
                recommend 5 career paths ranked by match score. Return a JSON array:
                [
                    {
                        "title": "Career Title",
                        "matchScore": 0.85,
                        "demandLevel": "High",
                        "rationale": "Why this career fits",
                        "skillsToDevelop": ["skill1", "skill2"],
                        "certifications": ["cert1", "cert2"],
                        "averageSalary": "$XX,XXX",
                        "growthRate": "XX%"
                    }
                ]
                Only return the JSON array, no other text.
                """;

        String userMessage = String.format("""
                Analyze this student profile and recommend career paths:
                - Programme: %s
                - Year of Study: %d
                - Skills: %s

                Provide 5 ranked career recommendations with match scores,
                required skills to develop, and relevant certifications.
                """,
                student.getProgramme(),
                student.getYearOfStudy(),
                skillsStr);

        String aiResponse = aiProvider.chat(systemPrompt, userMessage);

        // Parse AI response
        List<CareerRecommendationResponse> recommendations = new ArrayList<>();
        try {
            String jsonStr = aiResponse.trim();
            if (jsonStr.contains("```json")) {
                jsonStr = jsonStr.replaceAll("```json\\s*", "").replaceAll("```", "");
            }
            JsonNode json = objectMapper.readTree(jsonStr);

            if (json.isArray()) {
                int rank = 1;
                for (JsonNode rec : json) {
                    CareerRecommendationResponse response = CareerRecommendationResponse.builder()
                            .rank(rank++)
                            .title(rec.get("title").asText())
                            .matchScore(BigDecimal.valueOf(rec.get("matchScore").asDouble()))
                            .demandLevel(rec.has("demandLevel") ? rec.get("demandLevel").asText() : "Medium")
                            .rationale(rec.has("rationale") ? rec.get("rationale").asText() : "")
                            .skillsToDevelop(parseStringList(rec, "skillsToDevelop"))
                            .certifications(parseStringList(rec, "certifications"))
                            .averageSalary(rec.has("averageSalary") ? rec.get("averageSalary").asText() : "N/A")
                            .growthRate(rec.has("growthRate") ? rec.get("growthRate").asText() : "N/A")
                            .build();
                    recommendations.add(response);

                    // Persist to database
                    CareerRecommendation entity = CareerRecommendation.builder()
                            .student(student)
                            .title(response.getTitle())
                            .matchScore(response.getMatchScore())
                            .demandLevel(response.getDemandLevel())
                            .rationale(response.getRationale())
                            .skillsToDevelop(response.getSkillsToDevelop())
                            .certifications(response.getCertifications())
                            .averageSalary(response.getAverageSalary())
                            .growthRate(response.getGrowthRate())
                            .build();
                    careerRecommendationRepository.save(entity);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse career recommendations: {}", e.getMessage());
        }

        return recommendations;
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
