package com.yibs.advisor.service.auth;

import com.yibs.advisor.domain.user.*;
import com.yibs.advisor.domain.security.RevokedToken;
import com.yibs.advisor.domain.security.PasswordResetToken;
import com.yibs.advisor.dto.request.ForgotPasswordRequest;
import com.yibs.advisor.dto.request.RegisterRequest;
import com.yibs.advisor.dto.request.ResetPasswordRequest;
import com.yibs.advisor.dto.response.AuthResponse;
import com.yibs.advisor.exception.*;
import com.yibs.advisor.repository.*;
import com.yibs.advisor.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(request.getEmail());
        }

        User user = switch (request.getRole()) {
            case STUDENT -> createStudent(request);
            case LECTURER -> createLecturer(request);
            case ADMIN -> createAdmin(request);
        };

        Role role = resolveRole(user);
        String accessToken = tokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), role.name());

        log.info("User registered: {} ({})", user.getEmail(), role);

        return AuthResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .role(role.name())
                .accessToken(accessToken)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        Role role = resolveRole(user);
        String accessToken = tokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), role.name());

        return AuthResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .role(role.name())
                .accessToken(accessToken)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        String tokenHash = sha256(refreshToken);

        RevokedToken revoked = revokedTokenRepository.findByTokenHash(tokenHash)
                .orElse(null);

        if (revoked != null) {
            throw new TokenRevokedException();
        }

        // For opaque refresh tokens, we store the user_id in a side-channel.
        // In this implementation, we decode the refresh token as a UUID
        // which represents the user_id (simplified for Phase 2).
        UUID userId;
        try {
            userId = UUID.fromString(refreshToken);
        } catch (IllegalArgumentException e) {
            throw new InvalidTokenException();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(InvalidTokenException::new);

        // Revoke old refresh token
        revokeRefreshToken(refreshToken, user);

        // Issue new tokens
        Role role = resolveRole(user);
        String newAccessToken = tokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), role.name());
        String newRefreshToken = tokenProvider.generateRefreshToken();

        return AuthResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .role(role.name())
                .accessToken(newAccessToken)
                .build();
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null) return;

        UUID userId;
        try {
            userId = UUID.fromString(refreshToken);
        } catch (IllegalArgumentException e) {
            return;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            revokeRefreshToken(refreshToken, user);
        }
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            // Don't reveal whether the email exists
            log.info("Password reset requested for: {}", request.getEmail());
            return;
        }

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = sha256(rawToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(OffsetDateTime.now().plusHours(1))
                .build();

        passwordResetTokenRepository.save(resetToken);

        // TODO: Send email with reset link containing rawToken
        log.info("Password reset token for {}: {}", user.getEmail(), rawToken);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = sha256(request.getToken());

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndUsedFalse(tokenHash)
                .orElseThrow(InvalidTokenException::new);

        if (resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new InvalidTokenException();
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    private void revokeRefreshToken(String refreshToken, User user) {
        String tokenHash = sha256(refreshToken);
        RevokedToken revoked = RevokedToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .expiresAt(OffsetDateTime.now().plusDays(7))
                .build();
        revokedTokenRepository.save(revoked);
    }

    private Student createStudent(RegisterRequest request) {
        Student student = Student.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .studentId(request.getStudentId() != null ? request.getStudentId() :
                        "YIBS/" + System.currentTimeMillis() % 100000)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .programme(request.getProgramme() != null ? request.getProgramme() : "General")
                .yearOfStudy((short) 1)
                .build();
        return studentRepository.save(student);
    }

    private Lecturer createLecturer(RegisterRequest request) {
        Lecturer lecturer = Lecturer.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .staffId(request.getStaffId() != null ? request.getStaffId() :
                        "STF/" + System.currentTimeMillis() % 100000)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .department(request.getDepartment() != null ? request.getDepartment() : "General")
                .build();
        return lecturerRepository.save(lecturer);
    }

    private Admin createAdmin(RegisterRequest request) {
        Admin admin = Admin.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .build();
        return userRepository.save(admin);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private Role resolveRole(User user) {
        if (user instanceof Student) return Role.STUDENT;
        if (user instanceof Lecturer) return Role.LECTURER;
        if (user instanceof Admin) return Role.ADMIN;
        return user.getRole();
    }
}
