package com.aicoding.analysis.repository;

import com.aicoding.analysis.model.leetcode.LeetcodeAlternativeSolution;
import com.aicoding.analysis.model.leetcode.LeetcodeAnalysisItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
public class LeetcodeAnalysisRepository {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<LeetcodeAlternativeSolution>> ALT_SOLUTION_LIST_TYPE = new TypeReference<>() {
    };

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public LeetcodeAnalysisRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void save(LeetcodeAnalysisItem item) {
        String sql = """
                INSERT INTO leetcode_analysis (
                  analysis_id, app_id, title, description, constraints_json, language, difficulty,
                  thinking, solution_code, time_complexity, space_complexity, key_points_json,
                  alternative_solutions_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        jdbcTemplate.update(
                sql,
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
                Timestamp.from(item.createdAt()),
                Timestamp.from(item.createdAt())
        );
    }

    public List<LeetcodeAnalysisItem> list(String keyword, int page, int size) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String sql = """
                SELECT analysis_id, app_id, title, description, constraints_json, language, difficulty,
                       thinking, solution_code, time_complexity, space_complexity, key_points_json,
                       alternative_solutions_json, created_at
                FROM leetcode_analysis
                WHERE (? = '' OR LOWER(title) LIKE ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """;
        String likeKeyword = "%" + normalizedKeyword.toLowerCase() + "%";
        return jdbcTemplate.query(sql, rowMapper(), normalizedKeyword, likeKeyword, size, (long) page * size);
    }

    public LeetcodeAnalysisItem getByAnalysisId(String analysisId) {
        String sql = """
                SELECT analysis_id, app_id, title, description, constraints_json, language, difficulty,
                       thinking, solution_code, time_complexity, space_complexity, key_points_json,
                       alternative_solutions_json, created_at
                FROM leetcode_analysis
                WHERE analysis_id = ?
                """;
        List<LeetcodeAnalysisItem> items = jdbcTemplate.query(sql, rowMapper(), analysisId);
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Analysis not found");
        }
        return items.get(0);
    }

    private RowMapper<LeetcodeAnalysisItem> rowMapper() {
        return (resultSet, rowNum) -> new LeetcodeAnalysisItem(
                resultSet.getString("analysis_id"),
                resultSet.getString("app_id"),
                resultSet.getString("title"),
                resultSet.getString("description"),
                fromJson(resultSet.getString("constraints_json"), STRING_LIST_TYPE),
                resultSet.getString("language"),
                resultSet.getString("difficulty"),
                resultSet.getString("thinking"),
                resultSet.getString("solution_code"),
                resultSet.getString("time_complexity"),
                resultSet.getString("space_complexity"),
                fromJson(resultSet.getString("key_points_json"), STRING_LIST_TYPE),
                fromJson(resultSet.getString("alternative_solutions_json"), ALT_SOLUTION_LIST_TYPE),
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

    private <T> T fromJson(String json, TypeReference<T> typeReference) {
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse JSON from database: " + ex.getMessage(), ex);
        }
    }
}
