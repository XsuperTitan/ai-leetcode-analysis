package com.aicoding.analysis.controller;

import com.aicoding.analysis.model.ApiResponse;
import com.aicoding.analysis.model.interview.CheatSheetRequest;
import com.aicoding.analysis.model.interview.CheatSheetResponse;
import com.aicoding.analysis.model.interview.InterviewQuestionItem;
import com.aicoding.analysis.model.interview.InterviewSearchRequest;
import com.aicoding.analysis.model.interview.InterviewSearchResult;
import com.aicoding.analysis.service.InterviewQuestionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/api/v1/interview-questions")
public class InterviewQuestionController {

    private final InterviewQuestionService interviewQuestionService;

    public InterviewQuestionController(InterviewQuestionService interviewQuestionService) {
        this.interviewQuestionService = interviewQuestionService;
    }

    @PostMapping("/search")
    public ApiResponse<InterviewSearchResult> search(@Valid @RequestBody InterviewSearchRequest request) {
        return ApiResponse.ok(interviewQuestionService.search(request));
    }

    @PostMapping("/favorites")
    public ApiResponse<Map<String, String>> addFavorite(@RequestBody Map<String, String> request) {
        String questionId = request.getOrDefault("questionId", "");
        if (questionId.isBlank()) {
            throw new IllegalArgumentException("questionId is required");
        }
        interviewQuestionService.addFavorite(questionId);
        return ApiResponse.ok(Map.of("status", "saved"));
    }

    @DeleteMapping("/favorites/{questionId}")
    public ApiResponse<Map<String, String>> removeFavorite(@PathVariable String questionId) {
        interviewQuestionService.removeFavorite(questionId);
        return ApiResponse.ok(Map.of("status", "removed"));
    }

    @GetMapping("/favorites")
    public ApiResponse<List<InterviewQuestionItem>> favorites(@RequestParam @NotBlank String appId) {
        return ApiResponse.ok(interviewQuestionService.favorites(appId));
    }

    @PostMapping("/cheat-sheet")
    public ApiResponse<CheatSheetResponse> cheatSheet(@Valid @RequestBody CheatSheetRequest request) {
        return ApiResponse.ok(interviewQuestionService.generateCheatSheetFromFavorites(request.appId()));
    }
}
