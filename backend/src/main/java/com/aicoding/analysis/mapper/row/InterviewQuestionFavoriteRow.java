package com.aicoding.analysis.mapper.row;

import java.sql.Timestamp;

public class InterviewQuestionFavoriteRow {
    private String questionId;
    private String queryId;
    private String appId;
    private String questionText;
    private String answerHintsJson;
    private String tagsJson;
    private Timestamp createdAt;

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public String getQueryId() {
        return queryId;
    }

    public void setQueryId(String queryId) {
        this.queryId = queryId;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getAnswerHintsJson() {
        return answerHintsJson;
    }

    public void setAnswerHintsJson(String answerHintsJson) {
        this.answerHintsJson = answerHintsJson;
    }

    public String getTagsJson() {
        return tagsJson;
    }

    public void setTagsJson(String tagsJson) {
        this.tagsJson = tagsJson;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}
