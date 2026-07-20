package com.yibs.advisor.dto.request;

import com.yibs.advisor.domain.user.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
        message = "Password must be at least 8 characters with 1 uppercase, 1 digit, and 1 special character"
    )
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    @Size(max = 100)
    private String programme;

    private String studentId;
    private String staffId;
    private String department;
}
