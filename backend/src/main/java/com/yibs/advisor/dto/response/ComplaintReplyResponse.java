package com.yibs.advisor.dto.response;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintReplyResponse {

    private UUID id;
    private UUID authorId;
    private String authorName;
    private String authorRole;
    private String message;
    private OffsetDateTime createdAt;
}
