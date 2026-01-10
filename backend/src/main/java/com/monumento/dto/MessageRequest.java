package com.monumento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    private String role; // "user" or "assistant"
    private String text;
    private Long relativeOffset; // Milliseconds from session start
    private String audioUrl; // URL to audio file for avatar animation
}
