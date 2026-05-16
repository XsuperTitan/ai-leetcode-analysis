package com.aicoding.analysis.model.interview;

/** Question, candidate answer, and LLM summary of what the interviewer likely wanted to hear. */
public record InterviewQaPair(String question, String answer, String interviewerExpectedAnswer) {
}
