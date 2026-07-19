package com.yibs.advisor.repository;

import com.yibs.advisor.domain.ai.ResearchAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResearchAnalysisRepository extends JpaRepository<ResearchAnalysis, UUID> {
    List<ResearchAnalysis> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
