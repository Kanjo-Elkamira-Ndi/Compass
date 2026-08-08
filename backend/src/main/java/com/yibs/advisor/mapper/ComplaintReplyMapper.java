package com.yibs.advisor.mapper;

import com.yibs.advisor.domain.complaint.ComplaintReply;
import com.yibs.advisor.dto.response.ComplaintReplyResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ComplaintReplyMapper {

    @Mapping(target = "authorId", expression = "java(reply.getAuthor() != null ? reply.getAuthor().getId() : null)")
    @Mapping(target = "authorName", expression = "java(reply.getAuthor() != null ? reply.getAuthor().getDisplayName() : null)")
    @Mapping(target = "authorRole", expression = "java(reply.getAuthor() != null && reply.getAuthor().getRole() != null ? reply.getAuthor().getRole().name() : null)")
    ComplaintReplyResponse toResponse(ComplaintReply reply);
}
