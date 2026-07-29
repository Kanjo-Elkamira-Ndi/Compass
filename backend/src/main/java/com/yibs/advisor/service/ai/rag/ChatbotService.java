package com.yibs.advisor.service.ai.rag;

import com.yibs.advisor.domain.ai.ChatMessage;
import com.yibs.advisor.domain.ai.ChatMessageRole;
import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.dto.response.ChatHistoryResponse;
import com.yibs.advisor.dto.response.ChatResponse;
import com.yibs.advisor.repository.ChatMessageRepository;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import com.yibs.advisor.service.ai.provider.PromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final AIProviderStrategy aiProvider;
    private final RagRetrievalService ragRetrievalService;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final RagIngestionService ragIngestionService;

    private static final String SYSTEM_PROMPT = """
            You are an AI academic advisor for YIBS (Yaoundé International Business School).
            Your knowledge comes from the YIBS documents provided in the context below.
            
            CRITICAL RULES:
            - Answer ONLY using the information from the context sections provided below.
            - If the context does not contain the answer, say "I don't have information about that in the YIBS documents."
            - Do NOT use any general knowledge, assumptions, or external information.
            - Do NOT mention page numbers, source names, or documents anywhere in your answer.
            - Answer as if you naturally know the information — no inline citations.
            - Be concise, clear, and direct. This is a university advising context.
            """;

    @Transactional
    public ChatResponse chat(UUID userId, String sessionId, String message) {
        List<DocumentChunk> relevantChunks = ragRetrievalService.retrieveRelevantChunks(message);

        PromptBuilder promptBuilder = PromptBuilder.create()
                .systemPrompt(SYSTEM_PROMPT);

        if (!relevantChunks.isEmpty()) {
            for (DocumentChunk chunk : relevantChunks) {
                promptBuilder.addContext(chunk.getContent());
            }
        } else {
            promptBuilder.addContext("[No matching content found in the ingested YIBS documents for this question.]");
        }

        promptBuilder.addUserMessage(message);

        String answer = aiProvider.chat(
                promptBuilder.buildSystemPrompt(),
                promptBuilder.buildUserMessage()
        );

        UUID sessionUuid = UUID.nameUUIDFromBytes(sessionId.getBytes());

        User user = userRepository.findById(userId).orElse(null);
        ChatMessage userMsg = ChatMessage.builder()
                .sessionId(sessionUuid)
                .user(user)
                .role(ChatMessageRole.USER)
                .content(message)
                .build();
        chatMessageRepository.save(userMsg);

        ChatMessage assistantMsg = ChatMessage.builder()
                .sessionId(sessionUuid)
                .user(user)
                .role(ChatMessageRole.ASSISTANT)
                .content(answer)
                .build();
        chatMessageRepository.save(assistantMsg);

        String sourceText = buildSourceText(relevantChunks);
        String answerWithSources = answer + (sourceText.isEmpty() ? "" : "\n\n" + sourceText);

        List<ChatResponse.Citation> citations = relevantChunks.stream()
                .map(chunk -> ChatResponse.Citation.builder()
                        .sourceDocument(chunk.getSourceDocument())
                        .pageNumber(chunk.getPageNumber() != null ? chunk.getPageNumber().intValue() : null)
                        .content(chunk.getContent().length() > 200
                                ? chunk.getContent().substring(0, 200) + "..."
                                : chunk.getContent())
                        .relevance(0.85)
                        .build())
                .toList();

        return ChatResponse.builder()
                .sessionId(sessionId)
                .answer(answerWithSources)
                .citations(citations)
                .build();
    }

    private String buildSourceText(List<DocumentChunk> chunks) {
        if (chunks.isEmpty()) return "";

        String docName = chunks.get(0).getSourceDocument()
                .replace(".pdf", "")
                .replace("_", " ");
        StringBuilder sb = new StringBuilder("Source: ").append(docName).append(" ");
        String pages = chunks.stream()
                .map(DocumentChunk::getPageNumber)
                .filter(Objects::nonNull)
                .map(Short::intValue)
                .sorted()
                .distinct()
                .map(String::valueOf)
                .collect(Collectors.joining(", "));
        sb.append(pages);
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<ChatHistoryResponse> getChatHistory(String sessionId) {
        UUID sessionUuid = UUID.nameUUIDFromBytes(sessionId.getBytes());
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionUuid)
                .stream()
                .map(msg -> ChatHistoryResponse.builder()
                        .id(msg.getId())
                        .role(msg.getRole().name())
                        .content(msg.getContent())
                        .createdAt(msg.getCreatedAt())
                        .build())
                .toList();
    }
}
