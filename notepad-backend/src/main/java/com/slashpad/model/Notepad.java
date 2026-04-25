package com.slashpad.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notepads")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notepad {

    @Id
    @Column(nullable = false, length = 100)
    private String username;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 255)
    private String passwordHash;

    @Column(length = 255)
    private String passwordHint;

    @Column(nullable = false)
    private Boolean isProtected = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // Removed lastBackedUpAt (backup logic is being removed)

    // Custom setter for content to enforce character limit
    public void setContent(String content) {
        if (content != null && content.length() > 50000) {
            throw new IllegalArgumentException("Character limit of 50,000 exceeded");
        }
        this.content = content;
    }
}
