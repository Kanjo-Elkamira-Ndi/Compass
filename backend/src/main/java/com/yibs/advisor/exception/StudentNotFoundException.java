package com.yibs.advisor.exception;

public class StudentNotFoundException extends RuntimeException {
    public StudentNotFoundException(String id) {
        super("Student not found: " + id);
    }
}
