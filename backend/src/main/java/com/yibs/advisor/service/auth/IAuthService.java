package com.yibs.advisor.service.auth;

import com.yibs.advisor.dto.request.ForgotPasswordRequest;
import com.yibs.advisor.dto.request.RegisterRequest;
import com.yibs.advisor.dto.request.ResetPasswordRequest;
import com.yibs.advisor.dto.response.AuthResponse;

public interface IAuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(String email, String password);
    AuthResponse refresh(String refreshToken);
    void logout(String refreshToken);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
