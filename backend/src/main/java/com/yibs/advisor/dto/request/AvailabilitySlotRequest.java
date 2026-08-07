package com.yibs.advisor.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AvailabilitySlotRequest {
    @NotBlank(message = "Day is required")
    private String day;

    @NotBlank(message = "Slot is required")
    private String slot;
}
