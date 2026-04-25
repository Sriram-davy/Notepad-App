package com.slashpad.repository;

import com.slashpad.model.Notepad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotepadRepository extends JpaRepository<Notepad, String> {

    Optional<Notepad> findByUsernameIgnoreCase(String username);

    List<Notepad> findByExpiresAtBefore(LocalDateTime dateTime);

    @Query("SELECT COUNT(n) FROM Notepad n WHERE n.expiresAt < :dateTime")
    long countByExpiresAtBefore(@Param("dateTime") LocalDateTime dateTime);

    long count();
}
