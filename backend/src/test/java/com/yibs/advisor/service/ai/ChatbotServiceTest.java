package com.yibs.advisor.service.ai;

import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.ChatResponse;
import com.yibs.advisor.repository.ChatMessageRepository;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import com.yibs.advisor.service.ai.rag.ChatbotService;
import com.yibs.advisor.service.ai.rag.RagIngestionService;
import com.yibs.advisor.service.ai.rag.RagRetrievalService;
import com.yibs.advisor.service.ai.rag.WebSearchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatbotServiceTest {

    @Mock private AIProviderStrategy aiProvider;
    @Mock private RagRetrievalService ragRetrievalService;
    @Mock private RagIngestionService ragIngestionService;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private UserRepository userRepository;
    @Mock private WebSearchService webSearchService;

    @InjectMocks private ChatbotService chatbotService;

    private User user;
    private DocumentChunk handbookChunk;

    @BeforeEach
    void setUp() {
        user = Student.builder()
                .id(UUID.randomUUID())
                .email("test@student.com")
                .status(UserStatus.ACTIVE)
                .firstName("John")
                .lastName("Doe")
                .build();

        handbookChunk = DocumentChunk.builder()
                .id(UUID.randomUUID())
                .sourceDocument("yibs_student_handbook.pdf")
                .pageNumber((short) 5)
                .content("YIBS requires all students to maintain a minimum CGPA of 2.0 to graduate.")
                .build();
    }

    @Test
    void chat_withHandbookContext_shouldReturnResponseWithCitations() {
        when(userRepository.findById(any())).thenReturn(Optional.of(user));
        when(ragRetrievalService.retrieveRelevantChunks(anyString()))
                .thenReturn(List.of(handbookChunk));
        when(aiProvider.chat(any(), any())).thenReturn("Students need a minimum CGPA of 2.0 to graduate.");

        ChatResponse response = chatbotService.chat(user.getId(), "session-001", "What CGPA do I need to graduate?");

        assertNotNull(response);
        assertEquals("session-001", response.getSessionId());
        assertTrue(response.getAnswer().contains("2.0"));
        assertTrue(response.getAnswer().contains("Source: yibs student handbook 5"));
        assertFalse(response.getCitations().isEmpty());
        assertEquals("yibs_student_handbook.pdf", response.getCitations().get(0).getSourceDocument());
        assertEquals(5, response.getCitations().get(0).getPageNumber());
    }

    @Test
    void chat_noMatchingChunks_shouldReturnResponseWithoutCitations() {
        when(userRepository.findById(any())).thenReturn(Optional.of(user));
        when(ragRetrievalService.retrieveRelevantChunks(anyString()))
                .thenReturn(List.of());
        when(webSearchService.search(anyString())).thenReturn(List.of());
        when(aiProvider.chat(any(), any())).thenReturn("I don't have information about that in the YIBS documents.");

        ChatResponse response = chatbotService.chat(user.getId(), "session-002", "What is the tuition fee?");

        assertNotNull(response);
        assertEquals("session-002", response.getSessionId());
        assertEquals("I don't have information about that in the YIBS documents.", response.getAnswer());
        assertTrue(response.getCitations().isEmpty());
    }
}
