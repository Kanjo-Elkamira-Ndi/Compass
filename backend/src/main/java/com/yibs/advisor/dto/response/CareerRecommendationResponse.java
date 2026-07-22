package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerRecommendationResponse {
    private int rank;
    private String title;
    private BigDecimal matchScore;
    private String demandLevel;
    private String rationale;
    private List<String> skillsToDevelop;
    private List<String> certifications;
    private String averageSalary;
    private String growthRate;
}
