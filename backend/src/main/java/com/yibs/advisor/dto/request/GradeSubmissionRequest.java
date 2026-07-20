package com.yibs.advisor.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class GradeSubmissionRequest {

    @NotNull(message = "Student ID is required")
    private UUID studentId;

    @NotNull(message = "Course ID is required")
    private UUID courseId;

    @NotNull(message = "Semester is required")
    @Min(value = 1) @Max(value = 2)
    private Short semester;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotNull @Min(0) @Max(100)
    private Double attendancePct;

    @NotNull @Min(0) @Max(100)
    private Double assignmentScore;

    @NotNull @Min(0) @Max(100)
    private Double projectScore;

    @NotNull @Min(0) @Max(100)
    private Double testScore;

    @NotNull @Min(0) @Max(100)
    private Double examScore;
}
