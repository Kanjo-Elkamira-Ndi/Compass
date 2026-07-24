package com.yibs.advisor.service.ai;

import com.yibs.advisor.domain.performance.GradeRecord;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.RiskAssessmentResponse;
import com.yibs.advisor.exception.InsufficientDataException;
import com.yibs.advisor.exception.StudentNotFoundException;
import com.yibs.advisor.repository.GradeRecordRepository;
import com.yibs.advisor.repository.RiskAssessmentRepository;
import com.yibs.advisor.repository.StudentRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskAssessmentServiceTest {

    @Mock private AIProviderStrategy aiProvider;
    @Mock private GradeRecordRepository gradeRecordRepository;
    @Mock private RiskAssessmentRepository riskAssessmentRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private RiskAssessmentService riskAssessmentService;

    private Student student;
    private GradeRecord gradeRecord;

    @BeforeEach
    void setUp() {
        student = Student.builder()
                .id(UUID.randomUUID())
                .firstName("John")
                .lastName("Doe")
                .email("test@student.com")
                .status(UserStatus.ACTIVE)
                .build();

        gradeRecord = GradeRecord.builder()
                .id(UUID.randomUUID())
                .student(student)
                .totalScore(BigDecimal.valueOf(65))
                .build();
    }

    @Test
    void assess_withGrades_shouldReturnRiskAssessment() {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(gradeRecordRepository.findByStudentId(any())).thenReturn(List.of(gradeRecord));
        when(aiProvider.chat(any(), any())).thenReturn(
                "{\"score\":0.3,\"level\":\"PASSING\",\"factors\":[{\"name\":\"Average\",\"value\":65,\"status\":\"good\",\"description\":\"Strong performance\"}]}");
        when(riskAssessmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RiskAssessmentResponse response = riskAssessmentService.assess(student.getId());

        assertNotNull(response);
        assertNotNull(response.getRiskLevel());
        assertNotNull(response.getRiskScore());
    }

    @Test
    void assess_noGrades_shouldThrowInsufficientData() {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(gradeRecordRepository.findByStudentId(any())).thenReturn(List.of());

        assertThrows(InsufficientDataException.class, () -> riskAssessmentService.assess(student.getId()));
    }

    @Test
    void assess_nonExistingStudent_shouldThrowStudentNotFound() {
        UUID nonExistingId = UUID.randomUUID();
        when(studentRepository.findById(nonExistingId)).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class, () -> riskAssessmentService.assess(nonExistingId));
    }

    @Test
    void assess_aiReturnsInvalidJson_shouldUseHeuristic() {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(gradeRecordRepository.findByStudentId(any())).thenReturn(List.of(gradeRecord));
        when(aiProvider.chat(any(), any())).thenReturn("Invalid response");
        when(riskAssessmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RiskAssessmentResponse response = riskAssessmentService.assess(student.getId());

        assertNotNull(response);
        assertNotNull(response.getRiskLevel());
    }
}
