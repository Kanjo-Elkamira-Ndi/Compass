package com.yibs.advisor.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SaveExamRequest {

    @NotBlank(message = "Course ID is required")
    private UUID courseId;

    @NotBlank(message = "Title is required")
    private String title;

    private List<ExamQuestionRequest> questions;

    @Data
    public static class ExamQuestionRequest {
        private String questionType;
        private String questionText;
        private List<OptionRequest> options;
        private String correctAnswer;
        private int orderIndex;
    }

    @Data
    public static class OptionRequest {
        private String label;
        private String text;
        private boolean correct;
    }
}
