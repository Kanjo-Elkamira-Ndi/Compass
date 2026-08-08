package com.yibs.advisor.mapper;

import com.yibs.advisor.domain.complaint.Complaint;
import com.yibs.advisor.dto.response.ComplaintResponse;
import com.yibs.advisor.dto.response.ComplaintSummaryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ComplaintMapper {

    @Mapping(target = "studentName", expression = "java(complaint.getStudent() != null ? complaint.getStudent().getDisplayName() : null)")
    @Mapping(target = "studentNumber", expression = "java(complaint.getStudent() != null ? complaint.getStudent().getStudentId() : null)")
    @Mapping(target = "assigneeName", expression = "java(complaint.getAssignedTo() != null ? complaint.getAssignedTo().getDisplayName() : null)")
    @Mapping(target = "replyCount", ignore = true)
    ComplaintSummaryResponse toSummary(Complaint complaint);

    @Mapping(target = "studentId", expression = "java(complaint.getStudent() != null ? complaint.getStudent().getId() : null)")
    @Mapping(target = "studentName", expression = "java(complaint.getStudent() != null ? complaint.getStudent().getDisplayName() : null)")
    @Mapping(target = "studentNumber", expression = "java(complaint.getStudent() != null ? complaint.getStudent().getStudentId() : null)")
    @Mapping(target = "assignedTo", expression = "java(complaint.getAssignedTo() != null ? complaint.getAssignedTo().getId() : null)")
    @Mapping(target = "assigneeName", expression = "java(complaint.getAssignedTo() != null ? complaint.getAssignedTo().getDisplayName() : null)")
    @Mapping(target = "replies", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "statusHistory", ignore = true)
    ComplaintResponse toResponse(Complaint complaint);
}
