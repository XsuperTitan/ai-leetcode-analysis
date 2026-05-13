package com.aicoding.analysis.model.interview;

import jakarta.validation.constraints.NotBlank;

public record CheatSheetRequest(@NotBlank String appId, String lang) {
    public CheatSheetRequest {
        lang = (lang == null || lang.isBlank()) ? "en" : lang.trim().toLowerCase();
    }
}
