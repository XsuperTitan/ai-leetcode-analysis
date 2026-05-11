package com.aicoding.analysis.service;

import com.aicoding.analysis.model.systemdesign.DiagramUpsertRequest;
import com.aicoding.analysis.model.systemdesign.SystemDesignDiagram;
import com.aicoding.analysis.repository.SystemDesignDiagramRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SystemDesignService {

    private final SystemDesignDiagramRepository systemDesignDiagramRepository;

    public SystemDesignService(SystemDesignDiagramRepository systemDesignDiagramRepository) {
        this.systemDesignDiagramRepository = systemDesignDiagramRepository;
    }

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
        systemDesignDiagramRepository.save(created);
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
        systemDesignDiagramRepository.update(updated);
        return updated;
    }

    public SystemDesignDiagram getById(String diagramId) {
        return systemDesignDiagramRepository.getByDiagramId(diagramId);
    }

    public List<SystemDesignDiagram> list(String keyword, int page, int size) {
        return systemDesignDiagramRepository.list(keyword, page, size);
    }

    public void deleteById(String diagramId) {
        systemDesignDiagramRepository.deleteByDiagramId(diagramId);
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
