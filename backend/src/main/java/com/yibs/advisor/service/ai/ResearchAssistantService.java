package com.yibs.advisor.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.ai.ResearchAnalysis;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.dto.response.ResearchAnalysisResponse;
import com.yibs.advisor.repository.ResearchAnalysisRepository;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import com.yibs.advisor.service.ai.provider.PromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResearchAssistantService {

    private final AIProviderStrategy aiProvider;
    private final ResearchAnalysisRepository researchAnalysisRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    @Transactional
    public ResearchAnalysisResponse analyze(UUID userId, MultipartFile file) throws IOException {
        // Validate file type
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 20MB limit");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Extract text from PDF
        String text = extractText(file);
        log.info("Extracted {} characters from {}", text.length(), fileName);

        // Truncate if too long for context window
        if (text.length() > 8000) {
            text = text.substring(0, 8000) + "\n\n[Document truncated due to length]";
        }

        // Build structured analysis prompt
        String systemPrompt = """
                You are an expert research analyst. Analyze the provided research document
                and return a JSON object with the following structure:
                {
                    "summary": "<2-3 paragraph summary of the document>",
                    "keyFindings": ["<finding 1>", "<finding 2>", ...],
                    "researchGaps": ["<gap 1>", "<gap 2>", ...],
                    "futureWork": ["<suggestion 1>", "<suggestion 2>", ...]
                }
                Only return the JSON object, no other text.
                """;

        String userMessage = String.format("""
                Please analyze the following research document and provide:
                1. A comprehensive summary
                2. Key findings (3-5 points)
                3. Research gaps identified
                4. Suggestions for future work

                Document text:
                %s
                """, text);

        String aiResponse = aiProvider.chat(systemPrompt, userMessage);

        // Parse AI response
        String summary = "";
        List<String> keyFindings = List.of();
        List<String> researchGaps = List.of();
        List<String> futureWork = List.of();

        try {
            String jsonStr = aiResponse.trim();
            if (jsonStr.contains("```json")) {
                jsonStr = jsonStr.replaceAll("```json\\s*", "").replaceAll("```", "");
            }
            JsonNode json = objectMapper.readTree(jsonStr);

            summary = json.has("summary") ? json.get("summary").asText() : aiResponse;
            keyFindings = parseStringList(json, "keyFindings");
            researchGaps = parseStringList(json, "researchGaps");
            futureWork = parseStringList(json, "futureWork");
        } catch (Exception e) {
            log.warn("Failed to parse AI research response: {}", e.getMessage());
            summary = aiResponse;
        }

        // Persist analysis
        ResearchAnalysis analysis = ResearchAnalysis.builder()
                .user(user)
                .fileName(fileName)
                .fileSize(file.getSize())
                .summary(summary)
                .keyFindings(keyFindings)
                .researchGaps(researchGaps)
                .futureWork(futureWork)
                .build();
        analysis = researchAnalysisRepository.save(analysis);

        return toResponse(analysis);
    }

    @Transactional(readOnly = true)
    public List<ResearchAnalysisResponse> getHistory(UUID userId) {
        return researchAnalysisRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private String extractText(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private List<String> parseStringList(JsonNode json, String field) {
        List<String> result = new ArrayList<>();
        if (json.has(field) && json.get(field).isArray()) {
            for (JsonNode item : json.get(field)) {
                result.add(item.asText());
            }
        }
        return result;
    }

    private ResearchAnalysisResponse toResponse(ResearchAnalysis analysis) {
        return ResearchAnalysisResponse.builder()
                .id(analysis.getId())
                .fileName(analysis.getFileName())
                .fileSize(analysis.getFileSize())
                .summary(analysis.getSummary())
                .keyFindings(analysis.getKeyFindings() != null ? analysis.getKeyFindings() : List.of())
                .researchGaps(analysis.getResearchGaps() != null ? analysis.getResearchGaps() : List.of())
                .futureWork(analysis.getFutureWork() != null ? analysis.getFutureWork() : List.of())
                .createdAt(analysis.getCreatedAt())
                .build();
    }
}
