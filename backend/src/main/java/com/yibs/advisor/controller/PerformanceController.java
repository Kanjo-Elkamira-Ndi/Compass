package com.yibs.advisor.controller;

import com.yibs.advisor.dto.request.GradeSubmissionRequest;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.GpaResponse;
import com.yibs.advisor.dto.response.GradeRecordResponse;
import com.yibs.advisor.dto.response.RankingResponse;
import com.yibs.advisor.dto.response.TranscriptTokenResponse;
import com.yibs.advisor.service.performance.IPerformanceService;
import com.yibs.advisor.service.performance.ITranscriptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final IPerformanceService performanceService;
    private final ITranscriptService transcriptService;

    @PostMapping("/grades")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<GradeRecordResponse>> submitGrade(
            @Valid @RequestBody GradeSubmissionRequest request) {
        GradeRecordResponse response = performanceService.submitGrade(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Grade submitted successfully", response));
    }

    @GetMapping("/students/{studentId}/transcript-token")
    public ResponseEntity<ApiResponse<TranscriptTokenResponse>> getTranscriptToken(
            @PathVariable UUID studentId,
            Authentication authentication) {
        if (hasRole(authentication, "STUDENT")
                && !studentId.equals(UUID.fromString(authentication.getName()))) {
            throw new AccessDeniedException("Students can only request their own transcript");
        }
        TranscriptTokenResponse response = transcriptService.issueToken(studentId);
        return ResponseEntity.ok(ApiResponse.ok("Transcript verification token issued", response));
    }

    @GetMapping("/students/{studentId}/summary")
    public ResponseEntity<ApiResponse<GpaResponse>> getStudentSummary(@PathVariable UUID studentId) {
        GpaResponse response = performanceService.getStudentSummary(studentId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/students/{studentId}/grades")
    public ResponseEntity<ApiResponse<List<GradeRecordResponse>>> getGradeRecords(@PathVariable UUID studentId) {
        List<GradeRecordResponse> response = performanceService.getGradeRecords(studentId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/ranking")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<RankingResponse>>> getRanking(
            @RequestParam(required = false) UUID courseId) {
        List<RankingResponse> response = performanceService.getRanking(courseId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }
}
