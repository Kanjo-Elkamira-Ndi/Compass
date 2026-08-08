package com.yibs.advisor.repository;

import com.yibs.advisor.domain.complaint.Complaint;
import com.yibs.advisor.domain.complaint.ComplaintCategory;
import com.yibs.advisor.domain.complaint.ComplaintPriority;
import com.yibs.advisor.domain.complaint.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID>, JpaSpecificationExecutor<Complaint> {

    Page<Complaint> findByStudentId(UUID studentId, Pageable pageable);

    Page<Complaint> findByAssignedToId(UUID lecturerId, Pageable pageable);

    long countByStatus(ComplaintStatus status);

    long countByCategory(ComplaintCategory category);

    long countByPriority(ComplaintPriority priority);
}
