package com.monumento.service;

import com.monumento.dto.MessageRequest;
import com.monumento.dto.MessageResponse;
import com.monumento.model.Message;
import com.monumento.model.Session;
import com.monumento.repository.MessageRepository;
import com.monumento.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Transactional
    public MessageResponse createMessage(UUID userId, UUID sessionId, MessageRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Verify the session belongs to the user
        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to session");
        }

        // Set timestamp to current time in milliseconds if not provided
        Long timestamp = System.currentTimeMillis();

        Message message = Message.builder()
                .session(session)
                .role(request.getRole())
                .text(request.getText())
                .timestamp(timestamp)
                .relativeOffset(request.getRelativeOffset() != null ? request.getRelativeOffset() : 0L)
                .audioUrl(request.getAudioUrl())
                .build();

        message = messageRepository.save(message);

        return mapToResponse(message);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getSessionMessages(UUID userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to session");
        }

        List<Message> messages = messageRepository.findBySessionId(sessionId);
        return messages.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> getSessionMessagesPaged(UUID userId, UUID sessionId, Pageable pageable) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to session");
        }

        Page<Message> messages = messageRepository.findBySessionIdPaged(sessionId, pageable);
        return messages.map(this::mapToResponse);
    }

    @Transactional
    public MessageResponse updateMessage(UUID userId, UUID messageId, MessageRequest request) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSession().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to message");
        }

        // Update fields if provided
        if (request.getText() != null) {
            message.setText(request.getText());
        }
        if (request.getRelativeOffset() != null) {
            message.setRelativeOffset(request.getRelativeOffset());
        }
        if (request.getAudioUrl() != null) {
            message.setAudioUrl(request.getAudioUrl());
        }

        message = messageRepository.save(message);
        return mapToResponse(message);
    }

    @Transactional
    public void deleteMessage(UUID userId, UUID messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSession().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to message");
        }

        messageRepository.delete(message);
    }

    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .role(message.getRole())
                .text(message.getText())
                .timestamp(message.getTimestamp())
                .relativeOffset(message.getRelativeOffset())
                .audioUrl(message.getAudioUrl())
                .metadata(message.getMetadata())
                .build();
    }
}
