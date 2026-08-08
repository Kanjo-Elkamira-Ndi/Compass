package com.yibs.advisor.domain.complaint;

import java.util.Map;
import java.util.Set;

public enum ComplaintStatus {
    SUBMITTED,
    ASSIGNED,
    IN_PROGRESS,
    RESOLVED,
    CLOSED;

    private static final Map<ComplaintStatus, Set<ComplaintStatus>> ALLOWED_TRANSITIONS = Map.of(
            SUBMITTED, Set.of(ASSIGNED, IN_PROGRESS),
            ASSIGNED, Set.of(IN_PROGRESS),
            IN_PROGRESS, Set.of(RESOLVED),
            RESOLVED, Set.of(CLOSED),
            CLOSED, Set.of()
    );

    public boolean canTransitionTo(ComplaintStatus target) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Set.of()).contains(target);
    }

    public boolean isTerminal() {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Set.of()).isEmpty();
    }
}
