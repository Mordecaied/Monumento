package com.monumento.controller;

import com.monumento.dto.MessageRequest;
import com.monumento.dto.MessageResponse;
import com.monumento.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions/{sessionId}/messages")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<?> createMessage(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestBody MessageRequest request) {
        try {
            MessageResponse response = messageService.createMessage(userId, sessionId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getSessionMessages(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @RequestParam(required = false, defaultValue = "false") boolean paged,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            if (paged) {
                Pageable pageable = PageRequest.of(page, size);
                Page<MessageResponse> messages = messageService.getSessionMessagesPaged(userId, sessionId, pageable);
                return ResponseEntity.ok(messages);
            } else {
                List<MessageResponse> messages = messageService.getSessionMessages(userId, sessionId);
                return ResponseEntity.ok(messages);
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<?> updateMessage(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @PathVariable UUID messageId,
            @RequestBody MessageRequest request) {
        try {
            MessageResponse response = messageService.updateMessage(userId, messageId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID sessionId,
            @PathVariable UUID messageId) {
        try {
            messageService.deleteMessage(userId, messageId);
            return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
