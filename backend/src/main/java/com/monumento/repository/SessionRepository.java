package com.monumento.repository;

import com.monumento.model.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.deletedAt IS NULL ORDER BY s.createdAt DESC")
    Page<Session> findByUserIdAndNotDeleted(UUID userId, Pageable pageable);

    @Query("SELECT s FROM Session s WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    Page<Session> findByUserId(UUID userId, Pageable pageable);

    @Query("SELECT s FROM Session s WHERE s.id = :id AND s.deletedAt IS NULL")
    Optional<Session> findByIdAndNotDeleted(UUID id);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.user.id = :userId AND s.deletedAt IS NULL")
    Long countByUserId(UUID userId);
}
