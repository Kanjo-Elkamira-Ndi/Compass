package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrolmentResponse {
    private UUID id;
    private UUID studentId;
    private UUID courseId;
    private String courseCode;
    private String courseName;
    private LocalDate enrolmentDate;
    private String status;
    private String finalGrade;
    private OffsetDateTime createdAt;
}
