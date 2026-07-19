package com.yibs.advisor.repository;

import com.yibs.advisor.domain.performance.GradeRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GradeRecordRepository extends JpaRepository<GradeRecord, UUID> {
    List<GradeRecord> findByStudentId(UUID studentId);
    List<GradeRecord> findByStudentIdAndSemesterAndAcademicYear(UUID studentId, Short semester, String academicYear);
    List<GradeRecord> findByCourseId(UUID courseId);
}
