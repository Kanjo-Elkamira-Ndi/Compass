package com.yibs.advisor.dto.response;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LecturerSummaryResponse {

    private UUID id;
    private String name;
    private String staffId;
    private String department;
}
