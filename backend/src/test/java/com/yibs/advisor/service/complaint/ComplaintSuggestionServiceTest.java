package com.yibs.advisor.service.complaint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.complaint.Complaint;
import com.yibs.advisor.domain.complaint.ComplaintCategory;
import com.yibs.advisor.domain.complaint.ComplaintPriority;
import com.yibs.advisor.domain.complaint.ComplaintStatus;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.domain.user.Role;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.exception.ComplaintNotFoundException;
import com.yibs.advisor.repository.ComplaintReplyRepository;
import com.yibs.advisor.repository.ComplaintRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComplaintSuggestionServiceTest {

    @Mock private AIProviderStrategy aiProvider;
    @Mock private ComplaintRepository complaintRepository;
    @Mock private ComplaintReplyRepository replyRepository;

    private ComplaintSuggestionService service;
    private Complaint complaint;
    private UUID lecturerId;

    @BeforeEach
    void setUp() {
        lecturerId = UUID.randomUUID();
        Lecturer lecturer = Lecturer.builder()
                .id(lecturerId)
                .email("lecturer@yibs.com")
                .passwordHash("hash")
                .status(UserStatus.ACTIVE)
                .firstName("Jane")
                .lastName("Smith")
                .staffId("LEC001")
                .department("IT")
                .build();

        Student student = Student.builder()
                .id(UUID.randomUUID())
                .email("student@yibs.com")
                .passwordHash("hash")
                .status(UserStatus.ACTIVE)
                .firstName("John")
                .lastName("Doe")
                .studentId("STU001")
                .programme("BBA")
                .yearOfStudy((short) 2)
                .build();

        complaint = Complaint.builder()
                .id(UUID.randomUUID())
                .student(student)
                .subject("Broken projector")
                .description("Projector not working in room 12")
                .category(ComplaintCategory.FACILITY)
                .priority(ComplaintPriority.MEDIUM)
                .status(ComplaintStatus.IN_PROGRESS)
                .assignedTo(lecturer)
                .build();

        service = new ComplaintSuggestionService(
                aiProvider, complaintRepository, replyRepository, new ObjectMapper());
    }

    @Test
    void suggestReply_shouldReturnParsedSuggestion() {
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(replyRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId())).thenReturn(List.of());
        when(aiProvider.chatWithJsonResponse(any(), any()))
                .thenReturn("{\"suggestion\":\"We are looking into the projector issue.\"}");

        String suggestion = service.suggestReply(lecturerId, Role.LECTURER, complaint.getId());

        assertEquals("We are looking into the projector issue.", suggestion);
    }

    @Test
    void suggestReply_whenAiThrows_shouldReturnFallback() {
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(replyRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId())).thenReturn(List.of());
        when(aiProvider.chatWithJsonResponse(any(), any())).thenThrow(new RuntimeException("AI down"));

        String suggestion = service.suggestReply(lecturerId, Role.LECTURER, complaint.getId());

        assertTrue(suggestion.toLowerCase().contains("facility"));
        assertFalse(suggestion.isBlank());
    }

    @Test
    void suggestReply_whenInvalidJson_shouldReturnFallback() {
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(replyRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId())).thenReturn(List.of());
        when(aiProvider.chatWithJsonResponse(any(), any())).thenReturn("this is not json");

        String suggestion = service.suggestReply(lecturerId, Role.LECTURER, complaint.getId());

        assertFalse(suggestion.isBlank());
    }

    @Test
    void suggestReply_lecturerNotAssigned_shouldThrow() {
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThrows(AccessDeniedException.class,
                () -> service.suggestReply(UUID.randomUUID(), Role.LECTURER, complaint.getId()));
    }

    @Test
    void suggestReply_admin_shouldAllow() {
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(replyRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId())).thenReturn(List.of());
        when(aiProvider.chatWithJsonResponse(any(), any()))
                .thenReturn("{\"suggestion\":\"Admin suggestion.\"}");

        String suggestion = service.suggestReply(UUID.randomUUID(), Role.ADMIN, complaint.getId());

        assertEquals("Admin suggestion.", suggestion);
    }

    @Test
    void suggestReply_complaintNotFound_shouldThrow() {
        when(complaintRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(ComplaintNotFoundException.class,
                () -> service.suggestReply(lecturerId, Role.LECTURER, UUID.randomUUID()));
    }
}
