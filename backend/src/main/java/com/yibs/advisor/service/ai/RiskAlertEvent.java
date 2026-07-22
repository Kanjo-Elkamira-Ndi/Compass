package com.yibs.advisor.service.ai;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class RiskAlertEvent extends ApplicationEvent {

    private final UUID studentId;
    private final String studentName;

    public RiskAlertEvent(Object source, UUID studentId, String studentName) {
        super(source);
        this.studentId = studentId;
        this.studentName = studentName;
    }
}
