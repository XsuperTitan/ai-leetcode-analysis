package com.aicoding.analysis.model.systemdesign;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record SystemDesignDiagram(
        String diagramId,
        String appId,
        String title,
        String description,
        List<DiagramNode> nodes,
        List<DiagramEdge> edges,
        Map<String, Object> canvasMeta,
        Instant createdAt,
        Instant updatedAt
) {
}
