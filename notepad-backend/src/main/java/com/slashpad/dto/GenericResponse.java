package com.slashpad.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenericResponse {
    private Boolean success;
    private String message;
    private String passwordHint;

    public GenericResponse(Boolean success, String message) {
        this.success = success;
        this.message = message;
        this.passwordHint = null;
    }
}
