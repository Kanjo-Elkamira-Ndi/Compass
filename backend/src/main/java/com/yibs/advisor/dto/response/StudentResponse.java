package com.yibs.advisor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {
    private UUID id;
    private String studentId;
    private String email;
    private String firstName;
    private String lastName;
    private String programme;
    private Short yearOfStudy;
    private List<String> skills;
    private OffsetDateTime createdAt;
}
