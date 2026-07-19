package com.yibs.advisor.repository;

import com.yibs.advisor.domain.performance.PerformanceSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PerformanceSummaryRepository extends JpaRepository<PerformanceSummary, UUID> {
    List<PerformanceSummary> findByStudentIdOrderBySemesterAsc(UUID studentId);
    Optional<PerformanceSummary> findByStudentIdAndSemesterAndAcademicYear(UUID studentId, Short semester, String academicYear);
}
