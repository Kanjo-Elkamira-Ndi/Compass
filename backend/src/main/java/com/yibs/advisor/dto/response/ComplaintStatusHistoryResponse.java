package com.yibs.advisor.dto.response;

import com.yibs.advisor.domain.complaint.ComplaintStatus;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintStatusHistoryResponse {

    private UUID id;
    private ComplaintStatus fromStatus;
    private ComplaintStatus toStatus;
    private String changedByName;
    private OffsetDateTime changedAt;
}
