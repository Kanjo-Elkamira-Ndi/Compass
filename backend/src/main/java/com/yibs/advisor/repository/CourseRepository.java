package com.yibs.advisor.repository;

import com.yibs.advisor.domain.course.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {
    List<Course> findByProgrammeAndSemesterAndAcademicYear(String programme, Short semester, String academicYear);
    List<Course> findByLecturerId(UUID lecturerId);
    Page<Course> findByTitleContainingIgnoreCaseOrCodeContainingIgnoreCase(String title, String code, Pageable pageable);
}
