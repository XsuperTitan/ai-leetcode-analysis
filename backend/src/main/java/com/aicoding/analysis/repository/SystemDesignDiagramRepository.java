package com.aicoding.analysis.repository;

import com.aicoding.analysis.model.systemdesign.DiagramEdge;
import com.aicoding.analysis.model.systemdesign.DiagramNode;
import com.aicoding.analysis.model.systemdesign.SystemDesignDiagram;
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
import java.util.Map;

@Repository
public class SystemDesignDiagramRepository {

    private static final TypeReference<List<DiagramNode>> NODE_LIST_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<DiagramEdge>> EDGE_LIST_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public SystemDesignDiagramRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void save(SystemDesignDiagram diagram) {
        String sql = """
                INSERT INTO system_design_diagram (
                  diagram_id, app_id, title, description, nodes_json, edges_json, canvas_meta_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        jdbcTemplate.update(
                sql,
                diagram.diagramId(),
                diagram.appId(),
                diagram.title(),
                diagram.description(),
                toJson(diagram.nodes()),
                toJson(diagram.edges()),
                toJson(diagram.canvasMeta()),
                Timestamp.from(diagram.createdAt()),
                Timestamp.from(diagram.updatedAt())
        );
    }

    public void update(SystemDesignDiagram diagram) {
        String sql = """
                UPDATE system_design_diagram
                SET app_id = ?, title = ?, description = ?, nodes_json = ?, edges_json = ?, canvas_meta_json = ?, updated_at = ?
                WHERE diagram_id = ?
                """;
        jdbcTemplate.update(
                sql,
                diagram.appId(),
                diagram.title(),
                diagram.description(),
                toJson(diagram.nodes()),
                toJson(diagram.edges()),
                toJson(diagram.canvasMeta()),
                Timestamp.from(diagram.updatedAt()),
                diagram.diagramId()
        );
    }

    public SystemDesignDiagram getByDiagramId(String diagramId) {
        String sql = """
                SELECT diagram_id, app_id, title, description, nodes_json, edges_json, canvas_meta_json, created_at, updated_at
                FROM system_design_diagram
                WHERE diagram_id = ?
                """;
        List<SystemDesignDiagram> items = jdbcTemplate.query(sql, rowMapper(), diagramId);
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Diagram not found");
        }
        return items.get(0);
    }

    public List<SystemDesignDiagram> list(String keyword, int page, int size) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String sql = """
                SELECT diagram_id, app_id, title, description, nodes_json, edges_json, canvas_meta_json, created_at, updated_at
                FROM system_design_diagram
                WHERE (? = '' OR LOWER(title) LIKE ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """;
        String likeKeyword = "%" + normalizedKeyword.toLowerCase() + "%";
        return jdbcTemplate.query(sql, rowMapper(), normalizedKeyword, likeKeyword, size, (long) page * size);
    }

    private RowMapper<SystemDesignDiagram> rowMapper() {
        return (resultSet, rowNum) -> new SystemDesignDiagram(
                resultSet.getString("diagram_id"),
                resultSet.getString("app_id"),
                resultSet.getString("title"),
                resultSet.getString("description"),
                fromJson(resultSet.getString("nodes_json"), NODE_LIST_TYPE),
                fromJson(resultSet.getString("edges_json"), EDGE_LIST_TYPE),
                fromJson(resultSet.getString("canvas_meta_json"), MAP_TYPE),
                readInstant(resultSet, "created_at"),
                readInstant(resultSet, "updated_at")
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
