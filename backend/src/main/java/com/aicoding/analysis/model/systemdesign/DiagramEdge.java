package com.aicoding.analysis.model.systemdesign;

public record DiagramEdge(
        String id,
        String source,
        String target,
        String label
) {
}
