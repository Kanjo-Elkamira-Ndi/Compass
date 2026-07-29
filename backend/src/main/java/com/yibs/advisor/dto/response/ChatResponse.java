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
public class ChatResponse {
    private String sessionId;
    private String answer;
    private List<Citation> citations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Citation {
        private String sourceDocument;
        private Integer pageNumber;
        private String content;
        private Double relevance;
        private String sourceUrl;
        private String sourceType;

        public static Citation fromDocument(String sourceDocument, Integer pageNumber, String content) {
            return Citation.builder()
                    .sourceDocument(sourceDocument)
                    .pageNumber(pageNumber)
                    .content(content.length() > 200 ? content.substring(0, 200) + "..." : content)
                    .relevance(0.85)
                    .sourceType("internal")
                    .build();
        }

        public static Citation fromWeb(String title, String url, String content, double score) {
            return Citation.builder()
                    .sourceDocument(title)
                    .content(content.length() > 200 ? content.substring(0, 200) + "..." : content)
                    .relevance(score)
                    .sourceUrl(url)
                    .sourceType("web")
                    .build();
        }
    }
}
