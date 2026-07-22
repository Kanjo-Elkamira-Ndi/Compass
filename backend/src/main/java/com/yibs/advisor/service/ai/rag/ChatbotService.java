package com.yibs.advisor.service.ai.rag;

import com.yibs.advisor.domain.ai.ChatMessage;
import com.yibs.advisor.domain.ai.ChatMessageRole;
import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.dto.response.ChatHistoryResponse;
import com.yibs.advisor.dto.response.ChatResponse;
import com.yibs.advisor.repository.ChatMessageRepository;
import com.yibs.advisor.repository.DocumentChunkRepository;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import com.yibs.advisor.service.ai.provider.PromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final AIProviderStrategy aiProvider;
    private final DocumentChunkRepository documentChunkRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    private static final String SYSTEM_PROMPT = """
            You are an AI academic advisor for YIBS (Yaoundé International Business School).
            You help students with course selection, academic planning, degree requirements,
            and university policies. Be helpful, concise, and accurate.
            If you're unsure about something, say so rather than guessing.
            When you use information from provided context, mention the source.
            """;

    @Transactional
    public ChatResponse chat(UUID userId, String sessionId, String message) {
        // Retrieve all available chunks (embedding search requires a provider that supports embeddings)
        List<DocumentChunk> relevantChunks = documentChunkRepository.findAll();

        // Build prompt with RAG context
        PromptBuilder promptBuilder = PromptBuilder.create()
                .systemPrompt(SYSTEM_PROMPT);

        if (!relevantChunks.isEmpty()) {
            for (DocumentChunk chunk : relevantChunks) {
                promptBuilder.addContext(chunk.getContent());
            }
        }

        promptBuilder.addUserMessage(message);

        // Get AI response
        String answer = aiProvider.chat(
                promptBuilder.buildSystemPrompt(),
                promptBuilder.buildUserMessage()
        );

        // Generate a deterministic UUID from the sessionId string
        UUID sessionUuid = UUID.nameUUIDFromBytes(sessionId.getBytes());

        // Save user message
        User user = userRepository.findById(userId).orElse(null);
        ChatMessage userMsg = ChatMessage.builder()
                .sessionId(sessionUuid)
                .user(user)
                .role(ChatMessageRole.USER)
                .content(message)
                .build();
        chatMessageRepository.save(userMsg);

        // Save assistant response
        ChatMessage assistantMsg = ChatMessage.builder()
                .sessionId(sessionUuid)
                .user(user)
                .role(ChatMessageRole.ASSISTANT)
                .content(answer)
                .build();
        chatMessageRepository.save(assistantMsg);

        // Build citations from relevant chunks
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
                .answer(answer)
                .citations(citations)
                .build();
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
