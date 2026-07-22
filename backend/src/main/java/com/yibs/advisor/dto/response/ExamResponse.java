package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResponse {
    private UUID id;
    private UUID courseId;
    private UUID lecturerId;
    private String title;
    private String topic;
    private String difficulty;
    private String status;
    private List<ExamQuestionResponse> questions;
    private OffsetDateTime createdAt;
}
