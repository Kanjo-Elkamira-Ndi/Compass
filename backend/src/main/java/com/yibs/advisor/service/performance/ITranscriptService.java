package com.yibs.advisor.service.performance;

import com.yibs.advisor.dto.response.TranscriptTokenResponse;
import com.yibs.advisor.dto.response.TranscriptVerificationResponse;

import java.util.UUID;

public interface ITranscriptService {
    TranscriptTokenResponse issueToken(UUID studentId);
    TranscriptVerificationResponse verifyToken(String token);
}
