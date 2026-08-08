package com.yibs.advisor.dto.request;

import com.yibs.advisor.domain.complaint.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateComplaintStatusRequest {

    @NotNull(message = "Status is required")
    private ComplaintStatus status;

    private String resolution;
}
