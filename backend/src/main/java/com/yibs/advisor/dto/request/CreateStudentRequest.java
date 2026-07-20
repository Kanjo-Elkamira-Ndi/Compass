package com.yibs.advisor.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class CreateStudentRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
        message = "Password must be at least 8 characters with 1 uppercase, 1 digit, and 1 special character"
    )
    private String password;

    @NotBlank(message = "Student ID is required")
    private String studentId;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Programme is required")
    private String programme;

    @NotNull(message = "Year of study is required")
    @Min(value = 1, message = "Year of study must be between 1 and 5")
    @Max(value = 5, message = "Year of study must be between 1 and 5")
    private Short yearOfStudy;

    private List<String> skills;
}
