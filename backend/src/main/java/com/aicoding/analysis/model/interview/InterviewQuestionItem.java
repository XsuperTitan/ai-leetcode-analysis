package com.aicoding.analysis.model.interview;

import java.time.Instant;
import java.util.List;

public record InterviewQuestionItem(
        String questionId,
        String queryId,
        String appId,
        String question,
        List<String> answerHints,
        List<String> tags,
        boolean isFavorite,
        Instant createdAt
) {
}
