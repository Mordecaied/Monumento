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

import java.util.*;
import java.util.stream.Collectors;

/**
 * Avatar Animation Service
 * Handles generation of lifelike avatar videos using SadTalker AI
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AvatarAnimationService {

    private final SessionRepository sessionRepository;
    private final MessageRepository messageRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.external-apis.huggingface.api-key:}")
    private String huggingFaceApiKey;

    // SadTalker API endpoint via Hugging Face Inference API
    private static final String SADTALKER_API_URL = "https://api-inference.huggingface.co/models/vinthony/SadTalker";

    /**
     * Generate animated avatar video for a session's host messages
     * This is called after a session is completed
     */
    public void generateAnimatedAvatars(UUID sessionId, String avatarImageUrl) {
        log.info("Starting avatar animation generation for session: {}", sessionId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Check if animation is enabled in metadata
        Map<String, Object> metadata = session.getMetadata();
        if (metadata == null || !Boolean.TRUE.equals(metadata.get("animateAvatar"))) {
            log.info("Avatar animation not enabled for session: {}", sessionId);
            return;
        }

        // Get all AI (host) messages
        List<Message> hostMessages = messageRepository.findBySessionIdOrderByTimestamp(sessionId)
                .stream()
                .filter(m -> "ai".equals(m.getRole()))
                .collect(Collectors.toList());

        if (hostMessages.isEmpty()) {
            log.warn("No host messages found for session: {}", sessionId);
            return;
        }

        log.info("Found {} host messages to animate", hostMessages.size());

        // Process each host message and generate animated video
        for (Message message : hostMessages) {
            try {
                // Skip if no audio URL
                if (message.getAudioUrl() == null || message.getAudioUrl().isEmpty()) {
                    log.warn("Message {} has no audio URL, skipping animation", message.getId());
                    continue;
                }

                log.info("Animating message {}: {}", message.getId(),
                    message.getText().substring(0, Math.min(50, message.getText().length())));

                // Call SadTalker API to generate animated video
                String videoUrl = callSadTalkerAPI(avatarImageUrl, message.getAudioUrl());

                if (videoUrl != null) {
                    // Store video URL in message metadata
                    Map<String, Object> msgMetadata = message.getMetadata();
                    if (msgMetadata == null) {
                        msgMetadata = new HashMap<>();
                    }
                    msgMetadata.put("animatedVideoUrl", videoUrl);
                    message.setMetadata(msgMetadata);
                    messageRepository.save(message);

                    log.info("Successfully generated animated video for message: {}", message.getId());
                } else {
                    log.warn("Failed to generate video for message: {}", message.getId());
                }

            } catch (Exception e) {
                log.error("Failed to animate message: " + message.getId(), e);
            }
        }

        log.info("Avatar animation generation completed for session: {}", sessionId);
    }

    /**
     * Call SadTalker API via Replicate
     * Replicate API: https://replicate.com/cjwbw/sadtalker
     *
     * NOTE: For production use, you'll need a Replicate API key
     * Get one at: https://replicate.com/account/api-tokens
     * Then set REPLICATE_API_KEY environment variable
     */
    private String callSadTalkerAPI(String imageUrl, String audioUrl) {
        // Check if audio URL is a data URL (base64 encoded)
        if (audioUrl != null && audioUrl.startsWith("data:")) {
            log.warn("Audio URL is a data URL (base64), cannot use with Replicate API directly");
            log.warn("In production, upload the audio file to cloud storage (S3/R2) first");
            log.info("For now, returning null - feature will work once proper storage is configured");
            return null;
        }

        // Check for Replicate API key (would be configured separately)
        String replicateApiKey = System.getenv("REPLICATE_API_KEY");
        if (replicateApiKey == null || replicateApiKey.isEmpty()) {
            log.warn("Replicate API key not configured");
            log.info("To enable avatar animation:");
            log.info("1. Sign up at https://replicate.com");
            log.info("2. Get API token from https://replicate.com/account/api-tokens");
            log.info("3. Set REPLICATE_API_KEY environment variable");
            log.info("4. Estimated cost: $0.005 per second of video");
            return null;
        }

        try {
            log.info("Calling Replicate SadTalker API");
            log.info("Image: {}", imageUrl);
            log.info("Audio: {}", audioUrl.length() > 100 ? audioUrl.substring(0, 100) + "..." : audioUrl);

            // Create prediction request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("version", "3aa3dac9353cc4d6bd62a35e0f07d60c854ed5e00c37b2f12f6e6e2a83f1ba5a");

            Map<String, Object> input = new HashMap<>();
            input.put("source_image", imageUrl);
            input.put("driven_audio", audioUrl);
            input.put("preprocess", "crop");
            input.put("still_mode", false);
            input.put("use_enhancer", true);
            input.put("result_format", "mp4");
            requestBody.put("input", input);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Token " + replicateApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Create prediction
            String replicateApiUrl = "https://api.replicate.com/v1/predictions";
            ResponseEntity<Map> response = restTemplate.postForEntity(replicateApiUrl, request, Map.class);

            if (response.getStatusCode() != HttpStatus.CREATED) {
                log.error("Failed to create prediction: {}", response.getStatusCode());
                return null;
            }

            Map<String, Object> predictionData = response.getBody();
            String predictionId = (String) predictionData.get("id");
            String status = (String) predictionData.get("status");

            log.info("Created prediction: {} with status: {}", predictionId, status);

            // Poll for completion (max 5 minutes)
            int maxAttempts = 60; // 60 attempts * 5 seconds = 5 minutes
            int attempt = 0;

            while (attempt < maxAttempts) {
                // Wait before polling
                Thread.sleep(5000); // 5 seconds

                // Get prediction status
                String pollUrl = replicateApiUrl + "/" + predictionId;
                ResponseEntity<Map> pollResponse = restTemplate.exchange(
                    pollUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
                );

                Map<String, Object> pollData = pollResponse.getBody();
                status = (String) pollData.get("status");

                log.info("Prediction {} status: {} (attempt {}/{})", predictionId, status, attempt + 1, maxAttempts);

                if ("succeeded".equals(status)) {
                    Object output = pollData.get("output");
                    if (output instanceof String) {
                        String videoUrl = (String) output;
                        log.info("Animation completed successfully: {}", videoUrl);
                        return videoUrl;
                    } else if (output instanceof List) {
                        List outputList = (List) output;
                        if (!outputList.isEmpty()) {
                            String videoUrl = (String) outputList.get(0);
                            log.info("Animation completed successfully: {}", videoUrl);
                            return videoUrl;
                        }
                    }
                    log.warn("Unexpected output format from Replicate API");
                    return null;
                } else if ("failed".equals(status) || "canceled".equals(status)) {
                    log.error("Prediction failed with status: {}", status);
                    Object error = pollData.get("error");
                    if (error != null) {
                        log.error("Error details: {}", error);
                    }
                    return null;
                }

                attempt++;
            }

            log.warn("Prediction timed out after {} attempts", maxAttempts);
            return null;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Animation generation interrupted", e);
            return null;
        } catch (Exception e) {
            log.error("Error calling SadTalker API", e);
            return null;
        }
    }

    /**
     * Check if avatar animation is supported and configured
     */
    public boolean isAnimationAvailable() {
        return huggingFaceApiKey != null && !huggingFaceApiKey.isEmpty();
    }
}
