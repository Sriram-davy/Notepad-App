package com.notesnap.scheduler;

import com.notesnap.model.Notepad;
import com.notesnap.repository.NotepadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class NotepadScheduler {

    private static final Logger logger = LoggerFactory.getLogger(NotepadScheduler.class);

    private final NotepadRepository repository;

    public NotepadScheduler(NotepadRepository repository) {
        this.repository = repository;
    }

    @Scheduled(cron = "0 0 0 * * *") // Every day at midnight
    @Transactional
    public void deleteExpiredNotepads() {
        LocalDateTime now = LocalDateTime.now();
        List<Notepad> expiredNotepads = repository.findByExpiresAtBefore(now);

        if (!expiredNotepads.isEmpty()) {
            repository.deleteAll(expiredNotepads);
            logger.info("Deleted {} expired notepads", expiredNotepads.size());
        } else {
            logger.info("No expired notepads to delete");
        }
    }

    @Scheduled(cron = "0 0 */6 * * *") // Every 6 hours
    public void backupNotepads() {
        LocalDateTime now = LocalDateTime.now();
        String timestamp = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String filename = "backup/notesnap_backup_" + timestamp + ".sql";

        List<Notepad> notepads = repository.findAll();

        try (FileWriter writer = new FileWriter(filename)) {
            for (Notepad notepad : notepads) {
                String insertSql = generateInsertSql(notepad);
                writer.write(insertSql + ";\n");
                notepad.setLastBackedUpAt(now);
            }
            repository.saveAll(notepads);
            logger.info("Backup completed: {} notepads backed up to {}", notepads.size(), filename);
            cleanupOldBackups();
        } catch (IOException e) {
            logger.error("Failed to create backup: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void logStats() {
        long totalNotepads = repository.count();
        long protectedNotepads = repository.findAll().stream()
                .mapToLong(n -> n.getIsProtected() ? 1 : 0)
                .sum();
        long expiringSoon = repository.countByExpiresAtBefore(LocalDateTime.now().plusDays(1));

        logger.info("Notepad stats - Total: {}, Protected: {}, Expiring within 24h: {}",
                totalNotepads, protectedNotepads, expiringSoon);
    }

    private String generateInsertSql(Notepad notepad) {
        return String.format(
                "INSERT INTO notepads (username, content, password_hash, password_hint, is_protected, created_at, updated_at, expires_at, last_backed_up_at) VALUES ('%s', '%s', '%s', '%s', %b, '%s', '%s', '%s', '%s')",
                escapeSql(notepad.getUsername()),
                escapeSql(notepad.getContent()),
                escapeSql(notepad.getPasswordHash()),
                escapeSql(notepad.getPasswordHint()),
                notepad.getIsProtected(),
                notepad.getCreatedAt(),
                notepad.getUpdatedAt(),
                notepad.getExpiresAt(),
                notepad.getLastBackedUpAt()
        );
    }

    private String escapeSql(String value) {
        if (value == null) return "NULL";
        return value.replace("'", "''");
    }

    private void cleanupOldBackups() throws IOException {
        Path backupDir = Paths.get("backup");
        if (!Files.exists(backupDir)) return;

        List<Path> backupFiles = Files.list(backupDir)
                .filter(p -> p.toString().startsWith("notesnap_backup_"))
                .sorted((p1, p2) -> p2.toString().compareTo(p1.toString())) // newest first
                .toList();

        if (backupFiles.size() > 4) {
            for (int i = 4; i < backupFiles.size(); i++) {
                Files.delete(backupFiles.get(i));
                logger.info("Deleted old backup: {}", backupFiles.get(i));
            }
        }
    }
}