package com.yibs.advisor.dto.response;

import com.yibs.advisor.domain.complaint.ComplaintCategory;
import com.yibs.advisor.domain.complaint.ComplaintPriority;
import com.yibs.advisor.domain.complaint.ComplaintStatus;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {

    private UUID id;
    private String subject;
    private String description;
    private ComplaintCategory category;
    private ComplaintPriority priority;
    private ComplaintStatus status;
    private boolean anonymous;
    private UUID studentId;
    private String studentName;
    private String studentNumber;
    private UUID assignedTo;
    private String assigneeName;
    private String resolution;
    private List<ComplaintReplyResponse> replies;
    private List<ComplaintAttachmentResponse> attachments;
    private List<ComplaintStatusHistoryResponse> statusHistory;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
