package com.aicoding.analysis.mapper.row;

import java.sql.Timestamp;

public class LeetcodeAnalysisRow {
    private String analysisId;
    private String appId;
    private String title;
    private String description;
    private String constraintsJson;
    private String language;
    private String difficulty;
    private String thinking;
    private String solutionCode;
    private String timeComplexity;
    private String spaceComplexity;
    private String keyPointsJson;
    private String alternativeSolutionsJson;
    private String markdownContent;
    private Timestamp createdAt;

    public String getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(String analysisId) {
        this.analysisId = analysisId;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getConstraintsJson() {
        return constraintsJson;
    }

    public void setConstraintsJson(String constraintsJson) {
        this.constraintsJson = constraintsJson;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getThinking() {
        return thinking;
    }

    public void setThinking(String thinking) {
        this.thinking = thinking;
    }

    public String getSolutionCode() {
        return solutionCode;
    }

    public void setSolutionCode(String solutionCode) {
        this.solutionCode = solutionCode;
    }

    public String getTimeComplexity() {
        return timeComplexity;
    }

    public void setTimeComplexity(String timeComplexity) {
        this.timeComplexity = timeComplexity;
    }

    public String getSpaceComplexity() {
        return spaceComplexity;
    }

    public void setSpaceComplexity(String spaceComplexity) {
        this.spaceComplexity = spaceComplexity;
    }

    public String getKeyPointsJson() {
        return keyPointsJson;
    }

    public void setKeyPointsJson(String keyPointsJson) {
        this.keyPointsJson = keyPointsJson;
    }

    public String getAlternativeSolutionsJson() {
        return alternativeSolutionsJson;
    }

    public void setAlternativeSolutionsJson(String alternativeSolutionsJson) {
        this.alternativeSolutionsJson = alternativeSolutionsJson;
    }

    public String getMarkdownContent() {
        return markdownContent;
    }

    public void setMarkdownContent(String markdownContent) {
        this.markdownContent = markdownContent;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}
