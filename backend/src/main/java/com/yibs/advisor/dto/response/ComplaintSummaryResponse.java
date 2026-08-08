package com.yibs.advisor.dto.response;

import com.yibs.advisor.domain.complaint.ComplaintCategory;
import com.yibs.advisor.domain.complaint.ComplaintPriority;
import com.yibs.advisor.domain.complaint.ComplaintStatus;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintSummaryResponse {

    private UUID id;
    private String subject;
    private ComplaintCategory category;
    private ComplaintPriority priority;
    private ComplaintStatus status;
    private boolean anonymous;
    private String studentName;
    private String studentNumber;
    private String assigneeName;
    private long replyCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
