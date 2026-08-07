package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRecommendationResponse {
    private int rank;
    private UUID courseId;
    private String courseCode;
    private String courseTitle;
    private Short credits;
    private Short semester;
    private String academicYear;
    private BigDecimal matchScore;
    private String rationale;
    private List<String> alignedSkills;
}
