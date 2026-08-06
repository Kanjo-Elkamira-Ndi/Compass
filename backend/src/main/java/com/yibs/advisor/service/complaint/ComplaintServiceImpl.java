package com.yibs.advisor.service.complaint;

import com.yibs.advisor.domain.complaint.*;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.domain.user.Role;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.dto.request.CreateComplaintRequest;
import com.yibs.advisor.dto.response.*;
import com.yibs.advisor.exception.ComplaintNotFoundException;
import com.yibs.advisor.exception.InvalidStatusTransitionException;
import com.yibs.advisor.exception.StudentNotFoundException;
import com.yibs.advisor.mapper.*;
import com.yibs.advisor.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintServiceImpl implements IComplaintService {

    private static final int MAX_FILES = 5;
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final String ANONYMOUS_NAME = "Anonymous";

    private final ComplaintRepository complaintRepository;
    private final ComplaintReplyRepository replyRepository;
    private final ComplaintAttachmentRepository attachmentRepository;
    private final ComplaintStatusHistoryRepository historyRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final UserRepository userRepository;
    private final ComplaintMapper complaintMapper;
    private final ComplaintReplyMapper replyMapper;
    private final ComplaintAttachmentMapper attachmentMapper;
    private final ComplaintStatusHistoryMapper historyMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.complaints.upload-dir:./uploads/complaints}")
    private String uploadDir;

    @Override
    @Transactional
    public ComplaintResponse createComplaint(UUID studentId, CreateComplaintRequest request, List<MultipartFile> files) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException(studentId.toString()));

        validateFiles(files);

        Complaint complaint = Complaint.builder()
                .student(student)
                .subject(request.getSubject())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority())
                .anonymous(request.isAnonymous())
                .build();
        complaint = complaintRepository.save(complaint);

        saveAttachments(complaint, files);

        recordStatusChange(complaint, null, ComplaintStatus.SUBMITTED, studentId);

        eventPublisher.publishEvent(new ComplaintEvent(this, complaint, ComplaintEvent.Type.SUBMITTED, studentId));

        return buildResponse(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintSummaryResponse> listComplaints(UUID userId, Role role, String search,
                                                         ComplaintStatus status, ComplaintCategory category,
                                                         ComplaintPriority priority, Pageable pageable) {
        return complaintRepository.findAll(buildSpec(userId, role, search, status, category, priority), pageable)
                .map(this::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaint(UUID userId, Role role, UUID complaintId) {
        Complaint complaint = findComplaint(complaintId);
        assertCanAccess(complaint, userId, role);
        return buildResponse(complaint);
    }

    @Override
    @Transactional
    public ComplaintResponse addReply(UUID userId, Role role, UUID complaintId, String message) {
        Complaint complaint = findComplaint(complaintId);
        assertCanAccess(complaint, userId, role);
        if (complaint.getStatus().isTerminal()) {
            throw new IllegalArgumentException("Cannot reply to a closed complaint");
        }

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        replyRepository.save(ComplaintReply.builder()
                .complaint(complaint)
                .author(author)
                .message(message)
                .build());

        eventPublisher.publishEvent(new ComplaintEvent(this, complaint, ComplaintEvent.Type.REPLIED, userId));

        return buildResponse(complaint);
    }

    @Override
    @Transactional
    public ComplaintResponse updateStatus(UUID userId, Role role, UUID complaintId, ComplaintStatus target, String resolution) {
        Complaint complaint = findComplaint(complaintId);
        if (role != Role.ADMIN && !isAssignedTo(complaint, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        ComplaintStatus current = complaint.getStatus();
        if (!current.canTransitionTo(target)) {
            throw new InvalidStatusTransitionException(current, target);
        }

        if (target == ComplaintStatus.RESOLVED) {
            if (resolution == null || resolution.isBlank()) {
                throw new IllegalArgumentException("Resolution is required to mark a complaint as resolved");
            }
            complaint.setResolution(resolution);
        }

        complaint.setStatus(target);
        complaintRepository.save(complaint);

        recordStatusChange(complaint, current, target, userId);

        if (target == ComplaintStatus.RESOLVED) {
            eventPublisher.publishEvent(new ComplaintEvent(this, complaint, ComplaintEvent.Type.RESOLVED, userId));
        }

        return buildResponse(complaint);
    }

    @Override
    @Transactional
    public ComplaintResponse assignComplaint(UUID userId, UUID complaintId, UUID lecturerId) {
        Complaint complaint = findComplaint(complaintId);
        Lecturer lecturer = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new IllegalArgumentException("Lecturer not found: " + lecturerId));

        ComplaintStatus current = complaint.getStatus();
        complaint.setAssignedTo(lecturer);
        complaintRepository.save(complaint);

        if (current == ComplaintStatus.SUBMITTED) {
            complaint.setStatus(ComplaintStatus.ASSIGNED);
            complaintRepository.save(complaint);
            recordStatusChange(complaint, current, ComplaintStatus.ASSIGNED, userId);
        }

        eventPublisher.publishEvent(new ComplaintEvent(this, complaint, ComplaintEvent.Type.ASSIGNED, userId));

        return buildResponse(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public DownloadResult getAttachment(UUID userId, Role role, UUID complaintId, UUID attachmentId) {
        Complaint complaint = findComplaint(complaintId);
        assertCanAccess(complaint, userId, role);

        ComplaintAttachment attachment = attachmentRepository.findByIdAndComplaintId(attachmentId, complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found: " + attachmentId));

        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path resolved = base.resolve(attachment.getStorageKey()).normalize();
        if (!resolved.startsWith(base)) {
            throw new IllegalArgumentException("Invalid attachment path");
        }
        return new DownloadResult(attachmentMapper.toResponse(attachment), resolved);
    }

    private Complaint findComplaint(UUID complaintId) {
        return complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ComplaintNotFoundException(complaintId));
    }

    private void assertCanAccess(Complaint complaint, UUID userId, Role role) {
        boolean allowed = switch (role) {
            case ADMIN -> true;
            case STUDENT -> complaint.getStudent() != null && complaint.getStudent().getId().equals(userId);
            case LECTURER -> isAssignedTo(complaint, userId);
        };
        if (!allowed) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private boolean isAssignedTo(Complaint complaint, UUID userId) {
        return complaint.getAssignedTo() != null && complaint.getAssignedTo().getId().equals(userId);
    }

    private Specification<Complaint> buildSpec(UUID userId, Role role, String search,
                                               ComplaintStatus status, ComplaintCategory category,
                                               ComplaintPriority priority) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            switch (role) {
                case STUDENT -> predicates.add(cb.equal(root.get("student").get("id"), userId));
                case LECTURER -> predicates.add(cb.equal(root.get("assignedTo").get("id"), userId));
                case ADMIN -> { }
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (category != null) predicates.add(cb.equal(root.get("category"), category));
            if (priority != null) predicates.add(cb.equal(root.get("priority"), priority));
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("subject")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private ComplaintSummaryResponse toSummary(Complaint complaint) {
        ComplaintSummaryResponse summary = complaintMapper.toSummary(complaint);
        if (complaint.isAnonymous()) {
            summary.setStudentName(ANONYMOUS_NAME);
            summary.setStudentNumber(null);
        }
        summary.setReplyCount(replyRepository.countByComplaintId(complaint.getId()));
        return summary;
    }

    private ComplaintResponse buildResponse(Complaint complaint) {
        ComplaintResponse response = complaintMapper.toResponse(complaint);
        if (complaint.isAnonymous()) {
            response.setStudentId(null);
            response.setStudentNumber(null);
            response.setStudentName(ANONYMOUS_NAME);
        }

        List<ComplaintReplyResponse> replies = replyRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId())
                .stream()
                .map(replyMapper::toResponse)
                .toList();

        if (complaint.isAnonymous() && complaint.getStudent() != null) {
            UUID studentId = complaint.getStudent().getId();
            replies.forEach(reply -> {
                if (studentId.equals(reply.getAuthorId())) {
                    reply.setAuthorId(null);
                    reply.setAuthorName("Student (anonymous)");
                }
            });
        }

        response.setReplies(replies);
        response.setAttachments(attachmentRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId())
                .stream()
                .map(attachmentMapper::toResponse)
                .toList());
        response.setStatusHistory(historyRepository.findByComplaintIdOrderByChangedAtAsc(complaint.getId())
                .stream()
                .map(historyMapper::toResponse)
                .toList());
        return response;
    }

    private void recordStatusChange(Complaint complaint, ComplaintStatus from, ComplaintStatus to, UUID changedBy) {
        User user = userRepository.findById(changedBy).orElse(null);
        if (user == null) {
            return;
        }
        historyRepository.save(ComplaintStatusHistory.builder()
                .complaint(complaint)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(user)
                .build());
    }

    private void validateFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        long nonEmpty = files.stream().filter(f -> !f.isEmpty()).count();
        if (nonEmpty > MAX_FILES) {
            throw new IllegalArgumentException("A maximum of " + MAX_FILES + " files is allowed");
        }
        for (MultipartFile file : files) {
            if (!file.isEmpty() && file.getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("File exceeds the 10MB limit");
            }
        }
    }

    private void saveAttachments(Complaint complaint, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        Path complaintDir = Paths.get(uploadDir).resolve(complaint.getId().toString());
        try {
            Files.createDirectories(complaintDir);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Could not create upload directory", ex);
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }
            String fileName = sanitizeFileName(file.getOriginalFilename());
            String storageKey = complaint.getId() + "/" + UUID.randomUUID() + "_" + fileName;
            Path target = Paths.get(uploadDir).resolve(storageKey);
            try {
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException ex) {
                throw new IllegalArgumentException("Could not store file: " + fileName, ex);
            }
            attachmentRepository.save(ComplaintAttachment.builder()
                    .complaint(complaint)
                    .fileName(fileName)
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .fileSize(file.getSize())
                    .storageKey(storageKey)
                    .build());
        }
    }

    private String sanitizeFileName(String original) {
        if (original == null || original.isBlank()) {
            return "file";
        }
        return original.replace("\\", "_").replace("/", "_").replace("..", "_").trim();
    }
}
