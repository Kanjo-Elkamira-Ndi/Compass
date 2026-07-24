package com.yibs.advisor.service.auth;

import com.yibs.advisor.domain.user.*;
import com.yibs.advisor.dto.request.RegisterRequest;
import com.yibs.advisor.dto.response.AuthResponse;
import com.yibs.advisor.exception.DuplicateEmailException;
import com.yibs.advisor.exception.InvalidCredentialsException;
import com.yibs.advisor.repository.StudentRepository;
import com.yibs.advisor.repository.LecturerRepository;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private JwtTokenProvider tokenProvider;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private AuthServiceImpl authService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@student.com");
        registerRequest.setPassword("Passw0rd!");
        registerRequest.setRole(Role.STUDENT);
        registerRequest.setFirstName("John");
        registerRequest.setLastName("Doe");
        registerRequest.setProgramme("M.Tech Software Engineering");
    }

    @Test
    void register_newStudent_shouldReturnAuthResponse() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded-password");
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student student = invocation.getArgument(0);
            student.setId(UUID.randomUUID());
            return student;
        });
        when(tokenProvider.generateAccessToken(any(), any(), any())).thenReturn("mock-token");

        AuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("test@student.com", response.getEmail());
        assertEquals("STUDENT", response.getRole());
        assertEquals("mock-token", response.getAccessToken());
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    void register_duplicateEmail_shouldThrowException() {
        when(userRepository.existsByEmail("test@student.com")).thenReturn(true);

        assertThrows(DuplicateEmailException.class, () -> authService.register(registerRequest));
    }

    @Test
    void login_validCredentials_shouldReturnAuthResponse() {
        User user = Student.builder()
                .id(UUID.randomUUID())
                .email("test@student.com")
                .passwordHash("encoded-password")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userRepository.findByEmail("test@student.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Passw0rd!", "encoded-password")).thenReturn(true);
        when(tokenProvider.generateAccessToken(any(), any(), any())).thenReturn("mock-token");

        AuthResponse response = authService.login("test@student.com", "Passw0rd!");

        assertNotNull(response);
        assertEquals("test@student.com", response.getEmail());
        assertEquals("mock-token", response.getAccessToken());
    }

    @Test
    void login_invalidCredentials_shouldThrowException() {
        when(userRepository.findByEmail("wrong@email.com")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login("wrong@email.com", "wrongpass"));
    }

    @Test
    void login_wrongPassword_shouldThrowException() {
        User user = Student.builder()
                .id(UUID.randomUUID())
                .email("test@student.com")
                .passwordHash("encoded-password")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail("test@student.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "encoded-password")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login("test@student.com", "wrongpass"));
    }
}
