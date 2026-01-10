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
public class MessageResponse {
    private UUID id;
    private UUID sessionId;
    private String role;
    private String text;
    private Long timestamp;
    private Long relativeOffset;
    private String audioUrl;
    private Map<String, Object> metadata;
}
