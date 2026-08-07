package com.yibs.advisor.controller;

import com.yibs.advisor.dto.request.UpdateAvailabilityRequest;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.AvailabilitySlotResponse;
import com.yibs.advisor.dto.response.GenerateTimetableResponse;
import com.yibs.advisor.dto.response.LecturerAvailabilityResponse;
import com.yibs.advisor.dto.response.TimetableDayResponse;
import com.yibs.advisor.service.timetable.TimetableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TimetableDayResponse>>> getTimetable(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        boolean isLecturer = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_LECTURER"));
        List<TimetableDayResponse> timetable = timetableService.getTimetable(isLecturer ? userId : null);
        return ResponseEntity.ok(ApiResponse.ok(timetable));
    }

    @GetMapping("/availability/me")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<ApiResponse<List<AvailabilitySlotResponse>>> getMyAvailability(Authentication authentication) {
        UUID lecturerId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(timetableService.getAvailability(lecturerId)));
    }

    @PutMapping("/availability/me")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<ApiResponse<List<AvailabilitySlotResponse>>> updateMyAvailability(
            @Valid @RequestBody UpdateAvailabilityRequest request,
            Authentication authentication) {
        UUID lecturerId = UUID.fromString(authentication.getName());
        List<AvailabilitySlotResponse> slots = timetableService.updateAvailability(lecturerId, request);
        return ResponseEntity.ok(ApiResponse.ok("Availability updated successfully", slots));
    }

    @GetMapping("/availability")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LecturerAvailabilityResponse>>> getAllAvailability() {
        return ResponseEntity.ok(ApiResponse.ok(timetableService.getAvailabilityForAll()));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GenerateTimetableResponse>> generateTimetable() {
        GenerateTimetableResponse response = timetableService.generateTimetable();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
