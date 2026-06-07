package com.slashpad.controller;

import com.slashpad.dto.*;
import com.slashpad.service.NotepadService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notepad")
public class NotepadController {

    private static final Logger logger = LoggerFactory.getLogger(NotepadController.class);
    private final NotepadService service;

    public NotepadController(NotepadService service) {
        this.service = service;
    }

    @GetMapping("/{username}")
    public ResponseEntity<NotepadResponse> getNotepad(@PathVariable String username) {
        logger.info("GET request received to load/create notepad for username: [{}]", username);
        NotepadResponse response = service.getNotepad(username);
        logger.info("Successfully fetched notepad for username: [{}], isProtected: {}", username, response.getIsProtected());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{username}/share")
    public ResponseEntity<NotepadResponse> getShareView(@PathVariable String username) {
        logger.info("GET share view request received for username: [{}]", username);
        NotepadResponse response = service.getShareView(username);
        logger.info("Successfully fetched share view for username: [{}]", username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{username}/save")
    public ResponseEntity<SaveNotepadResponse> saveNotepad(
            @PathVariable String username,
            @Valid @RequestBody SaveNotepadRequest request) {
        logger.info("POST request received to save notepad content for username: [{}], content length: {}", 
                username, request.getContent() != null ? request.getContent().length() : 0);
        SaveNotepadResponse response = service.saveNotepad(username, request);
        logger.info("Successfully saved notepad for username: [{}]", username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{username}/verify")
    public ResponseEntity<VerifyPasswordResponse> verifyPassword(
            @PathVariable String username,
            @Valid @RequestBody VerifyPasswordRequest request) {
        logger.info("POST request received to verify password for username: [{}]", username);
        VerifyPasswordResponse response = service.verifyPassword(username, request);
        logger.info("Password verification result for username [{}]: verified = {}", username, response.getVerified());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{username}/password")
    public ResponseEntity<PasswordResponse> setPassword(
            @PathVariable String username,
            @Valid @RequestBody PasswordRequest request) {
        logger.info("PUT request received to set password for username: [{}]", username);
        PasswordResponse response = service.setPassword(username, request);
        logger.info("Successfully set password for username: [{}]", username);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{username}/password")
    public ResponseEntity<GenericResponse> removePassword(
            @PathVariable String username) {
        logger.info("DELETE request received to remove password for username: [{}]", username);
        GenericResponse response = service.removePassword(username);
        logger.info("Successfully removed password for username: [{}]", username);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        logger.debug("GET health check request received");
        HealthResponse response = service.getHealth();
        return ResponseEntity.ok(response);
    }
}
