package com.yibs.advisor.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateCourseRequest {

    @NotBlank(message = "Course code is required")
    private String code;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Credit hours is required")
    @Min(value = 1, message = "Credit hours must be between 1 and 6")
    @Max(value = 6, message = "Credit hours must be between 1 and 6")
    private Short creditHours;

    @NotBlank(message = "Programme is required")
    private String programme;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be 1 or 2")
    @Max(value = 2, message = "Semester must be 1 or 2")
    private Short semester;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    private UUID lecturerId;
    private String timetableSlot;
}
