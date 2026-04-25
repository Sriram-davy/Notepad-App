package com.slashpad.scheduler;

import com.slashpad.model.Notepad;
import com.slashpad.repository.NotepadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
}
