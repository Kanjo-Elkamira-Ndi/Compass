package com.yibs.advisor.mapper;

import com.yibs.advisor.domain.complaint.ComplaintAttachment;
import com.yibs.advisor.dto.response.ComplaintAttachmentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ComplaintAttachmentMapper {

    ComplaintAttachmentResponse toResponse(ComplaintAttachment attachment);
}
