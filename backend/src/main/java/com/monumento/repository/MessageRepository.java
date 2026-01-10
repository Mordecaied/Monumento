package com.monumento.repository;

import com.monumento.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId ORDER BY m.timestamp ASC")
    List<Message> findBySessionIdOrderByTimestamp(UUID sessionId);

    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId ORDER BY m.timestamp ASC")
    List<Message> findBySessionId(UUID sessionId);

    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId ORDER BY m.timestamp ASC")
    Page<Message> findBySessionIdPaged(UUID sessionId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.session.id = :sessionId")
    Long countBySessionId(UUID sessionId);
}
