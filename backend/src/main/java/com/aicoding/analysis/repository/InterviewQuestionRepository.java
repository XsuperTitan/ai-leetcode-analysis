package com.aicoding.analysis.repository;

import com.aicoding.analysis.model.interview.InterviewQuestionItem;
import com.aicoding.analysis.mapper.InterviewQuestionMapper;
import com.aicoding.analysis.mapper.row.InterviewQuestionFavoriteRow;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Repository
public class InterviewQuestionRepository {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final InterviewQuestionMapper interviewQuestionMapper;
    private final ObjectMapper objectMapper;

    public InterviewQuestionRepository(InterviewQuestionMapper interviewQuestionMapper, ObjectMapper objectMapper) {
        this.interviewQuestionMapper = interviewQuestionMapper;
        this.objectMapper = objectMapper;
    }

    public void saveAll(List<InterviewQuestionItem> items, String category, String level) {
        if (items == null || items.isEmpty()) {
            return;
        }
        for (InterviewQuestionItem item : items) {
            interviewQuestionMapper.insertQuestion(
                    item.questionId(),
                    item.queryId(),
                    item.appId(),
                    item.question(),
                    toJson(item.answerHints()),
                    toJson(item.tags()),
                    category,
                    level,
                    Timestamp.from(item.createdAt())
            );
        }
    }

    public void addFavorite(String questionId) {
        Integer exists = interviewQuestionMapper.countByQuestionId(questionId);
        if (exists == null || exists == 0) {
            throw new IllegalArgumentException("questionId not found");
        }
        interviewQuestionMapper.insertFavoriteByQuestionId(questionId, Timestamp.from(Instant.now()));
    }

    public void removeFavorite(String questionId) {
        interviewQuestionMapper.removeFavorite(questionId);
    }

    public Set<String> findFavoriteQuestionIds(String appId, List<String> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            return Set.of();
        }
        return Set.copyOf(interviewQuestionMapper.findFavoriteQuestionIds(appId, questionIds));
    }

    public List<InterviewQuestionItem> listFavorites(String appId) {
        return interviewQuestionMapper.listFavorites(appId).stream()
                .map(this::toDomainFavorite)
                .toList();
    }

    private InterviewQuestionItem toDomainFavorite(InterviewQuestionFavoriteRow row) {
        return new InterviewQuestionItem(
                row.getQuestionId(),
                row.getQueryId(),
                row.getAppId(),
                row.getQuestionText(),
                fromJson(row.getAnswerHintsJson()),
                fromJson(row.getTagsJson()),
                true,
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

    private List<String> fromJson(String json) {
        try {
            return objectMapper.readValue(json, STRING_LIST_TYPE);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse JSON from database: " + ex.getMessage(), ex);
        }
    }
}
