package com.aicoding.analysis.repository;

import com.aicoding.analysis.model.systemdesign.DiagramEdge;
import com.aicoding.analysis.model.systemdesign.DiagramNode;
import com.aicoding.analysis.model.systemdesign.SystemDesignDiagram;
import com.aicoding.analysis.mapper.SystemDesignDiagramMapper;
import com.aicoding.analysis.mapper.row.SystemDesignDiagramRow;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Repository;

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

    private final SystemDesignDiagramMapper systemDesignDiagramMapper;
    private final ObjectMapper objectMapper;

    public SystemDesignDiagramRepository(SystemDesignDiagramMapper systemDesignDiagramMapper, ObjectMapper objectMapper) {
        this.systemDesignDiagramMapper = systemDesignDiagramMapper;
        this.objectMapper = objectMapper;
    }

    public void save(SystemDesignDiagram diagram) {
        systemDesignDiagramMapper.insert(
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
        systemDesignDiagramMapper.update(
                diagram.diagramId(),
                diagram.appId(),
                diagram.title(),
                diagram.description(),
                toJson(diagram.nodes()),
                toJson(diagram.edges()),
                toJson(diagram.canvasMeta()),
                Timestamp.from(diagram.updatedAt())
        );
    }

    public SystemDesignDiagram getByDiagramId(String diagramId) {
        SystemDesignDiagramRow row = systemDesignDiagramMapper.getByDiagramId(diagramId);
        if (row == null) {
            throw new IllegalArgumentException("Diagram not found");
        }
        return toDomain(row);
    }

    public List<SystemDesignDiagram> list(String keyword, int page, int size) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        return systemDesignDiagramMapper.list(normalizedKeyword, size, (long) page * size)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    public void deleteByDiagramId(String diagramId) {
        int deleted = systemDesignDiagramMapper.deleteByDiagramId(diagramId);
        if (deleted == 0) {
            throw new IllegalArgumentException("Diagram not found");
        }
    }

    private SystemDesignDiagram toDomain(SystemDesignDiagramRow row) {
        return new SystemDesignDiagram(
                row.getDiagramId(),
                row.getAppId(),
                row.getTitle(),
                row.getDescription(),
                fromJson(row.getNodesJson(), NODE_LIST_TYPE),
                fromJson(row.getEdgesJson(), EDGE_LIST_TYPE),
                fromJson(row.getCanvasMetaJson(), MAP_TYPE),
                readInstant(row.getCreatedAt()),
                readInstant(row.getUpdatedAt())
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
