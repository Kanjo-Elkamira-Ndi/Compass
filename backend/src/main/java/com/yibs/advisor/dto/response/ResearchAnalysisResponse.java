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
public class ResearchAnalysisResponse {
    private UUID id;
    private String fileName;
    private Long fileSize;
    private String summary;
    private List<String> keyFindings;
    private List<String> researchGaps;
    private List<String> futureWork;
    private OffsetDateTime createdAt;
}
