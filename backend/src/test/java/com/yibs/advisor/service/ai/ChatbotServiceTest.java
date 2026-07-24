package com.yibs.advisor.service.ai;

import com.yibs.advisor.domain.ai.DocumentChunk;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.ChatResponse;
import com.yibs.advisor.repository.ChatMessageRepository;
import com.yibs.advisor.repository.DocumentChunkRepository;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import com.yibs.advisor.service.ai.rag.ChatbotService;
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
    @Mock private DocumentChunkRepository documentChunkRepository;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private ChatbotService chatbotService;

    private User user;

    @BeforeEach
    void setUp() {
        user = Student.builder()
                .id(UUID.randomUUID())
                .email("test@student.com")
                .status(UserStatus.ACTIVE)
                .firstName("John")
                .lastName("Doe")
                .build();
    }

    @Test
    void chat_withContext_shouldReturnResponseWithCitations() {
        DocumentChunk chunk = DocumentChunk.builder()
                .id(UUID.randomUUID())
                .sourceDocument("handbook.pdf")
                .pageNumber((short) 1)
                .content("Test content about YIBS")
                .build();

        when(userRepository.findById(any())).thenReturn(Optional.of(user));
        when(documentChunkRepository.findAll()).thenReturn(List.of(chunk));
        when(aiProvider.chat(any(), any())).thenReturn("YIBS is a great school.");

        ChatResponse response = chatbotService.chat(user.getId(), "session-001", "Tell me about YIBS");

        assertNotNull(response);
        assertEquals("session-001", response.getSessionId());
        assertEquals("YIBS is a great school.", response.getAnswer());
        assertFalse(response.getCitations().isEmpty());
        assertEquals("handbook.pdf", response.getCitations().get(0).getSourceDocument());
    }

    @Test
    void chat_noChunks_shouldReturnResponseWithoutCitations() {
        when(userRepository.findById(any())).thenReturn(Optional.of(user));
        when(documentChunkRepository.findAll()).thenReturn(List.of());
        when(aiProvider.chat(any(), any())).thenReturn("I don't have specific information.");

        ChatResponse response = chatbotService.chat(user.getId(), "session-002", "Random question");

        assertNotNull(response);
        assertEquals("I don't have specific information.", response.getAnswer());
        assertTrue(response.getCitations().isEmpty());
    }
}
