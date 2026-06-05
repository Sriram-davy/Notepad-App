package com.slashpad.exception;

public class WrongPasswordException extends RuntimeException {
    private final String passwordHint;

    public WrongPasswordException() {
        super("Password required for this notepad");
        this.passwordHint = null;
    }

    public WrongPasswordException(String passwordHint) {
        super("Password required for this notepad");
        this.passwordHint = passwordHint;
    }

    public String getPasswordHint() {
        return passwordHint;
    }
}
