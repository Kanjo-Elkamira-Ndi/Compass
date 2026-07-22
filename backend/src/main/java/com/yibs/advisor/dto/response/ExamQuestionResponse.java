package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionResponse {
    private String id;
    private String questionType;
    private String questionText;
    private List<OptionResponse> options;
    private String correctAnswer;
    private int orderIndex;
    private String explanation;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResponse {
        private String label;
        private String text;
        private boolean correct;
    }
}
