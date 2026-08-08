package com.yibs.advisor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintReplyRequest {

    @NotBlank(message = "Reply message is required")
    @Size(max = 5000, message = "Reply must be at most 5000 characters")
    private String message;
}
