package com.yibs.advisor.repository;

import com.yibs.advisor.domain.ai.Exam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExamRepository extends JpaRepository<Exam, UUID> {
    List<Exam> findByLecturerId(UUID lecturerId);
    List<Exam> findByCourseId(UUID courseId);
}
