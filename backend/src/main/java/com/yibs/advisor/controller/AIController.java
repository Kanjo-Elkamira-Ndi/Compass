package com.yibs.advisor.controller;

import com.yibs.advisor.dto.request.ChatRequest;
import com.yibs.advisor.dto.request.ExamRequest;
import com.yibs.advisor.dto.request.SaveExamRequest;
import com.yibs.advisor.dto.response.ApiResponse;
import com.yibs.advisor.dto.response.CareerRecommendationResponse;
import com.yibs.advisor.dto.response.ChatHistoryResponse;
import com.yibs.advisor.dto.response.ChatResponse;
import com.yibs.advisor.dto.response.CourseRecommendationResponse;
import com.yibs.advisor.dto.response.ExamQuestionResponse;
import com.yibs.advisor.dto.response.ExamResponse;
import com.yibs.advisor.dto.response.ResearchAnalysisResponse;
import com.yibs.advisor.dto.response.RiskAssessmentResponse;
import com.yibs.advisor.service.ai.CareerRecommendationService;
import com.yibs.advisor.service.ai.CourseRecommendationService;
import com.yibs.advisor.service.ai.ExamGeneratorService;
import com.yibs.advisor.service.ai.ResearchAssistantService;
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
    private final ResearchAssistantService researchAssistantService;
    private final ExamGeneratorService examGeneratorService;
    private final CareerRecommendationService careerRecommendationService;
    private final CourseRecommendationService courseRecommendationService;

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
    public ResponseEntity<?> getLatestRiskAssessment(@PathVariable UUID studentId) {
        try {
            RiskAssessmentResponse response = riskAssessmentService.getLatest(studentId);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No risk assessment found for this student", "NOT_FOUND"));
        }
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

    // ─── Research Assistant ──────────────────────────────────
    @PostMapping("/research-assistant")
    public ResponseEntity<ApiResponse<ResearchAnalysisResponse>> analyzeResearch(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws Exception {
        UUID userId = UUID.fromString(authentication.getName());
        ResearchAnalysisResponse response = researchAssistantService.analyze(userId, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Research analysis completed", response));
    }

    @GetMapping("/research-assistant/history")
    public ResponseEntity<ApiResponse<List<ResearchAnalysisResponse>>> getResearchHistory(
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        List<ResearchAnalysisResponse> history = researchAssistantService.getHistory(userId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/research-assistant/{analysisId}")
    public ResponseEntity<ApiResponse<ResearchAnalysisResponse>> getResearchAnalysis(
            @PathVariable UUID analysisId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        ResearchAnalysisResponse response = researchAssistantService.getById(analysisId, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/research-assistant/{analysisId}/chat")
    public ResponseEntity<ApiResponse<Map<String, String>>> chatAboutDocument(
            @PathVariable UUID analysisId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        String question = body.get("question");
        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Question is required", "BAD_REQUEST"));
        }
        String answer = researchAssistantService.chatAboutDocument(analysisId, userId, question);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("answer", answer)));
    }

    @DeleteMapping("/research-assistant/{analysisId}")
    public ResponseEntity<ApiResponse<Void>> deleteResearchAnalysis(
            @PathVariable UUID analysisId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        researchAssistantService.deleteAnalysis(analysisId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Analysis deleted successfully", null));
    }

    // ─── Exam Generator ─────────────────────────────────────
    @PostMapping("/exam-generator")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<ExamQuestionResponse>>> generateExam(
            @Valid @RequestBody ExamRequest request,
            Authentication authentication) {
        UUID lecturerId = UUID.fromString(authentication.getName());
        List<ExamQuestionResponse> questions = examGeneratorService.generate(request, lecturerId);
        return ResponseEntity.ok(ApiResponse.ok(questions));
    }

    @PostMapping("/exams")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ApiResponse<ExamResponse>> saveExam(
            @Valid @RequestBody SaveExamRequest request,
            Authentication authentication) {
        UUID lecturerId = UUID.fromString(authentication.getName());
        ExamResponse exam = examGeneratorService.saveExam(request, lecturerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Exam saved successfully", exam));
    }

    // ─── Career Recommendation ──────────────────────────────
    @GetMapping("/career-recommendations")
    public ResponseEntity<ApiResponse<List<CareerRecommendationResponse>>> getCareerRecommendations(
            Authentication authentication) {
        UUID studentId = UUID.fromString(authentication.getName());
        List<CareerRecommendationResponse> recommendations = careerRecommendationService.getRecommendations(studentId);
        return ResponseEntity.ok(ApiResponse.ok(recommendations));
    }

    // ─── Course Recommendations ────────────────────────────
    @GetMapping("/course-recommendations")
    public ResponseEntity<ApiResponse<List<CourseRecommendationResponse>>> getCourseRecommendations(
            @RequestParam(value = "careerGoal", required = false) String careerGoal,
            Authentication authentication) {
        UUID studentId = UUID.fromString(authentication.getName());
        List<CourseRecommendationResponse> recommendations =
                courseRecommendationService.recommendCourses(studentId, careerGoal);
        return ResponseEntity.ok(ApiResponse.ok(recommendations));
    }
}
