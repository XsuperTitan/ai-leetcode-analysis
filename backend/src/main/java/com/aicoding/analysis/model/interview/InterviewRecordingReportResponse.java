package com.aicoding.analysis.model.interview;

import java.util.List;

public record InterviewRecordingReportResponse(
        String rawTranscript,
        String cleanedDialogue,
        List<InterviewQaPair> qaPairs,
        String summary,
        String obviousMistakes,
        List<String> uncertainties,
        String reportMarkdown
) {
}
