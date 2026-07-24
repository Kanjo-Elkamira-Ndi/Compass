package com.yibs.advisor.service.ai;

import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.ResearchAnalysisResponse;
import com.yibs.advisor.repository.ResearchAnalysisRepository;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResearchAssistantServiceTest {

    @Mock private AIProviderStrategy aiProvider;
    @Mock private ResearchAnalysisRepository researchAnalysisRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private ResearchAssistantService researchAssistantService;

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
    void analyze_withPdf_shouldReturnAnalysis() throws Exception {
        // Create a minimal valid PDF
        byte[] pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF".getBytes();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                pdfContent
        );

        when(userRepository.findById(any())).thenReturn(Optional.of(user));
        when(aiProvider.chat(any(), any())).thenReturn(
                "{\"summary\":\"Test summary\",\"keyFindings\":[\"Finding 1\"],\"researchGaps\":[\"Gap 1\"],\"futureWork\":[\"Work 1\"]}");
        when(researchAnalysisRepository.save(any())).thenAnswer(inv -> {
            var entity = inv.getArgument(0);
            // Set an ID for the entity
            try {
                var idField = entity.getClass().getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(entity, UUID.randomUUID());
            } catch (Exception ignored) {}
            return entity;
        });

        ResearchAnalysisResponse response = researchAssistantService.analyze(user.getId(), file);

        assertNotNull(response);
        assertEquals("test.pdf", response.getFileName());
        assertNotNull(response.getSummary());
    }

    @Test
    void analyze_withNonPdf_shouldThrowException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "content".getBytes()
        );

        assertThrows(IllegalArgumentException.class,
                () -> researchAssistantService.analyze(user.getId(), file));
    }
}
