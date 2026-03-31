package com.notesnap.exception;

public class WrongPasswordException extends RuntimeException {

    public WrongPasswordException() {
        super("Password required for this notepad");
    }
}