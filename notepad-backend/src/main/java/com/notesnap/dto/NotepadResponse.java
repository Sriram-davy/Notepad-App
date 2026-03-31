package com.notesnap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotepadResponse {
    private String username;
    private String content;
    private Boolean isProtected;
    private String passwordHint;
    private Integer characterCount;
    private Integer characterLimit = 50000;
    private LocalDateTime expiresAt;
    private Integer daysUntilExpiry;
    private LocalDateTime lastSaved;
}