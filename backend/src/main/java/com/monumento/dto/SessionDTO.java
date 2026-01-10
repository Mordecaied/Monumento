package com.monumento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionDTO {
    private UUID id;
    private UUID userId;
    private String vibe;
    private String mode;
    private Integer durationMinutes;
    private String videoUrl;
    private String transcriptUrl;
    private String thumbnailUrl;
    private Map<String, Object> metadata;
    private String status;
    private List<MessageDTO> messages;
    private Instant createdAt;
    private Instant updatedAt;
}
