package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GpaResponse {
    private UUID studentId;
    private String studentName;
    private BigDecimal gpa;
    private BigDecimal cgpa;
    private int totalCredits;
    private int completedCredits;
    private List<SemesterGpa> semesters;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SemesterGpa {
        private Short semester;
        private String academicYear;
        private BigDecimal gpa;
        private int credits;
    }
}
