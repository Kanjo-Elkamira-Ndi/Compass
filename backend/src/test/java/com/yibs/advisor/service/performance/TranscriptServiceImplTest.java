package com.yibs.advisor.service.performance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.performance.GradeRecord;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.TranscriptTokenResponse;
import com.yibs.advisor.dto.response.TranscriptVerificationResponse;
import com.yibs.advisor.exception.StudentNotFoundException;
import com.yibs.advisor.repository.GradeRecordRepository;
import com.yibs.advisor.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TranscriptServiceImplTest {

    private static final String SECRET = "test-transcript-signing-secret-at-least-256-bits-0000";

    @Mock private StudentRepository studentRepository;
    @Mock private GradeRecordRepository gradeRecordRepository;

    private TranscriptServiceImpl transcriptService;

    private Student student;
    private GradeRecord gradeRecord;

    @BeforeEach
    void setUp() {
        transcriptService = new TranscriptServiceImpl(
                studentRepository,
                gradeRecordRepository,
                new ObjectMapper(),
                SECRET,
                90L);

        student = Student.builder()
                .id(UUID.randomUUID())
                .firstName("John")
                .lastName("Doe")
                .email("john@student.com")
                .status(UserStatus.ACTIVE)
                .studentId("YIBS-2024-001")
                .programme("BSc Computer Science")
                .build();

        Course course = Course.builder()
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
                .gradeLetter("A")
                .gradePoints(BigDecimal.valueOf(4.0))
                .build();
    }

    @Test
    void issueToken_shouldReturnSignedTokenWithSummaryData() {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(gradeRecordRepository.findByStudentId(any())).thenReturn(List.of(gradeRecord));

        TranscriptTokenResponse response = transcriptService.issueToken(student.getId());

        assertNotNull(response.getToken());
        assertFalse(response.getToken().isBlank());
        assertNotNull(response.getIssuedAt());
        assertNotNull(response.getExpiresAt());
        assertTrue(response.getExpiresAt().isAfter(response.getIssuedAt()));
        assertEquals("John Doe", response.getData().getStudentName());
        assertEquals("YIBS-2024-001", response.getData().getStudentIdCode());
        assertEquals("BSc Computer Science", response.getData().getProgramme());
        assertEquals(BigDecimal.valueOf(4.0).setScale(3), response.getData().getCgpa());
        assertEquals(3, response.getData().getCredits());
        assertEquals(1, response.getData().getGradeCount());
    }

    @Test
    void issueToken_studentNotFound_shouldThrow() {
        when(studentRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class, () -> transcriptService.issueToken(student.getId()));
    }

    @Test
    void verifyToken_validToken_shouldReturnValid() {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(gradeRecordRepository.findByStudentId(any())).thenReturn(List.of(gradeRecord));

        String token = transcriptService.issueToken(student.getId()).getToken();
        TranscriptVerificationResponse response = transcriptService.verifyToken(token);

        assertTrue(response.isValid());
        assertNotNull(response.getData());
        assertEquals("John Doe", response.getData().getStudentName());
        assertEquals("YIBS-2024-001", response.getData().getStudentIdCode());
        assertEquals("BSc Computer Science", response.getData().getProgramme());
        assertEquals(1, response.getData().getGradeCount());
    }

    @Test
    void verifyToken_tamperedPayload_shouldReturnInvalid() throws Exception {
        when(studentRepository.findById(any())).thenReturn(Optional.of(student));
        when(gradeRecordRepository.findByStudentId(any())).thenReturn(List.of(gradeRecord));

        String token = transcriptService.issueToken(student.getId()).getToken();
        String[] parts = token.split("\\.");
        String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        String tampered = payload.replace("John Doe", "Jane Doe");
        String tamperedToken = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(tampered.getBytes(StandardCharsets.UTF_8)) + "." + parts[1];

        TranscriptVerificationResponse response = transcriptService.verifyToken(tamperedToken);

        assertFalse(response.isValid());
        assertEquals("tampered", response.getReason());
        assertNull(response.getData());
    }

    @Test
    void verifyToken_expired_shouldReturnInvalid() throws Exception {
        Instant past = Instant.now().minusSeconds(3600);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("studentId", student.getId().toString());
        payload.put("studentName", "John Doe");
        payload.put("studentIdCode", "YIBS-2024-001");
        payload.put("programme", "BSc Computer Science");
        payload.put("cgpa", BigDecimal.valueOf(4.0));
        payload.put("credits", 3);
        payload.put("gradeCount", 1);
        payload.put("issuedAt", past.minusSeconds(86400).toString());
        payload.put("expiresAt", past.toString());

        String expiredToken = sign(new ObjectMapper().writeValueAsString(payload));
        TranscriptVerificationResponse response = transcriptService.verifyToken(expiredToken);

        assertFalse(response.isValid());
        assertEquals("expired", response.getReason());
    }

    @Test
    void verifyToken_malformed_shouldReturnInvalid() {
        TranscriptVerificationResponse response = transcriptService.verifyToken("not-a-valid-token");

        assertFalse(response.isValid());
        assertNull(response.getData());
    }

    @Test
    void verifyToken_nullOrBlank_shouldReturnInvalid() {
        assertFalse(transcriptService.verifyToken(null).isValid());
        assertFalse(transcriptService.verifyToken("   ").isValid());
    }

    private String sign(String json) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(json.getBytes(StandardCharsets.UTF_8))
                + "." + hex(mac.doFinal(json.getBytes(StandardCharsets.UTF_8)));
    }

    private String hex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
