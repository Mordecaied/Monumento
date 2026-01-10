package com.monumento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionRequest {
    private String vibe;
    private String mode;
    private Integer durationMinutes;
    private String videoUrl;
    private Map<String, Object> metadata;
}
