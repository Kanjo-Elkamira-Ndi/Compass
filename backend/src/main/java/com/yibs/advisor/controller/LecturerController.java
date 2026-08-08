package com.yibs.advisor.controller;

import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.LecturerSummaryResponse;
import com.yibs.advisor.repository.LecturerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lecturers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LecturerController {

    private final LecturerRepository lecturerRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LecturerSummaryResponse>>> listLecturers() {
        List<LecturerSummaryResponse> lecturers = lecturerRepository.findAll().stream()
                .map(l -> LecturerSummaryResponse.builder()
                        .id(l.getId())
                        .name(l.getDisplayName())
                        .staffId(l.getStaffId())
                        .department(l.getDepartment())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(lecturers));
    }
}
