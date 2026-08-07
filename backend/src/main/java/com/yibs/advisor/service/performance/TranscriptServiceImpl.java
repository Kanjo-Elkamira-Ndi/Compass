package com.yibs.advisor.service.performance;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.performance.GradeRecord;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.dto.response.TranscriptTokenResponse;
import com.yibs.advisor.dto.response.TranscriptVerificationResponse;
import com.yibs.advisor.exception.StudentNotFoundException;
import com.yibs.advisor.repository.GradeRecordRepository;
import com.yibs.advisor.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TranscriptServiceImpl implements ITranscriptService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final long SECONDS_PER_DAY = 86_400L;

    private final StudentRepository studentRepository;
    private final GradeRecordRepository gradeRecordRepository;
    private final ObjectMapper objectMapper;
    private final String signingSecret;
    private final long tokenTtlDays;

    public TranscriptServiceImpl(
            StudentRepository studentRepository,
            GradeRecordRepository gradeRecordRepository,
            ObjectMapper objectMapper,
            @Value("${app.transcript.signing-secret}") String signingSecret,
            @Value("${app.transcript.token-ttl-days:90}") long tokenTtlDays) {
        this.studentRepository = studentRepository;
        this.gradeRecordRepository = gradeRecordRepository;
        this.objectMapper = objectMapper;
        this.signingSecret = signingSecret;
        this.tokenTtlDays = tokenTtlDays;
    }

    @Override
    @Transactional(readOnly = true)
    public TranscriptTokenResponse issueToken(UUID studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException(studentId.toString()));

        List<GradeRecord> records = gradeRecordRepository.findByStudentId(studentId);
        BigDecimal cgpa = computeCgpa(records);
        int credits = totalCredits(records);

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(tokenTtlDays * SECONDS_PER_DAY);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("studentId", studentId.toString());
        payload.put("studentName", student.getDisplayName());
        payload.put("studentIdCode", student.getStudentId());
        payload.put("programme", student.getProgramme());
        payload.put("cgpa", cgpa);
        payload.put("credits", credits);
        payload.put("gradeCount", records.size());
        payload.put("issuedAt", issuedAt.toString());
        payload.put("expiresAt", expiresAt.toString());

        return TranscriptTokenResponse.builder()
                .token(sign(payload))
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                    .data(TranscriptVerificationResponse.VerifiedData.builder()
                        .studentName(student.getDisplayName())
                        .studentIdCode(student.getStudentId())
                        .programme(student.getProgramme())
                        .cgpa(cgpa)
                        .credits(credits)
                        .gradeCount(records.size())
                        .issuedAt(issuedAt)
                        .expiresAt(expiresAt)
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TranscriptVerificationResponse verifyToken(String token) {
        if (token == null || token.isBlank()) {
            return invalid("missing");
        }

        String[] parts = token.split("\\.", -1);
        if (parts.length != 2) {
            return invalid("malformed");
        }

        final String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return invalid("malformed");
        }

        if (!MessageDigest.isEqual(
                hex(signBytes(payload)).getBytes(StandardCharsets.UTF_8),
                parts[1].getBytes(StandardCharsets.UTF_8))) {
            return invalid("tampered");
        }

        try {
            JsonNode node = objectMapper.readTree(payload);
            Instant expiresAt = Instant.parse(node.get("expiresAt").asText());
            if (expiresAt.isBefore(Instant.now())) {
                return invalid("expired");
            }
            return TranscriptVerificationResponse.builder()
                    .valid(true)
                .data(TranscriptVerificationResponse.VerifiedData.builder()
                            .studentName(node.get("studentName").asText())
                            .studentIdCode(node.get("studentIdCode").asText())
                            .programme(node.get("programme").asText())
                            .cgpa(node.hasNonNull("cgpa") ? node.get("cgpa").decimalValue() : BigDecimal.ZERO)
                            .credits(node.get("credits").asInt())
                            .gradeCount(node.get("gradeCount").asInt())
                            .issuedAt(Instant.parse(node.get("issuedAt").asText()))
                            .expiresAt(expiresAt)
                            .build())
                    .build();
        } catch (Exception e) {
            return invalid("malformed");
        }
    }

    private String sign(Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(json.getBytes(StandardCharsets.UTF_8))
                    + "."
                    + hex(signBytes(json));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to sign transcript token", e);
        }
    }

    private byte[] signBytes(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign transcript token", e);
        }
    }

    private String hex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private BigDecimal computeCgpa(List<GradeRecord> records) {
        BigDecimal totalPoints = records.stream()
                .filter(r -> r.getGradePoints() != null)
                .map(r -> r.getGradePoints().multiply(BigDecimal.valueOf(r.getCourse().getCreditHours())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalCredits = totalCredits(records);
        return totalCredits > 0
                ? totalPoints.divide(BigDecimal.valueOf(totalCredits), 3, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
    }

    private int totalCredits(List<GradeRecord> records) {
        return records.stream()
                .filter(r -> r.getGradePoints() != null)
                .mapToInt(r -> r.getCourse().getCreditHours())
                .sum();
    }

    private TranscriptVerificationResponse invalid(String reason) {
        return TranscriptVerificationResponse.builder()
                .valid(false)
                .reason(reason)
                .build();
    }
}
