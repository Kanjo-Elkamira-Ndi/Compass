package com.yibs.advisor.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class GradeSubmissionRequest {

    @NotNull(message = "Student ID is required")
    private UUID studentId;

    @NotNull(message = "Course ID is required")
    private UUID courseId;

    private Short semester;

    private String academicYear;

    @Min(0) @Max(100)
    private Double attendancePct;

    @Min(0) @Max(100)
    private Double assignmentScore;

    @Min(0) @Max(100)
    private Double projectScore;

    @Min(0) @Max(100)
    private Double testScore;

    @Min(0) @Max(100)
    private Double examScore;

    private String gradeLetter;

    private BigDecimal gradePoints;
}
