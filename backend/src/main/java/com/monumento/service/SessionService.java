package com.monumento.service;

import com.monumento.dto.SessionRequest;
import com.monumento.dto.SessionResponse;
import com.monumento.model.Session;
import com.monumento.model.User;
import com.monumento.repository.SessionRepository;
import com.monumento.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class SessionService {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public SessionResponse createSession(UUID userId, SessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Session session = Session.builder()
                .user(user)
                .vibe(request.getVibe())
                .mode(request.getMode())
                .durationMinutes(request.getDurationMinutes())
                .metadata(request.getMetadata())
                .build();

        session = sessionRepository.save(session);

        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(UUID userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Verify the session belongs to the user
        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to session");
        }

        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public Page<SessionResponse> getUserSessions(UUID userId, Pageable pageable) {
        Page<Session> sessions = sessionRepository.findByUserId(userId, pageable);
        return sessions.map(this::mapToResponse);
    }

    @Transactional
    public SessionResponse updateSession(UUID userId, UUID sessionId, SessionRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to session");
        }

        if (request.getVibe() != null) {
            session.setVibe(request.getVibe());
        }
        if (request.getMode() != null) {
            session.setMode(request.getMode());
        }
        if (request.getDurationMinutes() != null) {
            session.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getVideoUrl() != null) {
            session.setVideoUrl(request.getVideoUrl());
        }
        if (request.getMetadata() != null) {
            session.setMetadata(request.getMetadata());
        }

        session = sessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional
    public SessionResponse updateSessionMetadata(UUID userId, UUID sessionId, Map<String, Object> metadataUpdates) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to session");
        }

        // Merge new metadata with existing metadata (don't replace)
        Map<String, Object> existingMetadata = session.getMetadata();
        if (existingMetadata == null) {
            existingMetadata = new java.util.HashMap<>();
        }
        existingMetadata.putAll(metadataUpdates);
        session.setMetadata(existingMetadata);

        session = sessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional
    public void deleteSession(UUID userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to session");
        }

        sessionRepository.delete(session);
    }

    private SessionResponse mapToResponse(Session session) {
        return SessionResponse.builder()
                .id(session.getId())
                .userId(session.getUser().getId())
                .vibe(session.getVibe())
                .mode(session.getMode())
                .durationMinutes(session.getDurationMinutes())
                .videoUrl(session.getVideoUrl())
                .summary(session.getSummary())
                .summaryGeneratedAt(session.getSummaryGeneratedAt())
                .metadata(session.getMetadata())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}
