package com.yibs.advisor.service.student;

import com.yibs.advisor.domain.user.*;
import com.yibs.advisor.dto.request.CreateStudentRequest;
import com.yibs.advisor.dto.response.StudentResponse;
import com.yibs.advisor.exception.DuplicateEmailException;
import com.yibs.advisor.exception.StudentNotFoundException;
import com.yibs.advisor.mapper.StudentMapper;
import com.yibs.advisor.repository.StudentRepository;
import com.yibs.advisor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements IStudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentMapper studentMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Page<StudentResponse> listStudents(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return studentRepository
                    .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrStudentIdContaining(
                            search, search, search, pageable)
                    .map(studentMapper::toResponse);
        }
        return studentRepository.findAll(pageable).map(studentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(UUID id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new StudentNotFoundException(id.toString()));
        return studentMapper.toResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentByUserId(UUID userId) {
        Student student = studentRepository.findById(userId)
                .orElseThrow(() -> new StudentNotFoundException(userId.toString()));
        return studentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public StudentResponse createStudent(CreateStudentRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(request.getEmail());
        }

        Student student = Student.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .studentId(request.getStudentId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .programme(request.getProgramme())
                .yearOfStudy(request.getYearOfStudy())
                .skills(request.getSkills() != null ? request.getSkills() : java.util.List.of())
                .build();
        student = studentRepository.save(student);
        return studentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public StudentResponse updateStudent(UUID id, CreateStudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new StudentNotFoundException(id.toString()));

        if (request.getFirstName() != null) student.setFirstName(request.getFirstName());
        if (request.getLastName() != null) student.setLastName(request.getLastName());
        if (request.getProgramme() != null) student.setProgramme(request.getProgramme());
        if (request.getYearOfStudy() != null) student.setYearOfStudy(request.getYearOfStudy());
        if (request.getSkills() != null) student.setSkills(request.getSkills());

        student = studentRepository.save(student);
        return studentMapper.toResponse(student);
    }
}
