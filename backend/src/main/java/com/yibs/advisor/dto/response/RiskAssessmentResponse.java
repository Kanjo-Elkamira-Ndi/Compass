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
    private OffsetDateTime assessedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskFactor {
        private String name;
        private BigDecimal value;
        private String status;
        private String description;
    }
}
