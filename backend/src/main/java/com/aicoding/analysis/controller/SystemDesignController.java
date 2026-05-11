package com.aicoding.analysis.controller;

import com.aicoding.analysis.model.ApiResponse;
import com.aicoding.analysis.model.systemdesign.DiagramUpsertRequest;
import com.aicoding.analysis.model.systemdesign.SystemDesignDiagram;
import com.aicoding.analysis.service.SystemDesignService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system-design")
public class SystemDesignController {

    private final SystemDesignService systemDesignService;

    public SystemDesignController(SystemDesignService systemDesignService) {
        this.systemDesignService = systemDesignService;
    }

    @PostMapping("/diagrams")
    public ApiResponse<SystemDesignDiagram> create(@Valid @RequestBody DiagramUpsertRequest request) {
        return ApiResponse.ok(systemDesignService.create(request));
    }

    @PutMapping("/diagrams/{diagramId}")
    public ApiResponse<SystemDesignDiagram> update(
            @PathVariable String diagramId,
            @Valid @RequestBody DiagramUpsertRequest request
    ) {
        return ApiResponse.ok(systemDesignService.update(diagramId, request));
    }

    @GetMapping("/diagrams/{diagramId}")
    public ApiResponse<SystemDesignDiagram> detail(@PathVariable String diagramId) {
        return ApiResponse.ok(systemDesignService.getById(diagramId));
    }

    @GetMapping("/diagrams")
    public ApiResponse<List<SystemDesignDiagram>> list(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(systemDesignService.list(keyword, page, size));
    }

    @PostMapping("/diagrams/{diagramId}/export")
    public ApiResponse<Map<String, String>> exportJson(@PathVariable String diagramId) {
        return ApiResponse.ok(Map.of("format", "json", "content", systemDesignService.exportAsJson(diagramId)));
    }

    @DeleteMapping("/diagrams/{diagramId}")
    public ApiResponse<Map<String, String>> delete(@PathVariable String diagramId) {
        systemDesignService.deleteById(diagramId);
        return ApiResponse.ok(Map.of("status", "deleted"));
    }
}
