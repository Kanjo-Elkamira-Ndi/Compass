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
                            "weight": <0-100, how much this factor contributes; all factors' weights should sum to ~100>,
                            "status": "<good|warning|danger>",
                            "description": "<explanation>"
                        }
                    ],
                    "recommendedActions": [
                        {
                            "id": "<short unique slug>",
                            "title": "<short action title>",
                            "description": "<concrete, specific recommendation>",
                            "priority": "<low|medium|high>",
                            "category": "<the factor name this action addresses>"
                        }
                    ]
                }
                Only include recommendedActions for factors that are not "good".
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
        List<Map<String, Object>> recommendedActions = new ArrayList<>();

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

            JsonNode actions = json.get("recommendedActions");
            if (actions != null && actions.isArray()) {
                for (JsonNode action : actions) {
                    recommendedActions.add(objectMapper.convertValue(action, java.util.Map.class));
                }
            } else {
                // AI returned factors but skipped recommendedActions — derive from factors
                recommendedActions = buildRecommendedActions(riskFactors);
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
            riskFactors = buildHeuristicFactors(avgScore, minScore, maxScore, gradeCount);
            recommendedActions = buildRecommendedActions(riskFactors);
        }

        // Persist assessment
        RiskAssessment assessment = RiskAssessment.builder()
                .student(student)
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .riskFactors(riskFactors)
                .recommendedActions(recommendedActions)
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
                            .weight(f.get("weight") != null ? BigDecimal.valueOf(((Number) f.get("weight")).doubleValue()) : null)
                            .status((String) f.get("status"))
                            .description((String) f.get("description"))
                            .build())
                    .toList()
                : List.of();

        List<RiskAssessmentResponse.RecommendedAction> actions = assessment.getRecommendedActions() != null
                ? assessment.getRecommendedActions().stream()
                    .map(a -> RiskAssessmentResponse.RecommendedAction.builder()
                            .id((String) a.get("id"))
                            .title((String) a.get("title"))
                            .description((String) a.get("description"))
                            .priority((String) a.get("priority"))
                            .category((String) a.get("category"))
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
                .recommendedActions(actions)
                .assessedAt(assessment.getAssessedAt())
                .build();
    }

    /**
     * Heuristic risk factors derived from grade statistics, used when the AI
     * response can't be parsed. Mirrors the shape the AI is prompted to return
     * so downstream mapping (toResponse, recommended actions) doesn't need to
     * special-case the fallback path.
     */
    private List<Map<String, Object>> buildHeuristicFactors(double avgScore, double minScore, double maxScore, int gradeCount) {
        List<Map<String, Object>> factors = new ArrayList<>();
        factors.add(heuristicFactor("Average Score", avgScore, 40,
                avgScore >= 70 ? "good" : avgScore >= 50 ? "warning" : "danger",
                String.format("Average score across %d course(s) is %.1f%%.", gradeCount, avgScore)));
        factors.add(heuristicFactor("Lowest Score", minScore, 30,
                minScore >= 60 ? "good" : minScore >= 40 ? "warning" : "danger",
                String.format("Lowest recorded score is %.1f%%.", minScore)));
        double spread = maxScore - minScore;
        factors.add(heuristicFactor("Performance Consistency", 100 - spread, 20,
                spread <= 20 ? "good" : spread <= 40 ? "warning" : "danger",
                String.format("Score spread between highest and lowest is %.1f points.", spread)));
        factors.add(heuristicFactor("Course Load Coverage", gradeCount * 20, 10,
                gradeCount >= 4 ? "good" : gradeCount >= 2 ? "warning" : "danger",
                String.format("%d graded course(s) on record.", gradeCount)));
        return factors;
    }

    private Map<String, Object> heuristicFactor(String name, double rawValue, int weight, String status, String description) {
        Map<String, Object> factor = new java.util.LinkedHashMap<>();
        factor.put("name", name);
        factor.put("value", Math.round(Math.max(0, Math.min(100, rawValue))));
        factor.put("weight", weight);
        factor.put("status", status);
        factor.put("description", description);
        return factor;
    }

    /** Derives recommended actions from any factor that isn't 'good'. */
    private List<Map<String, Object>> buildRecommendedActions(List<Map<String, Object>> factors) {
        List<Map<String, Object>> actions = new ArrayList<>();
        int i = 0;
        for (Map<String, Object> factor : factors) {
            if ("good".equals(factor.get("status"))) {
                continue;
            }
            Map<String, Object> action = new java.util.LinkedHashMap<>();
            action.put("id", "factor-" + (i++));
            action.put("title", "Address: " + factor.get("name"));
            action.put("description", factor.get("description"));
            action.put("priority", "danger".equals(factor.get("status")) ? "high" : "medium");
            action.put("category", factor.get("name"));
            actions.add(action);
        }
        return actions;
    }
}
