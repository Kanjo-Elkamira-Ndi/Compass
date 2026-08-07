package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptVerificationResponse {

    private boolean valid;
    private String reason;
    private VerifiedData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifiedData {
        private String studentName;
        private String studentIdCode;
        private String programme;
        private BigDecimal cgpa;
        private int credits;
        private int gradeCount;
        private Instant issuedAt;
        private Instant expiresAt;
    }
}
