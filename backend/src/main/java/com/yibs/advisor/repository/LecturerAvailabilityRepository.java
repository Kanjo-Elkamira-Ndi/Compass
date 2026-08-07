package com.yibs.advisor.repository;

import com.yibs.advisor.domain.course.LecturerAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LecturerAvailabilityRepository extends JpaRepository<LecturerAvailability, UUID> {
    List<LecturerAvailability> findByLecturerId(UUID lecturerId);
    void deleteByLecturerId(UUID lecturerId);
}
