package com.aicoding.analysis.model.systemdesign;

public record DiagramNode(
        String id,
        String type,
        String label,
        double x,
        double y
) {
}
