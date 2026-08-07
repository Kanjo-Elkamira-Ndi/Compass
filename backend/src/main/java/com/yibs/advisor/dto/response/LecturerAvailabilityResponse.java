package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LecturerAvailabilityResponse {
    private UUID lecturerId;
    private String lecturerName;
    private List<AvailabilitySlotResponse> slots;
}
