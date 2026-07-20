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
public class GradeRecordResponse {
    private UUID id;
    private UUID studentId;
    private UUID courseId;
    private String courseCode;
    private String courseName;
    private Short semester;
    private String academicYear;
    private Double attendancePct;
    private Double assignmentScore;
    private Double projectScore;
    private Double testScore;
    private Double examScore;
    private BigDecimal totalScore;
    private String gradeLetter;
    private BigDecimal gradePoints;
}
