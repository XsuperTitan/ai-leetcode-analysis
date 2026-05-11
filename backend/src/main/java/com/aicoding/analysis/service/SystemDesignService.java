package com.aicoding.analysis.service;

import com.aicoding.analysis.model.systemdesign.DiagramUpsertRequest;
import com.aicoding.analysis.model.systemdesign.SystemDesignDiagram;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SystemDesignService {

    private final List<SystemDesignDiagram> store = new CopyOnWriteArrayList<>();

    public SystemDesignDiagram create(DiagramUpsertRequest request) {
        SystemDesignDiagram created = new SystemDesignDiagram(
                "diagram_" + UUID.randomUUID().toString().replace("-", ""),
                request.appId(),
                request.title(),
                request.description(),
                request.nodes(),
                request.edges(),
                request.canvasMeta(),
                Instant.now(),
                Instant.now()
        );
        store.add(0, created);
        return created;
    }

    public SystemDesignDiagram update(String diagramId, DiagramUpsertRequest request) {
        SystemDesignDiagram existing = getById(diagramId);
        SystemDesignDiagram updated = new SystemDesignDiagram(
                existing.diagramId(),
                request.appId(),
                request.title(),
                request.description(),
                request.nodes(),
                request.edges(),
                request.canvasMeta(),
                existing.createdAt(),
                Instant.now()
        );
        store.removeIf(item -> item.diagramId().equals(diagramId));
        store.add(0, updated);
        return updated;
    }

    public SystemDesignDiagram getById(String diagramId) {
        return store.stream()
                .filter(item -> item.diagramId().equals(diagramId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Diagram not found"));
    }

    public List<SystemDesignDiagram> list(String keyword, int page, int size) {
        return store.stream()
                .filter(item -> keyword == null || keyword.isBlank() || item.title().toLowerCase().contains(keyword.toLowerCase()))
                .skip((long) page * size)
                .limit(size)
                .toList();
    }

    public String exportAsJson(String diagramId) {
        SystemDesignDiagram diagram = getById(diagramId);
        return """
                {
                  "diagramId": "%s",
                  "title": "%s",
                  "description": "%s",
                  "nodesCount": %d,
                  "edgesCount": %d
                }
                """.formatted(
                diagram.diagramId(),
                diagram.title(),
                diagram.description(),
                diagram.nodes().size(),
                diagram.edges().size()
        );
    }
}
