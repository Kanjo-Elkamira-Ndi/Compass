package com.yibs.advisor.service.complaint;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.complaint.Complaint;
import com.yibs.advisor.domain.complaint.ComplaintReply;
import com.yibs.advisor.domain.user.Role;
import com.yibs.advisor.exception.ComplaintNotFoundException;
import com.yibs.advisor.repository.ComplaintReplyRepository;
import com.yibs.advisor.repository.ComplaintRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintSuggestionService {

    private static final String SYSTEM_PROMPT = """
            You are a professional university complaint-handling assistant for YIBS
            (Yaoundé International Business School). A student has filed a complaint and a
            staff member needs a suggested reply.

            CRITICAL RULES:
            - Be empathetic, professional, and concise (maximum 200 words).
            - Acknowledge the student's concern and mention the complaint category.
            - If the complaint is anonymous, never address the student by name.
            - Do NOT promise specific outcomes, deadlines, or actions that are not in the complaint context.
            - Respond with valid JSON only, in this exact shape: {"suggestion": "<your reply text>"}
            """;

    private static final String FALLBACK_SUGGESTION =
            "Thank you for bringing this to our attention. We have noted your concern regarding %s "
                    + "and it is being reviewed by the appropriate team. We will get back to you shortly "
                    + "with further information.";

    private final AIProviderStrategy aiProvider;
    private final ComplaintRepository complaintRepository;
    private final ComplaintReplyRepository replyRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public String suggestReply(UUID userId, Role role, UUID complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ComplaintNotFoundException(complaintId));

        boolean isAssigned = complaint.getAssignedTo() != null && complaint.getAssignedTo().getId().equals(userId);
        if (role != Role.ADMIN && !isAssigned) {
            throw new AccessDeniedException("Access denied");
        }

        List<ComplaintReply> replies = replyRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);

        String userPrompt = """
                Complaint category: %s
                Subject: %s
                Description: %s
                Status: %s
                %s
                """.formatted(
                complaint.getCategory(),
                complaint.getSubject(),
                complaint.getDescription(),
                complaint.getStatus(),
                replies.isEmpty() ? "No replies yet." : "Existing replies:\n" + replies.stream()
                        .map(r -> "- " + r.getMessage())
                        .collect(Collectors.joining("\n"))
        );

        try {
            String json = aiProvider.chatWithJsonResponse(SYSTEM_PROMPT, userPrompt);
            JsonNode root = objectMapper.readTree(json);
            JsonNode suggestion = root.path("suggestion");
            if (suggestion.isMissingNode() && !root.isObject()) {
                suggestion = root;
            }
            if (suggestion.isTextual() && !suggestion.asText().isBlank()) {
                return suggestion.asText().trim();
            }
            log.warn("AI returned an unexpected suggestion payload, using fallback");
        } catch (Exception ex) {
            log.warn("AI suggestion generation failed, using fallback: {}", ex.getMessage());
        }
        return FALLBACK_SUGGESTION.formatted(complaint.getCategory().name().toLowerCase().replace('_', ' '));
    }
}
