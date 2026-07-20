package com.yibs.advisor.controller;

import com.yibs.advisor.dto.request.*;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.AuthResponse;
import com.yibs.advisor.service.auth.IAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse httpResponse) {
        AuthResponse response = authService.login(request.getEmail(), request.getPassword());

        // Set refresh token as HttpOnly cookie
        Cookie refreshCookie = new Cookie("refreshToken", response.getAccessToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false); // true in production
        refreshCookie.setPath("/api/v1/auth/refresh");
        refreshCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        refreshCookie.setAttribute("SameSite", "Strict");
        httpResponse.addCookie(refreshCookie);

        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(value = "refreshToken", defaultValue = "") String refreshToken,
            HttpServletResponse httpResponse) {
        AuthResponse response = authService.refresh(refreshToken);

        // Set new refresh token cookie
        Cookie refreshCookie = new Cookie("refreshToken", response.getAccessToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);
        refreshCookie.setPath("/api/v1/auth/refresh");
        refreshCookie.setMaxAge(7 * 24 * 60 * 60);
        refreshCookie.setAttribute("SameSite", "Strict");
        httpResponse.addCookie(refreshCookie);

        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(value = "refreshToken", defaultValue = "") String refreshToken,
            HttpServletResponse httpResponse) {
        authService.logout(refreshToken);

        // Clear the refresh cookie
        Cookie clearCookie = new Cookie("refreshToken", "");
        clearCookie.setHttpOnly(true);
        clearCookie.setSecure(false);
        clearCookie.setPath("/api/v1/auth/refresh");
        clearCookie.setMaxAge(0);
        httpResponse.addCookie(clearCookie);

        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(
                "If an account exists with that email, a reset link has been sent.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password has been reset successfully", null));
    }
}
