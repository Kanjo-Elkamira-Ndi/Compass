package com.yibs.advisor.controller;

import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.service.ai.rag.RagIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final RagIngestionService ragIngestionService;

    @PostMapping("/rag/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadRagDocument(
            @RequestParam("file") MultipartFile file) throws Exception {
        int chunks = ragIngestionService.ingestDocument(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Document uploaded and ingested successfully",
                        Map.of("fileName", file.getOriginalFilename(), "chunksCreated", chunks)));
    }
}
