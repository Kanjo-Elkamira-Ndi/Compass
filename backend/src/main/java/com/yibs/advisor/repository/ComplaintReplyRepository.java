package com.yibs.advisor.repository;

import com.yibs.advisor.domain.complaint.ComplaintReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintReplyRepository extends JpaRepository<ComplaintReply, UUID> {

    List<ComplaintReply> findByComplaintIdOrderByCreatedAtAsc(UUID complaintId);

    long countByComplaintId(UUID complaintId);
}
