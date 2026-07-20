package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankingResponse {
    private int rank;
    private UUID studentId;
    private String studentName;
    private String studentIdCode;
    private BigDecimal cgpa;
    private int creditsCompleted;
}
