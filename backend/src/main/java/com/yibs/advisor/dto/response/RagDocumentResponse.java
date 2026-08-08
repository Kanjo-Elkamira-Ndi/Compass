package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagDocumentResponse {
    private String id;
    private String fileName;
    private String fileType;
    private long fileSize;
    private long chunkCount;
    private String uploadedBy;
    private OffsetDateTime uploadedAt;
    private String status;
}
