package com.yibs.advisor.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RiskAlertListener {

    @EventListener
    @Async
    public void handleRiskAlert(RiskAlertEvent event) {
        log.warn("CRITICAL RISK ALERT: Student {} ({}) has been classified as CRITICAL risk!",
                event.getStudentName(), event.getStudentId());

        // TODO: Send email notification to lecturer/admin
        // TODO: Create notification record in database
    }
}
