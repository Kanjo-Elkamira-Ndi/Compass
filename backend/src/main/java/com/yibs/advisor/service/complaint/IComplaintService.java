package com.yibs.advisor.service.complaint;

import com.yibs.advisor.domain.complaint.ComplaintCategory;
import com.yibs.advisor.domain.complaint.ComplaintPriority;
import com.yibs.advisor.domain.complaint.ComplaintStatus;
import com.yibs.advisor.domain.user.Role;
import com.yibs.advisor.dto.request.CreateComplaintRequest;
import com.yibs.advisor.dto.response.ComplaintAttachmentResponse;
import com.yibs.advisor.dto.response.ComplaintResponse;
import com.yibs.advisor.dto.response.ComplaintSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

public interface IComplaintService {

    ComplaintResponse createComplaint(UUID studentId, CreateComplaintRequest request, List<MultipartFile> files);

    Page<ComplaintSummaryResponse> listComplaints(UUID userId, Role role, String search,
                                                  ComplaintStatus status, ComplaintCategory category,
                                                  ComplaintPriority priority, Pageable pageable);

    ComplaintResponse getComplaint(UUID userId, Role role, UUID complaintId);

    ComplaintResponse addReply(UUID userId, Role role, UUID complaintId, String message);

    ComplaintResponse updateStatus(UUID userId, Role role, UUID complaintId, ComplaintStatus target, String resolution);

    ComplaintResponse assignComplaint(UUID userId, UUID complaintId, UUID lecturerId);

    DownloadResult getAttachment(UUID userId, Role role, UUID complaintId, UUID attachmentId);

    record DownloadResult(ComplaintAttachmentResponse meta, Path path) {
    }
}
