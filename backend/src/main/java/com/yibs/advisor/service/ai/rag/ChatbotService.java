package com.yibs.advisor.service.ai.rag;

import com.yibs.advisor.domain.ai.ChatMessage;
import com.yibs.advisor.domain.ai.ChatMessageRole;
import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.dto.response.ChatHistoryResponse;
import com.yibs.advisor.dto.response.ChatResponse;
import com.yibs.advisor.dto.response.WebSearchResult;
import com.yibs.advisor.repository.ChatMessageRepository;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import com.yibs.advisor.service.ai.provider.PromptBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final AIProviderStrategy aiProvider;
    private final RagRetrievalService ragRetrievalService;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final RagIngestionService ragIngestionService;
    private final WebSearchService webSearchService;

    private static final Set<String> STOP_WORDS = Set.of(
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "shall", "can", "need", "dare", "ought",
        "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
        "as", "into", "through", "during", "before", "after", "above", "below",
        "between", "out", "off", "over", "under", "again", "further", "then",
        "once", "here", "there", "when", "where", "why", "how", "all", "each",
        "every", "both", "few", "more", "most", "other", "some", "such", "no",
        "nor", "not", "only", "own", "same", "so", "than", "too", "very",
        "just", "because", "but", "and", "or", "if", "while", "about", "what",
        "which", "who", "whom", "this", "that", "these", "those", "am", "it",
        "its", "me", "my", "tell", "give", "know", "want", "like", "get", "make"
    );

    private static final String UNKNOWN_PHRASE = "I don't have information about that in the YIBS documents.";
    private static final List<String> UNKNOWN_MARKERS = List.of(
            "don't have information",
            "do not have information",
            "cannot find",
            "not mentioned"
    );

    private static final String SYSTEM_PROMPT_INTERNAL = String.format(
            """
            You are an AI academic advisor for YIBS (Yaoundé International Business School) called Compass AI.
            Your knowledge comes from the YIBS documents provided in the context below.

            CRITICAL RULES:
            - Answer ONLY using the information from the context sections provided below.
            - If the context does not contain the answer, say "%s"
            - Do NOT use any general knowledge, assumptions, or external information.
            - Do NOT mention page numbers, source names, or documents anywhere in your answer.
            - Answer as if you naturally know the information — no inline citations.
            - Be concise, clear, and direct. This is a university advising context.
            """,
            UNKNOWN_PHRASE
    );

    private static final String SYSTEM_PROMPT_WEB = """
            You are an AI academic advisor for YIBS (Yaoundé International Business School) called Compass AI.
            You have access to both internal YIBS documents and web search results.

            CRITICAL RULES:
            - Prioritize information from the YIBS internal documents when available.
            - Use web search results to supplement or provide information not found in internal documents.
            - If you use web information, indicate it naturally (e.g. "According to recent information...").
            - Do NOT mention URLs, source names, or documents in your answer.
            - Be concise, clear, and direct. This is a university advising context.
            """;

    @Transactional
    public ChatResponse chat(UUID userId, String sessionId, String message) {
        List<DocumentChunk> relevantChunks = ragRetrievalService.retrieveRelevantChunks(message);
        boolean hasInternal = relevantChunks != null && !relevantChunks.isEmpty();

        String answer;
        List<ChatResponse.Citation> citations;
        boolean usedInternal;

        PromptBuilder promptBuilder = PromptBuilder.create();

        if (hasInternal && chunksContainKeywords(relevantChunks, extractKeywords(message))) {
            usedInternal = true;
            promptBuilder.systemPrompt(SYSTEM_PROMPT_INTERNAL);
            for (DocumentChunk chunk : relevantChunks) {
                promptBuilder.addContext(chunk.getContent());
            }
            promptBuilder.addUserMessage(message);

            answer = aiProvider.chat(
                    promptBuilder.buildSystemPrompt(),
                    promptBuilder.buildUserMessage()
            );

            if (isUnknownAnswer(answer)) {
                log.debug("Internal RAG returned unknown answer, falling back to web search");
                usedInternal = false;
                WebFallbackResult fallback = answerWithWebFallback(message, PromptBuilder.create());
                answer = fallback.answer();
                citations = fallback.citations();
            } else {
                citations = relevantChunks.stream()
                        .map(chunk -> ChatResponse.Citation.fromDocument(
                                chunk.getSourceDocument(),
                                chunk.getPageNumber() != null ? chunk.getPageNumber().intValue() : null,
                                chunk.getContent()))
                        .collect(Collectors.toList());
            }
        } else {
            usedInternal = false;
            log.debug("No relevant internal chunks, using web search");
            WebFallbackResult fallback = answerWithWebFallback(message, promptBuilder);
            answer = fallback.answer();
            citations = fallback.citations();
        }

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

        String sourceText = usedInternal ? buildSourceText(relevantChunks) : "";
        String answerWithSources = answer + (sourceText.isEmpty() ? "" : "\n\n" + sourceText);

        return ChatResponse.builder()
                .sessionId(sessionId)
                .answer(answerWithSources)
                .citations(citations)
                .build();
    }

    private List<String> extractKeywords(String message) {
        return Arrays.stream(message.toLowerCase().split("\\W+"))
                .filter(w -> w.length() > 2)
                .filter(w -> !STOP_WORDS.contains(w))
                .distinct()
                .collect(Collectors.toList());
    }

    private boolean chunksContainKeywords(List<DocumentChunk> chunks, List<String> keywords) {
        if (keywords.isEmpty()) return true;
        String combined = chunks.stream()
                .map(DocumentChunk::getContent)
                .collect(Collectors.joining(" "))
                .toLowerCase();
        long matchCount = keywords.stream()
                .filter(kw -> combined.contains(kw))
                .count();
        return matchCount >= Math.min(2, keywords.size());
    }

    private boolean isUnknownAnswer(String answer) {
        String lower = answer.toLowerCase();
        return UNKNOWN_MARKERS.stream().anyMatch(lower::contains);
    }

    private WebFallbackResult answerWithWebFallback(String message, PromptBuilder promptBuilder) {
        promptBuilder.systemPrompt(SYSTEM_PROMPT_WEB);
        promptBuilder.addContext("[No matching content found in the ingested YIBS documents for this question. Searching the web...]");

        List<WebSearchResult> webResults = webSearchService.search(message);
        if (!webResults.isEmpty()) {
            promptBuilder.addContext("Web search results:");
            for (WebSearchResult result : webResults) {
                promptBuilder.addContext("- " + result.getTitle() + ": " + result.getContent());
            }
        } else {
            promptBuilder.addContext("[No web search results available.]");
        }
        promptBuilder.addUserMessage(message);

        String answer = aiProvider.chat(
                promptBuilder.buildSystemPrompt(),
                promptBuilder.buildUserMessage()
        );

        List<ChatResponse.Citation> citations;
        if (!webResults.isEmpty()) {
            citations = webResults.stream()
                    .map(r -> ChatResponse.Citation.fromWeb(r.getTitle(), r.getUrl(), r.getContent(), r.getScore()))
                    .collect(Collectors.toList());
        } else {
            citations = Collections.emptyList();
        }

        return new WebFallbackResult(answer, citations);
    }

    private record WebFallbackResult(String answer, List<ChatResponse.Citation> citations) {}

    private String buildSourceText(List<DocumentChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) return "";

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
