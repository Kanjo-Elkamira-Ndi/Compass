package com.yibs.advisor.repository;

import com.yibs.advisor.domain.publicsite.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {
}
