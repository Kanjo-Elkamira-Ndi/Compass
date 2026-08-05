package com.yibs.advisor.controller;

import com.yibs.advisor.domain.complaint.ComplaintCategory;
import com.yibs.advisor.domain.complaint.ComplaintPriority;
import com.yibs.advisor.domain.complaint.ComplaintStatus;
import com.yibs.advisor.domain.user.Role;
import com.yibs.advisor.dto.request.AssignComplaintRequest;
import com.yibs.advisor.dto.request.ComplaintReplyRequest;
import com.yibs.advisor.dto.request.CreateComplaintRequest;
import com.yibs.advisor.dto.request.UpdateComplaintStatusRequest;
import com.yibs.advisor.dto.response.AiSuggestionResponse;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.ComplaintResponse;
import com.yibs.advisor.dto.response.ComplaintSummaryResponse;
import com.yibs.advisor.service.complaint.ComplaintSuggestionService;
import com.yibs.advisor.service.complaint.IComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final IComplaintService complaintService;
    private final ComplaintSuggestionService suggestionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ComplaintSummaryResponse>>> listComplaints(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) ComplaintCategory category,
            @RequestParam(required = false) ComplaintPriority priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort,
            Authentication authentication) {

        Sort.Direction direction = sort.length > 1 && sort[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sort[0]));

        Page<ComplaintSummaryResponse> complaints = complaintService.listComplaints(
                UUID.fromString(authentication.getName()),
                roleOf(authentication),
                search, status, category, priority, pageable);
        return ResponseEntity.ok(ApiResponse.ok(complaints));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> createComplaint(
            @ModelAttribute @Valid CreateComplaintRequest request,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {
        UUID studentId = UUID.fromString(authentication.getName());
        ComplaintResponse complaint = complaintService.createComplaint(studentId, request, files);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Complaint submitted successfully", complaint));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(@PathVariable UUID id,
                                                                       Authentication authentication) {
        ComplaintResponse complaint = complaintService.getComplaint(
                UUID.fromString(authentication.getName()), roleOf(authentication), id);
        return ResponseEntity.ok(ApiResponse.ok(complaint));
    }

    @PostMapping("/{id}/replies")
    public ResponseEntity<ApiResponse<ComplaintResponse>> addReply(@PathVariable UUID id,
                                                                   @Valid @RequestBody ComplaintReplyRequest request,
                                                                   Authentication authentication) {
        ComplaintResponse complaint = complaintService.addReply(
                UUID.fromString(authentication.getName()), roleOf(authentication), id, request.getMessage());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Reply added successfully", complaint));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(@PathVariable UUID id,
                                                                       @Valid @RequestBody UpdateComplaintStatusRequest request,
                                                                       Authentication authentication) {
        ComplaintResponse complaint = complaintService.updateStatus(
                UUID.fromString(authentication.getName()), roleOf(authentication), id,
                request.getStatus(), request.getResolution());
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", complaint));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> assignComplaint(@PathVariable UUID id,
                                                                          @Valid @RequestBody AssignComplaintRequest request,
                                                                          Authentication authentication) {
        ComplaintResponse complaint = complaintService.assignComplaint(
                UUID.fromString(authentication.getName()), id, request.getAssignedTo());
        return ResponseEntity.ok(ApiResponse.ok("Complaint assigned successfully", complaint));
    }

    @PostMapping("/{id}/suggest-reply")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<AiSuggestionResponse>> suggestReply(@PathVariable UUID id,
                                                                          Authentication authentication) {
        String suggestion = suggestionService.suggestReply(
                UUID.fromString(authentication.getName()), roleOf(authentication), id);
        return ResponseEntity.ok(ApiResponse.ok(AiSuggestionResponse.builder().suggestion(suggestion).build()));
    }

    @GetMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID id,
                                                       @PathVariable UUID attachmentId,
                                                       Authentication authentication) {
        IComplaintService.DownloadResult result = complaintService.getAttachment(
                UUID.fromString(authentication.getName()), roleOf(authentication), id, attachmentId);
        Resource resource;
        try {
            resource = new UrlResource(result.path().toUri());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Attachment could not be read");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.meta().getContentType()))
                .contentLength(result.meta().getFileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + result.meta().getFileName() + "\"")
                .body(resource);
    }

    private Role roleOf(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst()
                .map(a -> Role.valueOf(a.substring("ROLE_".length())))
                .orElseThrow(() -> new IllegalStateException("No role found for authenticated user"));
    }
}
