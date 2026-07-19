package com.yibs.advisor.domain.performance;

import java.math.BigDecimal;

public record GpaResult(
    BigDecimal gpa,
    BigDecimal cgpa,
    int totalCredits,
    int completedCredits
) {}
