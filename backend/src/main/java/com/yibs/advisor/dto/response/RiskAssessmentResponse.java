package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessmentResponse {
    private UUID id;
    private UUID studentId;
    private String studentName;
    private BigDecimal riskScore;
    private String riskLevel;
    private List<RiskFactor> riskFactors;
    private List<RecommendedAction> recommendedActions;
    private OffsetDateTime assessedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskFactor {
        private String name;
        private BigDecimal value;
        private BigDecimal weight;
        private String status;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedAction {
        private String id;
        private String title;
        private String description;
        private String priority;
        private String category;
    }
}
