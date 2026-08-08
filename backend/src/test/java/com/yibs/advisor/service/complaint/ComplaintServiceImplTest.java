package com.yibs.advisor.service.complaint;

import com.yibs.advisor.domain.complaint.*;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.domain.user.Role;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.request.CreateComplaintRequest;
import com.yibs.advisor.dto.response.ComplaintResponse;
import com.yibs.advisor.exception.ComplaintNotFoundException;
import com.yibs.advisor.exception.InvalidStatusTransitionException;
import com.yibs.advisor.mapper.*;
import com.yibs.advisor.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceImplTest {

    @Mock private ComplaintRepository complaintRepository;
    @Mock private ComplaintReplyRepository replyRepository;
    @Mock private ComplaintAttachmentRepository attachmentRepository;
    @Mock private ComplaintStatusHistoryRepository historyRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private UserRepository userRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @TempDir
    Path tempDir;

    private ComplaintServiceImpl service;
    private Student student;
    private UUID studentId;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        student = Student.builder()
                .id(studentId)
                .email("student@yibs.com")
                .passwordHash("hash")
                .status(UserStatus.ACTIVE)
                .firstName("John")
                .lastName("Doe")
                .studentId("STU001")
                .programme("BBA")
                .yearOfStudy((short) 2)
                .build();

        service = new ComplaintServiceImpl(
                complaintRepository, replyRepository, attachmentRepository, historyRepository,
                studentRepository, lecturerRepository, userRepository,
                new ComplaintMapperImpl(), new ComplaintReplyMapperImpl(),
                new ComplaintAttachmentMapperImpl(), new ComplaintStatusHistoryMapperImpl(),
                eventPublisher);
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
    }

    private Complaint complaint(ComplaintStatus status) {
        return Complaint.builder()
                .id(UUID.randomUUID())
                .student(student)
                .subject("Broken projector")
                .description("Projector not working in room 12")
                .category(ComplaintCategory.FACILITY)
                .priority(ComplaintPriority.MEDIUM)
                .status(status)
                .build();
    }

    private void stubDetailQueries() {
        when(replyRepository.findByComplaintIdOrderByCreatedAtAsc(any())).thenReturn(List.of());
        when(attachmentRepository.findByComplaintIdOrderByCreatedAtAsc(any())).thenReturn(List.of());
        when(historyRepository.findByComplaintIdOrderByChangedAtAsc(any())).thenReturn(List.of());
    }

    @Test
    void createComplaint_shouldSaveAndReturnResponse() {
        CreateComplaintRequest request = CreateComplaintRequest.builder()
                .subject("Broken projector")
                .description("Projector not working in room 12")
                .category(ComplaintCategory.FACILITY)
                .build();

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        stubDetailQueries();

        ComplaintResponse response = service.createComplaint(studentId, request, null);

        assertNotNull(response);
        assertEquals("Broken projector", response.getSubject());
        assertEquals(ComplaintStatus.SUBMITTED, response.getStatus());
        assertEquals("John Doe", response.getStudentName());
        verify(complaintRepository).save(any(Complaint.class));
        verify(historyRepository).save(any(ComplaintStatusHistory.class));
        verify(eventPublisher).publishEvent(any(ComplaintEvent.class));
    }

    @Test
    void createComplaint_anonymous_shouldMaskStudentName() {
        CreateComplaintRequest request = CreateComplaintRequest.builder()
                .subject("Anonymous issue")
                .description("I do not want to be identified")
                .category(ComplaintCategory.OTHER)
                .anonymous(true)
                .build();

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        stubDetailQueries();

        ComplaintResponse response = service.createComplaint(studentId, request, null);

        assertTrue(response.isAnonymous());
        assertEquals("Anonymous", response.getStudentName());
        assertNull(response.getStudentId());
        assertNull(response.getStudentNumber());
    }

    @Test
    void createComplaint_withTooManyFiles_shouldThrow() {
        CreateComplaintRequest request = CreateComplaintRequest.builder()
                .subject("Issue")
                .description("Description")
                .category(ComplaintCategory.OTHER)
                .build();
        List<MultipartFile> files = List.of(
                new MockMultipartFile("files", "a.txt", "text/plain", "a".getBytes()),
                new MockMultipartFile("files", "b.txt", "text/plain", "b".getBytes()),
                new MockMultipartFile("files", "c.txt", "text/plain", "c".getBytes()),
                new MockMultipartFile("files", "d.txt", "text/plain", "d".getBytes()),
                new MockMultipartFile("files", "e.txt", "text/plain", "e".getBytes()),
                new MockMultipartFile("files", "f.txt", "text/plain", "f".getBytes()));

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));

        assertThrows(IllegalArgumentException.class,
                () -> service.createComplaint(studentId, request, files));
    }

    @Test
    void createComplaint_withOversizedFile_shouldThrow() {
        CreateComplaintRequest request = CreateComplaintRequest.builder()
                .subject("Issue")
                .description("Description")
                .category(ComplaintCategory.OTHER)
                .build();
        MockMultipartFile bigFile = new MockMultipartFile("files", "big.pdf", "application/pdf", new byte[8]) {
            @Override
            public long getSize() {
                return 10L * 1024 * 1024 + 1;
            }
        };

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));

        assertThrows(IllegalArgumentException.class,
                () -> service.createComplaint(studentId, request, List.of(bigFile)));
    }

    @Test
    void getComplaint_ownedByStudent_shouldReturn() {
        Complaint complaint = complaint(ComplaintStatus.SUBMITTED);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        stubDetailQueries();

        ComplaintResponse response = service.getComplaint(studentId, Role.STUDENT, complaint.getId());

        assertNotNull(response);
        assertEquals(complaint.getId(), response.getId());
    }

    @Test
    void getComplaint_notOwnedByStudent_shouldThrow() {
        Complaint complaint = complaint(ComplaintStatus.SUBMITTED);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThrows(AccessDeniedException.class,
                () -> service.getComplaint(UUID.randomUUID(), Role.STUDENT, complaint.getId()));
    }

    @Test
    void getComplaint_notAssignedLecturer_shouldThrow() {
        Complaint complaint = complaint(ComplaintStatus.ASSIGNED);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThrows(AccessDeniedException.class,
                () -> service.getComplaint(UUID.randomUUID(), Role.LECTURER, complaint.getId()));
    }

    @Test
    void getComplaint_admin_shouldAlwaysReturn() {
        Complaint complaint = complaint(ComplaintStatus.SUBMITTED);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        stubDetailQueries();

        ComplaintResponse response = service.getComplaint(UUID.randomUUID(), Role.ADMIN, complaint.getId());

        assertNotNull(response);
    }

    @Test
    void getComplaint_notFound_shouldThrow() {
        when(complaintRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(ComplaintNotFoundException.class,
                () -> service.getComplaint(studentId, Role.STUDENT, UUID.randomUUID()));
    }

    @Test
    void addReply_shouldSaveAndReturn() {
        Complaint complaint = complaint(ComplaintStatus.IN_PROGRESS);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(replyRepository.save(any(ComplaintReply.class))).thenAnswer(inv -> inv.getArgument(0));
        stubDetailQueries();

        ComplaintResponse response = service.addReply(studentId, Role.STUDENT, complaint.getId(), "Thank you");

        assertNotNull(response);
        verify(replyRepository).save(any(ComplaintReply.class));
        verify(eventPublisher).publishEvent(any(ComplaintEvent.class));
    }

    @Test
    void addReply_onClosedComplaint_shouldThrow() {
        Complaint complaint = complaint(ComplaintStatus.CLOSED);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThrows(IllegalArgumentException.class,
                () -> service.addReply(studentId, Role.STUDENT, complaint.getId(), "Reply"));
    }

    @Test
    void updateStatus_validTransition_shouldUpdate() {
        Complaint complaint = complaint(ComplaintStatus.SUBMITTED);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        stubDetailQueries();

        ComplaintResponse response = service.updateStatus(
                studentId, Role.ADMIN, complaint.getId(), ComplaintStatus.IN_PROGRESS, null);

        assertEquals(ComplaintStatus.IN_PROGRESS, response.getStatus());
        verify(historyRepository).save(any(ComplaintStatusHistory.class));
    }

    @Test
    void updateStatus_invalidTransition_shouldThrow() {
        Complaint complaint = complaint(ComplaintStatus.SUBMITTED);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThrows(InvalidStatusTransitionException.class,
                () -> service.updateStatus(
                        studentId, Role.ADMIN, complaint.getId(), ComplaintStatus.CLOSED, null));
    }

    @Test
    void updateStatus_toResolved_withoutResolution_shouldThrow() {
        Complaint complaint = complaint(ComplaintStatus.IN_PROGRESS);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThrows(IllegalArgumentException.class,
                () -> service.updateStatus(
                        studentId, Role.ADMIN, complaint.getId(), ComplaintStatus.RESOLVED, null));
    }

    @Test
    void updateStatus_toResolved_shouldStoreResolutionAndNotify() {
        Complaint complaint = complaint(ComplaintStatus.IN_PROGRESS);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        stubDetailQueries();

        ComplaintResponse response = service.updateStatus(
                studentId, Role.ADMIN, complaint.getId(), ComplaintStatus.RESOLVED, "Fixed the projector");

        assertEquals(ComplaintStatus.RESOLVED, response.getStatus());
        assertEquals("Fixed the projector", response.getResolution());
        verify(eventPublisher).publishEvent(any(ComplaintEvent.class));
    }

    @Test
    void updateStatus_unassignedLecturer_shouldThrow() {
        Complaint complaint = complaint(ComplaintStatus.SUBMITTED);
        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThrows(AccessDeniedException.class,
                () -> service.updateStatus(
                        UUID.randomUUID(), Role.LECTURER, complaint.getId(), ComplaintStatus.IN_PROGRESS, null));
    }

    @Test
    void assignComplaint_submitted_shouldSetAssignedStatus() {
        Complaint complaint = complaint(ComplaintStatus.SUBMITTED);
        UUID lecturerId = UUID.randomUUID();
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

        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(lecturerRepository.findById(lecturerId)).thenReturn(Optional.of(lecturer));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        stubDetailQueries();

        ComplaintResponse response = service.assignComplaint(studentId, complaint.getId(), lecturerId);

        assertEquals(ComplaintStatus.ASSIGNED, response.getStatus());
        assertEquals(lecturerId, response.getAssignedTo());
        verify(eventPublisher).publishEvent(any(ComplaintEvent.class));
    }

    @Test
    void getAttachment_shouldResolveStoredFile() throws Exception {
        Complaint complaint = complaint(ComplaintStatus.SUBMITTED);
        complaint.setAnonymous(true);
        ComplaintAttachment attachment = ComplaintAttachment.builder()
                .id(UUID.randomUUID())
                .complaint(complaint)
                .fileName("proof.txt")
                .contentType("text/plain")
                .fileSize(4L)
                .storageKey(complaint.getId() + "/abc_proof.txt")
                .build();
        java.nio.file.Files.createDirectories(tempDir.resolve(complaint.getId().toString()));
        java.nio.file.Files.write(tempDir.resolve(attachment.getStorageKey()), "data".getBytes());

        when(complaintRepository.findById(complaint.getId())).thenReturn(Optional.of(complaint));
        when(attachmentRepository.findByIdAndComplaintId(attachment.getId(), complaint.getId()))
                .thenReturn(Optional.of(attachment));

        IComplaintService.DownloadResult result = service.getAttachment(
                studentId, Role.STUDENT, complaint.getId(), attachment.getId());

        assertEquals("proof.txt", result.meta().getFileName());
        assertTrue(java.nio.file.Files.exists(result.path()));
    }
}
