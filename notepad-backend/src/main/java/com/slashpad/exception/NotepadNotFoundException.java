package com.slashpad.exception;

public class NotepadNotFoundException extends RuntimeException {

    public NotepadNotFoundException(String username) {
        super("Notepad not found for username: " + username);
    }
}
