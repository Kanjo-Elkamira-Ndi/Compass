package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimetableDayResponse {
    private String day;
    private List<TimetableSlotResponse> slots;
}
