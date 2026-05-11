package com.aicoding.analysis.model.systemdesign;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;

public record DiagramUpsertRequest(
        @NotBlank String appId,
        @NotBlank String title,
        String description,
        List<DiagramNode> nodes,
        List<DiagramEdge> edges,
        Map<String, Object> canvasMeta
) {
    public DiagramUpsertRequest {
        nodes = nodes == null ? List.of() : List.copyOf(nodes);
        edges = edges == null ? List.of() : List.copyOf(edges);
        canvasMeta = canvasMeta == null ? Map.of() : Map.copyOf(canvasMeta);
    }
}
