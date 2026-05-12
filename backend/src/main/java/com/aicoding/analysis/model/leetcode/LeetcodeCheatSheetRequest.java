package com.aicoding.analysis.model.leetcode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record LeetcodeCheatSheetRequest(
        @NotBlank String appId,
        @NotEmpty @Size(max = 25) List<@NotBlank String> analysisIds
) {
}
