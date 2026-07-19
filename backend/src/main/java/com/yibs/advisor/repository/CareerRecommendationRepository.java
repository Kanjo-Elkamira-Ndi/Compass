package com.yibs.advisor.repository;

import com.yibs.advisor.domain.ai.CareerRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CareerRecommendationRepository extends JpaRepository<CareerRecommendation, UUID> {
    List<CareerRecommendation> findByStudentIdOrderByMatchScoreDesc(UUID studentId);
}
