package com.yibs.advisor.controller;

import com.yibs.advisor.dto.request.ChatRequest;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.ChatHistoryResponse;
import com.yibs.advisor.dto.response.ChatResponse;
import com.yibs.advisor.dto.response.RiskAssessmentResponse;
import com.yibs.advisor.service.ai.RiskAssessmentService;
import com.yibs.advisor.service.ai.rag.ChatbotService;
import com.yibs.advisor.service.ai.rag.RagIngestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final ChatbotService chatbotService;
    private final RagIngestionService ragIngestionService;
    private final RiskAssessmentService riskAssessmentService;

    // ─── Chat ───────────────────────────────────────────────
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        ChatResponse response = chatbotService.chat(userId, request.getSessionId(), request.getMessage());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/chat/history/{sessionId}")
    public ResponseEntity<ApiResponse<List<ChatHistoryResponse>>> getChatHistory(
            @PathVariable String sessionId) {
        List<ChatHistoryResponse> history = chatbotService.getChatHistory(sessionId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    // ─── Risk Assessment ────────────────────────────────────
    @PostMapping("/risk-assessment/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> assessRisk(
            @PathVariable UUID studentId) {
        RiskAssessmentResponse response = riskAssessmentService.assess(studentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Risk assessment completed", response));
    }

    @GetMapping("/risk-assessment/{studentId}/latest")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> getLatestRiskAssessment(
            @PathVariable UUID studentId) {
        RiskAssessmentResponse response = riskAssessmentService.getLatest(studentId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ─── RAG Ingestion (temporary — move to AdminController in Phase 11) ──
    @PostMapping("/rag/ingest")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ingestDocument(
            @RequestParam("file") MultipartFile file) throws Exception {
        int chunks = ragIngestionService.ingestDocument(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Document ingested successfully",
                        Map.of("fileName", file.getOriginalFilename(), "chunksCreated", chunks)));
    }
}
