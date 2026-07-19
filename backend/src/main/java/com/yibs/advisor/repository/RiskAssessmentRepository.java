package com.yibs.advisor.repository;

import com.yibs.advisor.domain.ai.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, UUID> {
    List<RiskAssessment> findByStudentIdOrderByAssessedAtDesc(UUID studentId);
    Optional<RiskAssessment> findFirstByStudentIdOrderByAssessedAtDesc(UUID studentId);
}
