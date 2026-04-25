package com.slashpad.service;

import com.slashpad.dto.*;
import com.slashpad.exception.NotepadNotFoundException;
import com.slashpad.exception.WrongPasswordException;
import com.slashpad.model.Notepad;
import com.slashpad.repository.NotepadRepository;
import com.slashpad.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NotepadService {

    private static final Logger logger = LoggerFactory.getLogger(NotepadService.class);

    private final NotepadRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Value("${notepad.character.limit:50000}")
    private int characterLimit;

    @Value("${notepad.expiry.days:10}")
    private int expiryDays;

    public NotepadService(NotepadRepository repository, JwtUtils jwtUtils) {
        this.repository = repository;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public NotepadResponse getNotepad(String username) {
        String normalizedUsername = normalizeUsername(username);

        Optional<Notepad> optionalNotepad = repository.findByUsernameIgnoreCase(normalizedUsername);

        Notepad notepad;
        if (optionalNotepad.isPresent()) {
            notepad = optionalNotepad.get();
            verifyJwtAccess(notepad);
        } else {
            notepad = createNewNotepad(normalizedUsername);
        }

        return buildNotepadResponse(notepad, true);
    }

    public SaveNotepadResponse saveNotepad(String username, SaveNotepadRequest request) {
        String normalizedUsername = normalizeUsername(username);
        Notepad notepad = repository.findByUsernameIgnoreCase(normalizedUsername)
                .orElseThrow(() -> new NotepadNotFoundException(normalizedUsername));

        verifyJwtAccess(notepad);

        validateContentLength(request.getContent());

        notepad.setContent(request.getContent());
        notepad.setUpdatedAt(LocalDateTime.now());
        notepad.setExpiresAt(LocalDateTime.now().plusDays(expiryDays));

        notepad = repository.save(notepad);

        logger.info("Saved notepad for username: {}", normalizedUsername);

        return new SaveNotepadResponse(
                true,
                "Notepad saved successfully",
                request.getContent() != null ? request.getContent().length() : 0,
                notepad.getExpiresAt()
        );
    }

    public VerifyPasswordResponse verifyPassword(String username, VerifyPasswordRequest request) {
        String normalizedUsername = normalizeUsername(username);
        Notepad notepad = repository.findByUsernameIgnoreCase(normalizedUsername)
                .orElseThrow(() -> new NotepadNotFoundException(normalizedUsername));

        if (verifyPassword(notepad, request.getPassword())) {
            String token = jwtUtils.generateToken(normalizedUsername);
            return new VerifyPasswordResponse(
                    true,
                    notepad.getContent(),
                    notepad.getExpiresAt(),
                    token,
                    "Successfully verified"
            );
        } else {
            throw new WrongPasswordException();
        }
    }

    public GenericResponse setPassword(String username, PasswordRequest request) {
        String normalizedUsername = normalizeUsername(username);
        Notepad notepad = repository.findByUsernameIgnoreCase(normalizedUsername)
                .orElseThrow(() -> new NotepadNotFoundException(normalizedUsername));

        verifyJwtAccess(notepad);

        notepad.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        notepad.setPasswordHint(request.getHint());
        notepad.setIsProtected(true);

        repository.save(notepad);

        logger.info("Password set for notepad: {}", normalizedUsername);

        return new GenericResponse(true, "Password set successfully");
    }

    public GenericResponse removePassword(String username) {
        String normalizedUsername = normalizeUsername(username);
        Notepad notepad = repository.findByUsernameIgnoreCase(normalizedUsername)
                .orElseThrow(() -> new NotepadNotFoundException(normalizedUsername));

        verifyJwtAccess(notepad);

        notepad.setPasswordHash(null);
        notepad.setPasswordHint(null);
        notepad.setIsProtected(false);

        repository.save(notepad);

        logger.info("Password removed for notepad: {}", normalizedUsername);

        return new GenericResponse(true, "Password removed successfully");
    }

    public HealthResponse getHealth() {
        return new HealthResponse("UP", LocalDateTime.now());
    }

    private Notepad createNewNotepad(String username) {
        Notepad notepad = new Notepad();
        notepad.setUsername(username);
        notepad.setContent("");
        notepad.setIsProtected(false);
        notepad.setExpiresAt(LocalDateTime.now().plusDays(expiryDays));
        return repository.save(notepad);
    }

    private NotepadResponse buildNotepadResponse(Notepad notepad, boolean includeContent) {
        return new NotepadResponse(
                notepad.getUsername(),
                includeContent ? notepad.getContent() : (notepad.getIsProtected() ? null : notepad.getContent()),
                notepad.getIsProtected(),
                notepad.getPasswordHint(),
                notepad.getContent() != null ? notepad.getContent().length() : 0,
                characterLimit,
                notepad.getExpiresAt(),
                (int) ChronoUnit.DAYS.between(LocalDateTime.now(), notepad.getExpiresAt()),
                notepad.getUpdatedAt()
        );
    }

    private void validateContentLength(String content) {
        if (content != null && content.length() > characterLimit) {
            throw new IllegalArgumentException("Character limit of " + characterLimit + " exceeded");
        }
    }

    private boolean verifyPassword(Notepad notepad, String password) {
        if (password == null || notepad.getPasswordHash() == null) {
            return false;
        }
        return passwordEncoder.matches(password, notepad.getPasswordHash());
    }

    private void verifyJwtAccess(Notepad notepad) {
        if (!notepad.getIsProtected()) {
            return;
        }
        String authUser = SecurityContextHolder.getContext().getAuthentication() != null ? 
                SecurityContextHolder.getContext().getAuthentication().getName() : null;
        if (!notepad.getUsername().toLowerCase().equals(authUser)) {
            throw new WrongPasswordException();
        }
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase();
    }

    public List<Notepad> getAllNotepads(){
        List<Notepad> allNotepads = repository.findAll();
        return allNotepads;
    }
}
