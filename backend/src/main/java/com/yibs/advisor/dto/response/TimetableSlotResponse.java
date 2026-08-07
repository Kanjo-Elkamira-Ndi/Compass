package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimetableSlotResponse {
    private String time;
    private String courseCode;
    private String courseName;
    private String lecturerName;
    private String programme;
    private Short semester;
    private String room;
    private String type;
}
