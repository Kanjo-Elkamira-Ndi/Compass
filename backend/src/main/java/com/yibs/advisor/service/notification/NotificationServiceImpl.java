package com.yibs.advisor.service.notification;

import com.yibs.advisor.domain.notification.Notification;
import com.yibs.advisor.domain.notification.NotificationType;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.dto.response.NotificationResponse;
import com.yibs.advisor.mapper.NotificationMapper;
import com.yibs.advisor.repository.NotificationRepository;
import com.yibs.advisor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements INotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public void create(UUID userId, NotificationType type, String title, String body, String link) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        notificationRepository.save(Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(UUID userId, boolean unreadOnly, Pageable pageable) {
        Page<Notification> notifications = unreadOnly
                ? notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(notificationMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(UUID userId, UUID notificationId) {
        notificationRepository.findByIdAndUserId(notificationId, userId).ifPresent(n -> n.setRead(true));
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId, Pageable.unpaged())
                .forEach(n -> n.setRead(true));
    }
}
