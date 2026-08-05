package com.yibs.advisor.service.complaint;

import com.yibs.advisor.domain.complaint.Complaint;
import com.yibs.advisor.domain.notification.NotificationType;
import com.yibs.advisor.domain.user.Role;
import com.yibs.advisor.domain.user.User;
import com.yibs.advisor.repository.UserRepository;
import com.yibs.advisor.service.notification.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ComplaintNotificationListener {

    private final INotificationService notificationService;
    private final UserRepository userRepository;

    @EventListener
    @Async
    public void handle(ComplaintEvent event) {
        Complaint complaint = event.getComplaint();
        try {
            switch (event.getType()) {
                case SUBMITTED -> notifyAdmins(
                        "New complaint filed",
                        "A new " + complaint.getCategory() + " complaint was submitted: " + complaint.getSubject(),
                        "/admin/complaints/" + complaint.getId());
                case ASSIGNED -> {
                    if (complaint.getAssignedTo() != null) {
                        notificationService.create(
                                complaint.getAssignedTo().getId(),
                                NotificationType.COMPLAINT_ASSIGNED,
                                "Complaint assigned to you",
                                complaint.getSubject(),
                                "/lecturer/complaints/" + complaint.getId());
                    }
                }
                case REPLIED -> handleReplied(complaint, event.getActorId());
                case RESOLVED -> notificationService.create(
                        complaint.getStudent().getId(),
                        NotificationType.COMPLAINT_RESOLVED,
                        "Your complaint was resolved",
                        complaint.getSubject(),
                        "/student/complaints/" + complaint.getId());
            }
        } catch (Exception ex) {
            log.warn("Failed to create complaint notifications: {}", ex.getMessage());
        }
    }

    private void handleReplied(Complaint complaint, UUID actorId) {
        boolean actorIsStudent = complaint.getStudent().getId().equals(actorId);
        String subject = complaint.getSubject();

        if (actorIsStudent) {
            notifyAdmins(
                    "New reply to a complaint",
                    "A student replied to the complaint: " + subject,
                    "/admin/complaints/" + complaint.getId());
            if (complaint.getAssignedTo() != null) {
                notificationService.create(
                        complaint.getAssignedTo().getId(),
                        NotificationType.COMPLAINT_REPLIED,
                        "New reply to your complaint",
                        subject,
                        "/lecturer/complaints/" + complaint.getId());
            }
        } else {
            notificationService.create(
                    complaint.getStudent().getId(),
                    NotificationType.COMPLAINT_REPLIED,
                    "You received a reply on your complaint",
                    subject,
                    "/student/complaints/" + complaint.getId());
        }
    }

    private void notifyAdmins(String title, String body, String link) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.create(admin.getId(), NotificationType.COMPLAINT_SUBMITTED, title, body, link);
        }
    }
}
