package com.yibs.advisor.dto.response;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintAttachmentResponse {

    private UUID id;
    private String fileName;
    private String contentType;
    private long fileSize;
    private OffsetDateTime createdAt;
}
