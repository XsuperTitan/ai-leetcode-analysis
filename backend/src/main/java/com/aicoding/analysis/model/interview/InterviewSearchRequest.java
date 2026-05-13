package com.aicoding.analysis.model.interview;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record InterviewSearchRequest(
        @NotBlank String appId,
        @NotBlank String keyword,
        @NotBlank String category,
        @NotBlank String level,
        @Min(1) @Max(20) int count,
        String lang
) {
    public InterviewSearchRequest {
        lang = (lang == null || lang.isBlank()) ? "en" : lang.trim().toLowerCase();
    }
}
