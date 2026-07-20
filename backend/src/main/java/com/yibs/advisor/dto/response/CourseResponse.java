package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private UUID id;
    private String code;
    private String title;
    private Short creditHours;
    private String programme;
    private Short semester;
    private String academicYear;
    private UUID lecturerId;
    private String lecturerName;
    private String timetableSlot;
    private String status;
    private int enrolledCount;
    private OffsetDateTime createdAt;
}
