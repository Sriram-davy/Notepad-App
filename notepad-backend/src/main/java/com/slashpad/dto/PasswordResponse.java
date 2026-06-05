package com.slashpad.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class PasswordResponse extends GenericResponse {
    private String token;

    public PasswordResponse(Boolean success, String message, String token) {
        super(success, message);
        this.token = token;
    }
}
