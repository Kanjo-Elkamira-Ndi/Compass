package com.yibs.advisor.service.course;

import com.yibs.advisor.dto.request.CreateCourseRequest;
import com.yibs.advisor.dto.response.CourseResponse;
import com.yibs.advisor.dto.response.EnrolmentResponse;
import com.yibs.advisor.dto.response.StudentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ICourseService {
    Page<CourseResponse> listCourses(String search, Pageable pageable);
    CourseResponse getCourseById(UUID id);
    CourseResponse createCourse(CreateCourseRequest request);
    CourseResponse updateCourse(UUID id, CreateCourseRequest request);
    EnrolmentResponse enrolStudent(UUID courseId, UUID studentId);
    EnrolmentResponse dropCourse(UUID courseId, UUID studentId);
    List<CourseResponse> listLecturerCourses(UUID lecturerId);
    List<StudentResponse> listEnrolledStudents(UUID courseId);
}
