package com.slashpad.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveNotepadResponse {
    private Boolean success;
    private String message;
    private Integer characterCount;
    private LocalDateTime expiresAt;
}
