package com.yibs.advisor.repository;

import com.yibs.advisor.domain.user.Lecturer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LecturerRepository extends JpaRepository<Lecturer, UUID> {
    Optional<Lecturer> findByStaffId(String staffId);
    Optional<Lecturer> findByEmail(String email);
}
