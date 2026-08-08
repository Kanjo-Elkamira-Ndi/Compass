package com.yibs.advisor.repository;

import com.yibs.advisor.domain.complaint.ComplaintStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintStatusHistoryRepository extends JpaRepository<ComplaintStatusHistory, UUID> {

    List<ComplaintStatusHistory> findByComplaintIdOrderByChangedAtAsc(UUID complaintId);
}
