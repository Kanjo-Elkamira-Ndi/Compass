package com.yibs.advisor.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.ai.RiskAssessment;
import com.yibs.advisor.domain.ai.RiskLevel;
import com.yibs.advisor.domain.performance.GradeRecord;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.dto.response.RiskAssessmentResponse;
import com.yibs.advisor.exception.InsufficientDataException;
import com.yibs.advisor.exception.StudentNotFoundException;
import com.yibs.advisor.repository.GradeRecordRepository;
import com.yibs.advisor.repository.RiskAssessmentRepository;
import com.yibs.advisor.repository.StudentRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import com.yibs.advisor.service.ai.provider.PromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiskAssessmentService {

    private final AIProviderStrategy aiProvider;
    private final GradeRecordRepository gradeRecordRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final StudentRepository studentRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @Transactional
    public RiskAssessmentResponse assess(UUID studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException(studentId.toString()));

        List<GradeRecord> grades = gradeRecordRepository.findByStudentId(studentId);
        if (grades.isEmpty()) {
            throw new InsufficientDataException("No grade records found for student");
        }

        // Aggregate grade statistics using Streams
        DoubleSummaryStatistics stats = grades.stream()
                .filter(g -> g.getTotalScore() != null)
                .mapToDouble(g -> g.getTotalScore().doubleValue())
                .summaryStatistics();

        double avgScore = stats.getAverage();
        double minScore = stats.getMin();
        double maxScore = stats.getMax();
        int gradeCount = (int) stats.getCount();

        // Build structured prompt for AI
        String systemPrompt = """
                You are an academic risk assessment AI. Analyze the student's academic performance
                and return a JSON object with the following structure:
                {
                    "score": <0.0 to 1.0, where 1.0 is highest risk>,
                    "level": "<EXCELLENT|PASSING|AT_RISK|CRITICAL>",
                    "factors": [
                        {
                            "name": "<factor name>",
                            "value": <0-100 score>,
                            "status": "<good|warning|danger>",
                            "description": "<explanation>"
                        }
                    ]
                }
                Only return the JSON object, no other text.
                """;

        String userMessage = String.format("""
                Analyze this student's academic performance:
                - Average score: %.1f%%
                - Minimum score: %.1f%%
                - Maximum score: %.1f%%
                - Number of courses: %d
                - Recent trend: %s

                Determine the risk level and provide specific risk factors.
                """,
                avgScore, minScore, maxScore, gradeCount,
                avgScore >= 70 ? "improving" : avgScore >= 50 ? "stable" : "declining");

        String aiResponse = aiProvider.chat(systemPrompt, userMessage);

        // Parse AI response
        RiskLevel riskLevel = RiskLevel.PASSING;
        BigDecimal riskScore = BigDecimal.valueOf(0.5);
        List<Map<String, Object>> riskFactors = new ArrayList<>();

        try {
            String jsonStr = aiResponse.trim();
            if (jsonStr.contains("```json")) {
                jsonStr = jsonStr.replaceAll("```json\\s*", "").replaceAll("```", "");
            }
            JsonNode json = objectMapper.readTree(jsonStr);

            riskScore = BigDecimal.valueOf(json.get("score").asDouble())
                    .setScale(4, RoundingMode.HALF_UP);

            String levelStr = json.get("level").asText();
            riskLevel = RiskLevel.valueOf(levelStr);

            JsonNode factors = json.get("factors");
            if (factors != null && factors.isArray()) {
                for (JsonNode factor : factors) {
                    riskFactors.add(objectMapper.convertValue(factor, java.util.Map.class));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse AI risk response, using heuristic: {}", e.getMessage());
            // Fallback to heuristic-based assessment
            if (avgScore >= 75) {
                riskLevel = RiskLevel.EXCELLENT;
                riskScore = BigDecimal.valueOf(0.1);
            } else if (avgScore >= 55) {
                riskLevel = RiskLevel.PASSING;
                riskScore = BigDecimal.valueOf(0.3);
            } else if (avgScore >= 40) {
                riskLevel = RiskLevel.AT_RISK;
                riskScore = BigDecimal.valueOf(0.6);
            } else {
                riskLevel = RiskLevel.CRITICAL;
                riskScore = BigDecimal.valueOf(0.9);
            }
        }

        // Persist assessment
        RiskAssessment assessment = RiskAssessment.builder()
                .student(student)
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .riskFactors(riskFactors)
                .assessedAt(OffsetDateTime.now())
                .build();
        assessment = riskAssessmentRepository.save(assessment);

        // Publish event if critical
        if (riskLevel == RiskLevel.CRITICAL) {
            eventPublisher.publishEvent(new RiskAlertEvent(this, studentId, student.getFirstName() + " " + student.getLastName()));
        }

        return toResponse(assessment, student);
    }

    @Transactional(readOnly = true)
    public RiskAssessmentResponse getLatest(UUID studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException(studentId.toString()));

        RiskAssessment assessment = riskAssessmentRepository
                .findFirstByStudentIdOrderByAssessedAtDesc(studentId)
                .orElseThrow(() -> new RuntimeException("No risk assessment found for student"));

        return toResponse(assessment, student);
    }

    private RiskAssessmentResponse toResponse(RiskAssessment assessment, Student student) {
        List<RiskAssessmentResponse.RiskFactor> factors = assessment.getRiskFactors() != null
                ? assessment.getRiskFactors().stream()
                    .map(f -> RiskAssessmentResponse.RiskFactor.builder()
                            .name((String) f.get("name"))
                            .value(f.get("value") != null ? BigDecimal.valueOf(((Number) f.get("value")).doubleValue()) : null)
                            .status((String) f.get("status"))
                            .description((String) f.get("description"))
                            .build())
                    .toList()
                : List.of();

        return RiskAssessmentResponse.builder()
                .id(assessment.getId())
                .studentId(student.getId())
                .studentName(student.getFirstName() + " " + student.getLastName())
                .riskScore(assessment.getRiskScore())
                .riskLevel(assessment.getRiskLevel().name())
                .riskFactors(factors)
                .assessedAt(assessment.getAssessedAt())
                .build();
    }
}
