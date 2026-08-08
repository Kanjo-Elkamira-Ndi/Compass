package com.yibs.advisor.controller;

import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.RagDocumentResponse;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.ai.rag.RagIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final RagIngestionService ragIngestionService;
    private final UserRepository userRepository;

    @PostMapping("/rag/upload")
    public ResponseEntity<ApiResponse<RagDocumentResponse>> uploadRagDocument(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws Exception {
        RagDocumentResponse response = ragIngestionService.ingestAndDescribe(file, resolveEmail(authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Document uploaded and ingested successfully", response));
    }

    @GetMapping("/rag/documents")
    public ResponseEntity<ApiResponse<List<RagDocumentResponse>>> listRagDocuments() {
        return ResponseEntity.ok(ApiResponse.ok(ragIngestionService.listDocuments()));
    }

    private String resolveEmail(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return userRepository.findById(userId).map(User::getEmail).orElse("Unknown");
    }
}
