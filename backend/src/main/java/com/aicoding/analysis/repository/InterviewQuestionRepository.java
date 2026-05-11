package com.aicoding.analysis.repository;

import com.aicoding.analysis.model.interview.InterviewQuestionItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class InterviewQuestionRepository {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public InterviewQuestionRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void saveAll(List<InterviewQuestionItem> items, String category, String level) {
        if (items == null || items.isEmpty()) {
            return;
        }
        String sql = """
                INSERT INTO interview_question_item (
                  question_id, query_id, app_id, question_text, answer_hints_json, tags_json, category, level, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        for (InterviewQuestionItem item : items) {
            jdbcTemplate.update(
                    sql,
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
        Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM interview_question_item WHERE question_id = ?",
                Integer.class,
                questionId
        );
        if (exists == null || exists == 0) {
            throw new IllegalArgumentException("questionId not found");
        }

        String sql = """
                INSERT IGNORE INTO question_favorite (app_id, question_id, created_at)
                SELECT app_id, question_id, ?
                FROM interview_question_item
                WHERE question_id = ?
                LIMIT 1
                """;
        jdbcTemplate.update(sql, Timestamp.from(Instant.now()), questionId);
    }

    public void removeFavorite(String questionId) {
        jdbcTemplate.update("DELETE FROM question_favorite WHERE question_id = ?", questionId);
    }

    public Set<String> findFavoriteQuestionIds(String appId, List<String> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            return Set.of();
        }
        String placeholders = questionIds.stream().map(id -> "?").collect(Collectors.joining(","));
        String sql = """
                SELECT question_id
                FROM question_favorite
                WHERE app_id = ? AND question_id IN (%s)
                """.formatted(placeholders);
        List<Object> params = new ArrayList<>();
        params.add(appId);
        params.addAll(questionIds);
        List<String> rows = jdbcTemplate.query(
                Objects.requireNonNull(sql),
                (resultSet, rowNum) -> resultSet.getString("question_id"),
                params.toArray()
        );
        return new HashSet<>(rows);
    }

    public List<InterviewQuestionItem> listFavorites(String appId) {
        String sql = """
                SELECT i.question_id, i.query_id, i.app_id, i.question_text, i.answer_hints_json, i.tags_json, i.created_at
                FROM interview_question_item i
                INNER JOIN question_favorite f
                  ON i.question_id = f.question_id AND i.app_id = f.app_id
                WHERE i.app_id = ?
                ORDER BY f.created_at DESC
                """;
        return jdbcTemplate.query(Objects.requireNonNull(sql), Objects.requireNonNull(favoriteRowMapper()), appId);
    }

    private RowMapper<InterviewQuestionItem> favoriteRowMapper() {
        return (resultSet, rowNum) -> new InterviewQuestionItem(
                resultSet.getString("question_id"),
                resultSet.getString("query_id"),
                resultSet.getString("app_id"),
                resultSet.getString("question_text"),
                fromJson(resultSet.getString("answer_hints_json")),
                fromJson(resultSet.getString("tags_json")),
                true,
                readInstant(resultSet, "created_at")
        );
    }

    private Instant readInstant(ResultSet resultSet, String column) throws SQLException {
        Timestamp value = resultSet.getTimestamp(column);
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
