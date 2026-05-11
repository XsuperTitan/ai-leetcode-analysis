package com.aicoding.analysis.model.interview;

import java.util.List;

public record InterviewSearchResult(
        String queryId,
        List<InterviewQuestionItem> items
) {
}
