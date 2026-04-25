package com.slashpad.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyPasswordResponse {
    private Boolean verified;
    private String content;
    private LocalDateTime expiresAt;
    private String token;
    private String message;
}
