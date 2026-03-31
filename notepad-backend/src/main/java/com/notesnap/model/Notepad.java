package com.notesnap.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notepads", indexes = {
    @Index(name = "idx_username", columnList = "username", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notepad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(columnDefinition = "CLOB")
    private String content;

    @Column(length = 255)
    private String passwordHash;

    @Column(length = 255)
    private String passwordHint;

    @Column(nullable = false)
    private Boolean isProtected = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime lastBackedUpAt;

    // Custom setter for content to enforce character limit
    public void setContent(String content) {
        if (content != null && content.length() > 50000) {
            throw new IllegalArgumentException("Character limit of 50,000 exceeded");
        }
        this.content = content;
    }
}