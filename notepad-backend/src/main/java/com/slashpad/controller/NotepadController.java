package com.slashpad.controller;

import com.slashpad.dto.*;
import com.slashpad.model.Notepad;
import com.slashpad.service.NotepadService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notepad")
public class NotepadController {

    private final NotepadService service;

    public NotepadController(NotepadService service) {
        this.service = service;
    }

    @GetMapping("/{username}")
    public ResponseEntity<NotepadResponse> getNotepad(@PathVariable String username) {
        NotepadResponse response = service.getNotepad(username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{username}/save")
    public ResponseEntity<SaveNotepadResponse> saveNotepad(
            @PathVariable String username,
            @Valid @RequestBody SaveNotepadRequest request) {
        SaveNotepadResponse response = service.saveNotepad(username, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{username}/verify")
    public ResponseEntity<VerifyPasswordResponse> verifyPassword(
            @PathVariable String username,
            @Valid @RequestBody VerifyPasswordRequest request) {
        VerifyPasswordResponse response = service.verifyPassword(username, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{username}/password")
    public ResponseEntity<GenericResponse> setPassword(
            @PathVariable String username,
            @Valid @RequestBody PasswordRequest request) {
        GenericResponse response = service.setPassword(username, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{username}/password")
    public ResponseEntity<GenericResponse> removePassword(
            @PathVariable String username) {
        GenericResponse response = service.removePassword(username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        HealthResponse response = service.getHealth();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/debug/all")
    public ResponseEntity<List<Notepad>> getAllNotepads() {
        List<Notepad> notepads = service.getAllNotepads();
        return ResponseEntity.ok(notepads);
    }
}
