package com.yibs.advisor.service.notification;

import com.yibs.advisor.domain.notification.Notification;
import com.yibs.advisor.domain.notification.NotificationType;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.NotificationResponse;
import com.yibs.advisor.mapper.NotificationMapperImpl;
import com.yibs.advisor.repository.NotificationRepository;
import com.yibs.advisor.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;

    private NotificationServiceImpl service;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        service = new NotificationServiceImpl(notificationRepository, userRepository, new NotificationMapperImpl());
    }

    private Student user() {
        return Student.builder()
                .id(userId)
                .email("user@yibs.com")
                .passwordHash("hash")
                .status(UserStatus.ACTIVE)
                .firstName("John")
                .lastName("Doe")
                .studentId("STU001")
                .programme("BBA")
                .yearOfStudy((short) 2)
                .build();
    }

    private Notification notification(boolean read) {
        return Notification.builder()
                .id(UUID.randomUUID())
                .user(user())
                .type(NotificationType.COMPLAINT_ASSIGNED)
                .title("Assigned")
                .body("body")
                .link("/admin/complaints/abc")
                .read(read)
                .build();
    }

    @Test
    void create_shouldSave() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user()));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        service.create(userId, NotificationType.COMPLAINT_ASSIGNED, "Assigned", "body", "/link");

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void create_userNotFound_shouldSkip() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        service.create(userId, NotificationType.COMPLAINT_ASSIGNED, "Assigned", "body", "/link");

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void getMyNotifications_shouldMapPage() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 20)))
                .thenReturn(new PageImpl<>(List.of(notification(true))));

        Page<NotificationResponse> result = service.getMyNotifications(userId, false, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().get(0).isRead());
    }

    @Test
    void getUnreadCount_shouldReturnCount() {
        when(notificationRepository.countByUserIdAndReadFalse(userId)).thenReturn(3L);

        assertEquals(3L, service.getUnreadCount(userId));
    }

    @Test
    void markAsRead_found_shouldUpdate() {
        Notification notification = notification(false);
        when(notificationRepository.findByIdAndUserId(notification.getId(), userId))
                .thenReturn(Optional.of(notification));

        service.markAsRead(userId, notification.getId());

        assertTrue(notification.isRead());
    }

    @Test
    void markAsRead_notFound_shouldNotThrow() {
        when(notificationRepository.findByIdAndUserId(any(), any())).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> service.markAsRead(userId, UUID.randomUUID()));
    }

    @Test
    void markAllAsRead_shouldUpdateUnread() {
        List<Notification> unread = List.of(notification(false), notification(false));
        when(notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId, org.springframework.data.domain.Pageable.unpaged()))
                .thenReturn(new PageImpl<>(unread));

        service.markAllAsRead(userId);

        assertTrue(unread.stream().allMatch(Notification::isRead));
    }
}
