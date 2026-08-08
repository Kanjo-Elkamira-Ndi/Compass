package com.yibs.advisor.exception;

import com.yibs.advisor.domain.complaint.ComplaintStatus;

public class InvalidStatusTransitionException extends RuntimeException {

    public InvalidStatusTransitionException(ComplaintStatus from, ComplaintStatus to) {
        super("Cannot transition complaint from " + from + " to " + to);
    }
}
