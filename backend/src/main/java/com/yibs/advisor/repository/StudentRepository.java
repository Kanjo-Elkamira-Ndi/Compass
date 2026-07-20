package com.yibs.advisor.repository;

import com.yibs.advisor.domain.user.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<Student, UUID> {
    Optional<Student> findByStudentId(String studentId);
    Optional<Student> findByEmail(String email);
    Page<Student> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrStudentIdContaining(
            String firstName, String lastName, String studentId, Pageable pageable);
}
