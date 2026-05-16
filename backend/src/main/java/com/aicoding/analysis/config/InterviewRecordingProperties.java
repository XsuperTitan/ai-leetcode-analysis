package com.aicoding.analysis.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.interview-recording")
public record InterviewRecordingProperties(Long maxUploadSizeBytes) {

    public long resolvedMaxUploadSizeBytes() {
        if (maxUploadSizeBytes != null && maxUploadSizeBytes > 0) {
            return maxUploadSizeBytes;
        }
        return 30L * 1024 * 1024;
    }
}
