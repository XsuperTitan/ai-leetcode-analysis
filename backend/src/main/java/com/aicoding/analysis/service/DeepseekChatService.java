package com.aicoding.analysis.service;

import com.aicoding.analysis.config.DeepseekProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class DeepseekChatService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final DeepseekProperties deepseekProperties;

    public DeepseekChatService(
            DeepseekProperties deepseekProperties,
            ObjectMapper objectMapper,
            RestClient.Builder restClientBuilder
    ) {
        this.deepseekProperties = deepseekProperties;
        this.objectMapper = objectMapper;
        String baseUrl = Objects.requireNonNull(deepseekProperties.baseUrl(), "deepseek.base-url is required");
        String apiKey = Objects.requireNonNull(deepseekProperties.apiKey(), "deepseek.api-key is required");
        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException("deepseek.api-key is empty, please set DEEPSEEK_API_KEY in backend/.env.local");
        }

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(Objects.requireNonNull(httpClient));
        requestFactory.setReadTimeout(Objects.requireNonNull(Duration.ofSeconds(45)));

        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .requestFactory(requestFactory)
                .build();
    }

    public String chatJson(String systemPrompt, String userPrompt) {
        try {
            String chatPath = StringUtils.hasText(deepseekProperties.chatPath())
                    ? deepseekProperties.chatPath()
                    : "/chat/completions";

            Map<String, Object> requestBody = Map.of(
                    "model", Objects.requireNonNull(deepseekProperties.model(), "deepseek.model is required"),
                    "temperature", 0.2,
                    "response_format", Map.of("type", "json_object"),
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    )
            );

            String response = restClient.post()
                    .uri(Objects.requireNonNull(chatPath))
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .body(Objects.requireNonNull(requestBody))
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").path(0).path("message").path("content").asText("{}");
        } catch (Exception ex) {
            throw new IllegalStateException("DeepSeek request failed: " + ex.getMessage(), ex);
        }
    }
}
