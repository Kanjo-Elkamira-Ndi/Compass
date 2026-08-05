package com.yibs.advisor.mapper;

import com.yibs.advisor.domain.complaint.ComplaintStatusHistory;
import com.yibs.advisor.dto.response.ComplaintStatusHistoryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ComplaintStatusHistoryMapper {

    @Mapping(target = "changedByName", expression = "java(history.getChangedBy() != null ? history.getChangedBy().getDisplayName() : null)")
    ComplaintStatusHistoryResponse toResponse(ComplaintStatusHistory history);
}
