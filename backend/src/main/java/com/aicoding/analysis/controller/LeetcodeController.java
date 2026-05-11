package com.aicoding.analysis.controller;

import com.aicoding.analysis.model.ApiResponse;
import com.aicoding.analysis.model.leetcode.LeetcodeAnalysisItem;
import com.aicoding.analysis.model.leetcode.LeetcodeAnalyzeRequest;
import com.aicoding.analysis.service.LeetcodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/leetcode")
public class LeetcodeController {

    private final LeetcodeService leetcodeService;

    public LeetcodeController(LeetcodeService leetcodeService) {
        this.leetcodeService = leetcodeService;
    }

    @PostMapping("/analyze")
    public ApiResponse<LeetcodeAnalysisItem> analyze(@Valid @RequestBody LeetcodeAnalyzeRequest request) {
        return ApiResponse.ok(leetcodeService.analyze(request));
    }

    @GetMapping("/analyses")
    public ApiResponse<List<LeetcodeAnalysisItem>> list(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(leetcodeService.list(keyword, page, size));
    }

    @GetMapping("/analyses/{analysisId}")
    public ApiResponse<LeetcodeAnalysisItem> detail(@PathVariable String analysisId) {
        return ApiResponse.ok(leetcodeService.getById(analysisId));
    }

    @GetMapping("/analyses/{analysisId}/markdown")
    public ResponseEntity<byte[]> downloadMarkdown(@PathVariable String analysisId) {
        LeetcodeAnalysisItem item = leetcodeService.getById(analysisId);
        String markdown = leetcodeService.getMarkdownContent(analysisId);
        String safeTitle = item.title().replaceAll("[^a-zA-Z0-9\\-_]+", "_");
        String fileName = safeTitle + "-" + analysisId + ".md";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("text/markdown"))
                .body(markdown.getBytes(StandardCharsets.UTF_8));
    }

    @DeleteMapping("/analyses/{analysisId}")
    public ApiResponse<Map<String, String>> delete(@PathVariable String analysisId) {
        leetcodeService.deleteById(analysisId);
        return ApiResponse.ok(Map.of("status", "deleted"));
    }
}
