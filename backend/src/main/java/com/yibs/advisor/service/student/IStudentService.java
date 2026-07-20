package com.yibs.advisor.service.student;

import com.yibs.advisor.dto.request.CreateStudentRequest;
import com.yibs.advisor.dto.response.StudentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface IStudentService {
    Page<StudentResponse> listStudents(String search, Pageable pageable);
    StudentResponse getStudentById(UUID id);
    StudentResponse getStudentByUserId(UUID userId);
    StudentResponse createStudent(CreateStudentRequest request);
    StudentResponse updateStudent(UUID id, CreateStudentRequest request);
}
