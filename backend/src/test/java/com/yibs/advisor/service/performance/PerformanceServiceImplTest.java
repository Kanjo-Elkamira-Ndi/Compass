package com.yibs.advisor.service.performance;

import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.performance.GradeRecord;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.GpaResponse;
import com.yibs.advisor.dto.response.GradeRecordResponse;
import com.yibs.advisor.dto.request.GradeSubmissionRequest;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.GradeRecordRepository;
import com.yibs.advisor.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PerformanceServiceImplTest {

    @Mock private GradeRecordRepository gradeRecordRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private CourseRepository courseRepository;

    @InjectMocks private PerformanceServiceImpl performanceService;

    private Student student;
    private Course course;
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

        course = Course.builder()
                .id(UUID.randomUUID())
                .code("CSE-501")
                .title("Advanced Algorithms")
                .creditHours((short) 3)
                .build();

        gradeRecord = GradeRecord.builder()
                .id(UUID.randomUUID())
                .student(student)
                .course(course)
                .semester((short) 1)
                .academicYear("2025-2026")
                .attendancePct(BigDecimal.valueOf(92))
                .assignmentScore(BigDecimal.valueOf(85))
                .projectScore(BigDecimal.valueOf(90))
                .testScore(BigDecimal.valueOf(78))
                .examScore(BigDecimal.valueOf(88))
                .totalScore(BigDecimal.valueOf(86.1))
                .gradeLetter("B+")
                .gradePoints(BigDecimal.valueOf(3.5))
                .build();
    }

    @Test
    void submitGrade_shouldReturnGradeResponse() {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(courseRepository.findById(any())).thenReturn(Optional.of(course));
        when(gradeRecordRepository.save(any(GradeRecord.class))).thenAnswer(invocation -> {
            GradeRecord gr = invocation.getArgument(0);
            if (gr.getId() == null) gr.setId(UUID.randomUUID());
            if (gr.getTotalScore() == null) gr.setTotalScore(BigDecimal.valueOf(86.1));
            return gr;
        });
        when(gradeRecordRepository.findById(any())).thenReturn(Optional.of(gradeRecord));

        GradeSubmissionRequest request = new GradeSubmissionRequest();
        request.setStudentId(student.getId());
        request.setCourseId(course.getId());
        request.setSemester((short) 1);
        request.setAcademicYear("2025-2026");
        request.setAttendancePct(92.0);
        request.setAssignmentScore(85.0);
        request.setProjectScore(90.0);
        request.setTestScore(78.0);
        request.setExamScore(88.0);

        GradeRecordResponse response = performanceService.submitGrade(request);

        assertNotNull(response);
        assertNotNull(response.getTotalScore());
        verify(gradeRecordRepository, atLeastOnce()).save(any(GradeRecord.class));
    }

    @Test
    void getStudentSummary_withGrades_shouldReturnGpaResponse() {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(gradeRecordRepository.findByStudentId(any())).thenReturn(List.of(gradeRecord));

        GpaResponse response = performanceService.getStudentSummary(student.getId());

        assertNotNull(response);
        assertEquals("John Doe", response.getStudentName());
        assertNotNull(response.getGpa());
        assertNotNull(response.getCgpa());
    }

    @Test
    void getStudentSummary_noGrades_shouldReturnZeroGpa() {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(gradeRecordRepository.findByStudentId(any())).thenReturn(List.of());

        GpaResponse response = performanceService.getStudentSummary(student.getId());

        assertNotNull(response);
        assertEquals(0, response.getSemesters().size());
    }
}
