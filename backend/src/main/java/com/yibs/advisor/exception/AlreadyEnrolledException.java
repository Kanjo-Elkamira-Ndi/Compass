package com.yibs.advisor.exception;

public class AlreadyEnrolledException extends RuntimeException {
    public AlreadyEnrolledException() {
        super("Already enrolled in this course");
    }
}
