package com.monumento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private UUID id;
    private UUID userId;
    private String vibe;
    private String mode;
    private Integer durationMinutes;
    private String videoUrl;
    private String summary;
    private Instant summaryGeneratedAt;
    private Map<String, Object> metadata;
    private Instant createdAt;
    private Instant updatedAt;
}
