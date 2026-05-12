package com.marketplace.productservice.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class AuditTrailHook {

    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT_TRAIL");

    private final ObjectMapper objectMapper;
    private final WebClient webClient;
    private final String endpoint;

    public AuditTrailHook(ObjectMapper objectMapper, WebClient.Builder builder,
            @Value("${CLOUDTRAIL_ENDPOINT:}") String endpoint) {
        this.objectMapper = objectMapper;
        this.webClient = builder.build();
        this.endpoint = endpoint;
    }

    @SuppressWarnings("null")
    public void publish(String source, String action, Object payload) {
        Map<String, Object> event = Map.of(
                "timestamp", OffsetDateTime.now().toString(),
                "source", source,
                "action", action,
                "payload", payload
        );

        auditLogger.info(write(event));

        if (!endpoint.isBlank()) {
            Map<String, Object> body = Map.copyOf(event);
            webClient.post()
                .uri(URI.create(Objects.requireNonNull(endpoint)))
                .bodyValue(Objects.requireNonNull(body))
                    .retrieve()
                    .toBodilessEntity()
                    .onErrorResume(error -> {
                        auditLogger.warn("cloudtrail_hook_failed={} message={}", endpoint, error.getMessage());
                        return reactor.core.publisher.Mono.empty();
                    })
                    .subscribe();
        }
    }

    private String write(Map<String, Object> event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException exception) {
            return event.toString();
        }
    }
}
