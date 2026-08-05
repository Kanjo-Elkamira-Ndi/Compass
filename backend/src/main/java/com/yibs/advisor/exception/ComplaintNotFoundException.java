package com.yibs.advisor.exception;

import java.util.UUID;

public class ComplaintNotFoundException extends RuntimeException {

    public ComplaintNotFoundException(UUID id) {
        super("Complaint not found: " + id);
    }
}
