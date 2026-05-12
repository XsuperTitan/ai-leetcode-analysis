package com.aicoding.analysis.model.interview;

import jakarta.validation.constraints.NotBlank;

public record CheatSheetRequest(@NotBlank String appId) {
}
