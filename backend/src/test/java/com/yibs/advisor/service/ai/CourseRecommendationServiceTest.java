package com.yibs.advisor.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.ai.CareerRecommendation;
import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.course.CourseStatus;
import com.yibs.advisor.domain.course.Enrolment;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.CourseRecommendationResponse;
import com.yibs.advisor.repository.CareerRecommendationRepository;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.EnrolmentRepository;
import com.yibs.advisor.repository.StudentRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseRecommendationServiceTest {

    @Mock private AIProviderStrategy aiProvider;
    @Mock private StudentRepository studentRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private EnrolmentRepository enrolmentRepository;
    @Mock private CareerRecommendationRepository careerRecommendationRepository;

    private CourseRecommendationService service;

    private Student student;
    private Course cse501;
    private Course cse502;
    private Course enrolledCourse;

    @BeforeEach
    void setUp() {
        service = new CourseRecommendationService(
                aiProvider,
                studentRepository,
                courseRepository,
                enrolmentRepository,
                careerRecommendationRepository,
                new ObjectMapper());

        student = Student.builder()
                .id(UUID.randomUUID())
                .firstName("John")
                .lastName("Doe")
                .email("test@student.com")
                .programme("BSc Computer Science")
                .yearOfStudy((short) 2)
                .skills(List.of("Java", "Python"))
                .status(UserStatus.ACTIVE)
                .build();

        cse501 = course("CSE-501", "Advanced Algorithms", (short) 1);
        cse502 = course("CSE-502", "Machine Learning", (short) 2);
        enrolledCourse = course("CSE-500", "Intro to Programming", (short) 1);
    }

    private Course course(String code, String title, short semester) {
        return Course.builder()
                .id(UUID.randomUUID())
                .code(code)
                .title(title)
                .creditHours((short) 3)
                .programme("BSc Computer Science")
                .semester(semester)
                .academicYear("2025-2026")
                .status(CourseStatus.OPEN)
                .build();
    }

    @Test
    void recommendCourses_withValidAiResponse_shouldReturnRankedRecommendations() {
        when(studentRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(enrolmentRepository.findByStudentId(student.getId()))
                .thenReturn(List.of(enrolmentFor(enrolledCourse)));
        when(courseRepository.findByProgrammeAndStatus(any(), any())).thenReturn(List.of(cse501, cse502));
        when(aiProvider.chatWithJsonResponse(any(), any())).thenReturn("""
                [
                  {"courseCode": "CSE-502", "matchScore": 90, "rationale": "Core for ML careers", "alignedSkills": ["Python"]},
                  {"courseCode": "CSE-501", "matchScore": 75, "rationale": "Strengthens problem solving", "alignedSkills": ["Algorithms"]}
                ]
                """);

        List<CourseRecommendationResponse> result = service.recommendCourses(student.getId(), "Machine Learning Engineer");

        assertEquals(2, result.size());
        assertEquals("CSE-502", result.get(0).getCourseCode());
        assertEquals(cse502.getId(), result.get(0).getCourseId());
        assertEquals("Machine Learning", result.get(0).getCourseTitle());
        assertEquals(1, result.get(0).getRank());
        assertEquals(90, result.get(0).getMatchScore().intValue());
        assertEquals(List.of("Python"), result.get(0).getAlignedSkills());
        assertEquals(2, result.get(1).getRank());
    }

    @Test
    void recommendCourses_withoutExplicitGoal_shouldUseTopCareerRecommendation() {
        CareerRecommendation career = CareerRecommendation.builder()
                .title("Data Scientist")
                .matchScore(new java.math.BigDecimal("92"))
                .build();
        when(studentRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(careerRecommendationRepository.findByStudentIdOrderByMatchScoreDesc(student.getId()))
                .thenReturn(List.of(career));
        when(enrolmentRepository.findByStudentId(student.getId())).thenReturn(List.of());
        when(courseRepository.findByProgrammeAndStatus(any(), any())).thenReturn(List.of(cse501, cse502));
        when(aiProvider.chatWithJsonResponse(any(), any())).thenReturn("[]");

        service.recommendCourses(student.getId(), null);

        ArgumentCaptor<String> userMessageCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiProvider).chatWithJsonResponse(any(), userMessageCaptor.capture());
        assertTrue(userMessageCaptor.getValue().contains("Career goal: Data Scientist"));
    }

    @Test
    void recommendCourses_withHallucinatedCodes_shouldFallBackToHeuristic() {
        when(studentRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(enrolmentRepository.findByStudentId(student.getId())).thenReturn(List.of());
        when(courseRepository.findByProgrammeAndStatus(any(), any())).thenReturn(List.of(cse501, cse502));
        when(aiProvider.chatWithJsonResponse(any(), any())).thenReturn(
                "[{\"courseCode\": \"NOPE-999\", \"matchScore\": 99, \"rationale\": \"Does not exist\"}]");

        List<CourseRecommendationResponse> result = service.recommendCourses(student.getId(), "Data Scientist");

        // None of the AI's named courses exist in the catalog, but there are still
        // candidate courses the student hasn't taken — the heuristic fallback should
        // surface those rather than leaving the student with nothing.
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(r -> r.getRank() > 0));
    }

    @Test
    void recommendCourses_noAvailableCourses_shouldReturnEmptyWithoutCallingAi() {
        when(studentRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(enrolmentRepository.findByStudentId(student.getId()))
                .thenReturn(List.of(enrolmentFor(cse501), enrolmentFor(cse502)));
        when(courseRepository.findByProgrammeAndStatus(any(), any())).thenReturn(List.of(cse501, cse502));

        List<CourseRecommendationResponse> result = service.recommendCourses(student.getId(), "Data Scientist");

        assertTrue(result.isEmpty());
        verifyNoInteractions(aiProvider);
    }

    @Test
    void recommendCourses_studentNotFound_shouldThrow() {
        UUID missingId = UUID.randomUUID();
        when(studentRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.recommendCourses(missingId, "Data Scientist"));
    }

    private Enrolment enrolmentFor(Course course) {
        return Enrolment.builder().id(UUID.randomUUID()).course(course).build();
    }
}
