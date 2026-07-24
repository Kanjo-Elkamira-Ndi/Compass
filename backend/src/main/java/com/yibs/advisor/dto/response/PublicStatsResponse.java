package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicStatsResponse {
    private long activeStudents;
    private long coursesOffered;
    private long aiQueriesAnswered;
}
