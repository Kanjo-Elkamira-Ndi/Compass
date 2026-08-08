package com.yibs.advisor.service.notification;

import com.yibs.advisor.domain.notification.NotificationType;
import com.yibs.advisor.dto.response.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface INotificationService {

    void create(UUID userId, NotificationType type, String title, String body, String link);

    Page<NotificationResponse> getMyNotifications(UUID userId, boolean unreadOnly, Pageable pageable);

    long getUnreadCount(UUID userId);

    void markAsRead(UUID userId, UUID notificationId);

    void markAllAsRead(UUID userId);
}
