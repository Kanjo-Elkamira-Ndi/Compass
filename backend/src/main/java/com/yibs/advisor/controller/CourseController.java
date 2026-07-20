package com.yibs.advisor.controller;

import com.yibs.advisor.dto.request.CreateCourseRequest;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.CourseResponse;
import com.yibs.advisor.dto.response.EnrolmentResponse;
import com.yibs.advisor.service.course.ICourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final ICourseService courseService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> listCourses(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {

        Sort.Direction direction = sort.length > 1 && sort[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sort[0]));

        Page<CourseResponse> courses = courseService.listCourses(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(courses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourse(@PathVariable UUID id) {
        CourseResponse course = courseService.getCourseById(id);
        return ResponseEntity.ok(ApiResponse.ok(course));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CreateCourseRequest request) {
        CourseResponse course = courseService.createCourse(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Course created successfully", course));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCourseRequest request) {
        CourseResponse course = courseService.updateCourse(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Course updated successfully", course));
    }

    @PostMapping("/{courseId}/enrol")
    public ResponseEntity<ApiResponse<EnrolmentResponse>> enrol(
            @PathVariable UUID courseId,
            Authentication authentication) {
        UUID studentId = UUID.fromString(authentication.getName());
        EnrolmentResponse enrolment = courseService.enrolStudent(courseId, studentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Enrolled successfully", enrolment));
    }

    @PostMapping("/{courseId}/drop")
    public ResponseEntity<ApiResponse<EnrolmentResponse>> drop(
            @PathVariable UUID courseId,
            Authentication authentication) {
        UUID studentId = UUID.fromString(authentication.getName());
        EnrolmentResponse enrolment = courseService.dropCourse(courseId, studentId);
        return ResponseEntity.ok(ApiResponse.ok("Course dropped successfully", enrolment));
    }
}
