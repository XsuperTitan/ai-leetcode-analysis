package com.aicoding.analysis.model.leetcode;

import java.time.Instant;
import java.util.List;

public record LeetcodeAnalysisItem(
        String analysisId,
        String appId,
        String title,
        String description,
        List<String> constraints,
        String language,
        String difficulty,
        String thinking,
        String solutionCode,
        String timeComplexity,
        String spaceComplexity,
        List<String> keyPoints,
        List<LeetcodeAlternativeSolution> alternativeSolutions,
        String markdownContent,
        Instant createdAt
) {
}
