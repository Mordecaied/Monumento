package com.monumento.service;

import com.monumento.model.Message;
import com.monumento.model.Session;
import com.monumento.repository.MessageRepository;
import com.monumento.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiSummaryService {

    private final SessionRepository sessionRepository;
    private final MessageRepository messageRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.external-apis.gemini.api-key}")
    private String geminiApiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    /**
     * Generate AI summary for a session
     */
    public String generateSummary(UUID sessionId) {
        log.info("Generating AI summary for session: {}", sessionId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<Message> messages = messageRepository.findBySessionIdOrderByTimestamp(sessionId);

        if (messages.isEmpty()) {
            throw new RuntimeException("No messages found for session");
        }

        // Build transcript
        String transcript = messages.stream()
                .map(m -> {
                    String speaker = "ai".equals(m.getRole()) ? "Host" : "Guest";
                    return speaker + ": " + m.getText();
                })
                .collect(Collectors.joining("\n\n"));

        // Generate summary using Gemini API
        String summary = callGeminiApi(transcript, session);

        // Save summary to session
        session.setSummary(summary);
        session.setSummaryGeneratedAt(Instant.now());
        sessionRepository.save(session);

        log.info("Successfully generated summary for session: {}", sessionId);
        return summary;
    }

    private String callGeminiApi(String transcript, Session session) {
        String prompt = buildSummaryPrompt(transcript, session);

        // Build request body for Gemini API
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            String url = GEMINI_API_URL + "?key=" + geminiApiKey;
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }

            throw new RuntimeException("Failed to get valid response from Gemini API");

        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            throw new RuntimeException("Failed to generate summary: " + e.getMessage());
        }
    }

    private String buildSummaryPrompt(String transcript, Session session) {
        return String.format("""
                Please analyze this podcast interview transcript and provide a comprehensive summary.

                **Interview Details:**
                - Host Style: %s
                - Interview Mode: %s
                - Duration: %d minutes

                **Transcript:**
                %s

                **Please provide:**

                1. **Executive Summary** (2-3 sentences): The main theme and purpose of the conversation

                2. **Key Topics Discussed** (bullet points): 3-5 major topics that were covered

                3. **Notable Quotes** (if any): 1-2 memorable or insightful quotes from the conversation

                4. **Insights & Takeaways** (bullet points): 2-3 key insights or lessons from the discussion

                5. **Emotional Tone**: Brief description of the overall mood and energy of the conversation

                Format the summary in a clear, well-structured way using markdown.
                """,
                session.getVibe(),
                session.getMode(),
                session.getDurationMinutes(),
                transcript
        );
    }
}
