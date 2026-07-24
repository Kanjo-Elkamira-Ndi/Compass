package com.yibs.advisor.service.student;

import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.request.CreateStudentRequest;
import com.yibs.advisor.dto.response.StudentResponse;
import com.yibs.advisor.exception.DuplicateEmailException;
import com.yibs.advisor.exception.StudentNotFoundException;
import com.yibs.advisor.mapper.StudentMapper;
import com.yibs.advisor.repository.StudentRepository;
import com.yibs.advisor.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceImplTest {

    @Mock private StudentRepository studentRepository;
    @Mock private UserRepository userRepository;
    @Mock private StudentMapper studentMapper;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private StudentServiceImpl studentService;

    private Student student;
    private StudentResponse studentResponse;

    @BeforeEach
    void setUp() {
        student = Student.builder()
                .id(UUID.randomUUID())
                .studentId("YIBS/001")
                .firstName("John")
                .lastName("Doe")
                .programme("M.Tech Software Engineering")
                .yearOfStudy((short) 2)
                .build();

        studentResponse = StudentResponse.builder()
                .id(student.getId())
                .studentId("YIBS/001")
                .firstName("John")
                .lastName("Doe")
                .programme("M.Tech Software Engineering")
                .yearOfStudy((short) 2)
                .build();
    }

    @Test
    void getStudentById_existingStudent_shouldReturnResponse() {
        when(studentRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(studentMapper.toResponse(student)).thenReturn(studentResponse);

        StudentResponse response = studentService.getStudentById(student.getId());

        assertNotNull(response);
        assertEquals("John", response.getFirstName());
        assertEquals("YIBS/001", response.getStudentId());
    }

    @Test
    void getStudentById_nonExistingStudent_shouldThrowException() {
        UUID nonExistingId = UUID.randomUUID();
        when(studentRepository.findById(nonExistingId)).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class, () -> studentService.getStudentById(nonExistingId));
    }

    @Test
    void listStudents_withSearch_shouldReturnFilteredResults() {
        Page<Student> page = new PageImpl<>(List.of(student));
        when(studentRepository
                .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrStudentIdContaining(
                        "John", "John", "John", PageRequest.of(0, 20)))
                .thenReturn(page);
        when(studentMapper.toResponse(student)).thenReturn(studentResponse);

        var result = studentService.listStudents("John", PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void listStudents_withoutSearch_shouldReturnAll() {
        Page<Student> page = new PageImpl<>(List.of(student));
        when(studentRepository.findAll(PageRequest.of(0, 20))).thenReturn(page);
        when(studentMapper.toResponse(student)).thenReturn(studentResponse);

        var result = studentService.listStudents(null, PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}
