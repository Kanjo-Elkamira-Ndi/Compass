package com.yibs.advisor.dto.response;

import com.yibs.advisor.domain.notification.NotificationType;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private UUID id;
    private NotificationType type;
    private String title;
    private String body;
    private String link;
    private boolean read;
    private OffsetDateTime createdAt;
}
