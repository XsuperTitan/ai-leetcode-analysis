package com.aicoding.analysis.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "deepseek")
public record DeepseekProperties(
        String baseUrl,
        String apiKey,
        String model,
        String chatPath
) {
}
