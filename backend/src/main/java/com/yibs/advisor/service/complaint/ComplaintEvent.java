package com.yibs.advisor.service.complaint;

import com.yibs.advisor.domain.complaint.Complaint;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class ComplaintEvent extends ApplicationEvent {

    public enum Type {
        SUBMITTED,
        ASSIGNED,
        REPLIED,
        RESOLVED
    }

    private final Complaint complaint;
    private final Type type;
    private final UUID actorId;

    public ComplaintEvent(Object source, Complaint complaint, Type type, UUID actorId) {
        super(source);
        this.complaint = complaint;
        this.type = type;
        this.actorId = actorId;
    }
}
