package com.yibs.advisor.repository;

import com.yibs.advisor.domain.complaint.ComplaintAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComplaintAttachmentRepository extends JpaRepository<ComplaintAttachment, UUID> {

    List<ComplaintAttachment> findByComplaintIdOrderByCreatedAtAsc(UUID complaintId);

    Optional<ComplaintAttachment> findByIdAndComplaintId(UUID id, UUID complaintId);
}
