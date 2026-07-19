package com.yibs.advisor.repository;

import com.yibs.advisor.domain.ai.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, UUID> {
    List<ExamQuestion> findByExamIdOrderByOrderIndexAsc(UUID examId);
}
