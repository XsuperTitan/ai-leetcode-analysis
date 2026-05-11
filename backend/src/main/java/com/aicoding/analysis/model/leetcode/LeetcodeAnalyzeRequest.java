package com.aicoding.analysis.model.leetcode;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record LeetcodeAnalyzeRequest(
        @NotBlank(message = "appId must not be empty") String appId,
        @NotBlank(message = "title must not be empty") String title,
        String description,
        List<String> constraints,
        @NotBlank(message = "language must not be empty") String language,
        @NotBlank(message = "difficulty must not be empty") String difficulty
) {
    public LeetcodeAnalyzeRequest {
        description = description == null ? "" : description.trim();
        constraints = constraints == null ? List.of() : List.copyOf(constraints);
    }
}
