package com.aicoding.analysis.repository;

import com.aicoding.analysis.model.leetcode.LeetcodeAlternativeSolution;
import com.aicoding.analysis.model.leetcode.LeetcodeAnalysisItem;
import com.aicoding.analysis.mapper.LeetcodeAnalysisMapper;
import com.aicoding.analysis.mapper.row.LeetcodeAnalysisRow;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
public class LeetcodeAnalysisRepository {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<LeetcodeAlternativeSolution>> ALT_SOLUTION_LIST_TYPE = new TypeReference<>() {
    };

    private final LeetcodeAnalysisMapper leetcodeAnalysisMapper;
    private final ObjectMapper objectMapper;

    public LeetcodeAnalysisRepository(LeetcodeAnalysisMapper leetcodeAnalysisMapper, ObjectMapper objectMapper) {
        this.leetcodeAnalysisMapper = leetcodeAnalysisMapper;
        this.objectMapper = objectMapper;
    }

    public void save(LeetcodeAnalysisItem item) {
        leetcodeAnalysisMapper.insert(
                item.analysisId(),
                item.appId(),
                item.title(),
                item.description(),
                toJson(item.constraints()),
                item.language(),
                item.difficulty(),
                item.thinking(),
                item.solutionCode(),
                item.timeComplexity(),
                item.spaceComplexity(),
                toJson(item.keyPoints()),
                toJson(item.alternativeSolutions()),
                item.markdownContent(),
                Timestamp.from(item.createdAt()),
                Timestamp.from(item.createdAt())
        );
    }

    public List<LeetcodeAnalysisItem> list(String keyword, int page, int size) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        return leetcodeAnalysisMapper.list(normalizedKeyword, size, (long) page * size)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    public LeetcodeAnalysisItem getByAnalysisId(String analysisId) {
        LeetcodeAnalysisRow row = leetcodeAnalysisMapper.getByAnalysisId(analysisId);
        if (row == null) {
            throw new IllegalArgumentException("Analysis not found");
        }
        return toDomain(row);
    }

    public void deleteByAnalysisId(String analysisId) {
        int deleted = leetcodeAnalysisMapper.deleteByAnalysisId(analysisId);
        if (deleted == 0) {
            throw new IllegalArgumentException("Analysis not found");
        }
    }

    private LeetcodeAnalysisItem toDomain(LeetcodeAnalysisRow row) {
        return new LeetcodeAnalysisItem(
                row.getAnalysisId(),
                row.getAppId(),
                row.getTitle(),
                row.getDescription(),
                fromJson(row.getConstraintsJson(), STRING_LIST_TYPE),
                row.getLanguage(),
                row.getDifficulty(),
                row.getThinking(),
                row.getSolutionCode(),
                row.getTimeComplexity(),
                row.getSpaceComplexity(),
                fromJson(row.getKeyPointsJson(), STRING_LIST_TYPE),
                fromJson(row.getAlternativeSolutionsJson(), ALT_SOLUTION_LIST_TYPE),
                row.getMarkdownContent(),
                readInstant(row.getCreatedAt())
        );
    }

    private Instant readInstant(Timestamp value) {
        if (value == null) {
            return Instant.now();
        }
        return value.toInstant();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize JSON: " + ex.getMessage(), ex);
        }
    }

    private <T> T fromJson(String json, TypeReference<T> typeReference) {
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse JSON from database: " + ex.getMessage(), ex);
        }
    }
}
