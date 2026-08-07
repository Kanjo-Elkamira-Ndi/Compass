package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptTokenResponse {
    private String token;
    private Instant issuedAt;
    private Instant expiresAt;
    private TranscriptVerificationResponse.VerifiedData data;
}
