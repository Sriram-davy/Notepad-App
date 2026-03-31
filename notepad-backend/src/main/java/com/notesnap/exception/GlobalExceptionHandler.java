package com.notesnap.exception;

import com.notesnap.dto.GenericResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotepadNotFoundException.class)
    public ResponseEntity<GenericResponse> handleNotepadNotFound(NotepadNotFoundException ex) {
        logger.warn("Notepad not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new GenericResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(WrongPasswordException.class)
    public ResponseEntity<GenericResponse> handleWrongPassword(WrongPasswordException ex) {
        logger.warn("Wrong password attempt");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new GenericResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<GenericResponse> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Invalid request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new GenericResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<GenericResponse> handleGeneral(Exception ex) {
        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new GenericResponse(false, "An unexpected error occurred"));
    }
}