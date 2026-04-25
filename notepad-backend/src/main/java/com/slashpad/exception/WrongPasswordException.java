package com.slashpad.exception;

public class WrongPasswordException extends RuntimeException {

    public WrongPasswordException() {
        super("Password required for this notepad");
    }
}
