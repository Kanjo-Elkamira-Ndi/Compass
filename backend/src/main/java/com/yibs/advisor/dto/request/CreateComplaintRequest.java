package com.yibs.advisor.dto.request;

import com.yibs.advisor.domain.complaint.ComplaintCategory;
import com.yibs.advisor.domain.complaint.ComplaintPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateComplaintRequest {

    @NotBlank(message = "Subject is required")
    @Size(max = 200, message = "Subject must be at most 200 characters")
    private String subject;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must be at most 5000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private ComplaintCategory category;

    @Builder.Default
    private ComplaintPriority priority = ComplaintPriority.MEDIUM;

    @Builder.Default
    private boolean anonymous = false;
}
