package com.yibs.advisor.mapper;

import com.yibs.advisor.domain.notification.Notification;
import com.yibs.advisor.dto.response.NotificationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface NotificationMapper {

    NotificationResponse toResponse(Notification notification);
}
