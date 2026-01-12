package com.monumento.controller;

import com.monumento.dto.SessionRequest;
import com.monumento.dto.SessionResponse;
import com.monumento.service.SessionService;
import com.monumento.service.AiSummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @Autowired
    private AiSummaryService aiSummaryService;

    @Autowired
    private com.monumento.service.AvatarAnimationService avatarAnimationService;

    @PostMapping
    public ResponseEntity<?> createSession(
            @AuthenticationPrincipal UUID userId,
            @RequestBody SessionRequest request) {
        try {
            SessionResponse response = sessionService.createSession(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSession(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId) {
        try {
            SessionResponse response = sessionService.getSession(userId, sessionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserSessions(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<SessionResponse> sessions = sessionService.getUserSessions(userId, pageable);
            return ResponseEntity.ok(sessions);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<?> updateSession(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestBody SessionRequest request) {
        try {
            SessionResponse response = sessionService.updateSession(userId, sessionId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{sessionId}/metadata")
    public ResponseEntity<?> updateSessionMetadata(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestBody Map<String, Object> metadata) {
        try {
            SessionResponse response = sessionService.updateSessionMetadata(userId, sessionId, metadata);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<?> deleteSession(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId) {
        try {
            sessionService.deleteSession(userId, sessionId);
            return ResponseEntity.ok(Map.of("message", "Session deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/generate-summary")
    public ResponseEntity<?> generateSummary(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId) {
        try {
            // Verify session belongs to user
            sessionService.getSession(userId, sessionId);

            // Generate summary
            String summary = aiSummaryService.generateSummary(sessionId);

            return ResponseEntity.ok(Map.of(
                    "summary", summary,
                    "message", "Summary generated successfully"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/generate-avatars")
    public ResponseEntity<?> generateAnimatedAvatars(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestParam String avatarImageUrl) {
        try {
            // Verify session belongs to user
            sessionService.getSession(userId, sessionId);

            // Generate animated avatars (async in future, sync for now)
            avatarAnimationService.generateAnimatedAvatars(sessionId, avatarImageUrl);

            return ResponseEntity.ok(Map.of(
                    "message", "Avatar animation generation initiated",
                    "status", "processing"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
