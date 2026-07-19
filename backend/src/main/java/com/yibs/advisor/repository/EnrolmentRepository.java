package com.yibs.advisor.repository;

import com.yibs.advisor.domain.course.Enrolment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EnrolmentRepository extends JpaRepository<Enrolment, UUID> {
    List<Enrolment> findByStudentId(UUID studentId);
    List<Enrolment> findByCourseId(UUID courseId);
    Optional<Enrolment> findByStudentIdAndCourseId(UUID studentId, UUID courseId);
    boolean existsByStudentIdAndCourseId(UUID studentId, UUID courseId);
}
