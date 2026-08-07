package com.yibs.advisor.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdateAvailabilityRequest {
    @Valid
    @NotNull(message = "Slots are required")
    private List<AvailabilitySlotRequest> slots;
}
