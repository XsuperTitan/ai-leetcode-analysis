package com.aicoding.analysis.service;

import com.aicoding.analysis.model.leetcode.LeetcodeAnalysisItem;
import com.aicoding.analysis.model.leetcode.LeetcodeAnalyzeRequest;
import com.aicoding.analysis.model.leetcode.LeetcodeAlternativeSolution;
import com.aicoding.analysis.repository.LeetcodeAnalysisRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LeetcodeService {

    private static final String SYSTEM_PROMPT = """
            You are a senior coding interview coach.
            Return JSON only with keys:
            thinking, solutionCode, timeComplexity, spaceComplexity, keyPoints, alternativeSolutions.
            thinking must be very detailed but simple enough for complete beginners, using plain language.
            In thinking, use this exact structure:
            1) Problem in simple words
            2) Intuition (real-life analogy)
            3) Step-by-step algorithm
            4) Dry run with example input
            5) Why this works
            6) Edge cases
            7) Interview speaking template
            keyPoints must be an array of concise interview-ready bullets.
            alternativeSolutions must be an array with at least 2 different approaches.
            Each item must contain:
            approachName, thinking, solutionCode, timeComplexity, spaceComplexity.
            """;

    private final DeepseekChatService deepseekChatService;
    private final ObjectMapper objectMapper;
    private final LeetcodeAnalysisRepository leetcodeAnalysisRepository;

    public LeetcodeService(
            DeepseekChatService deepseekChatService,
            ObjectMapper objectMapper,
            LeetcodeAnalysisRepository leetcodeAnalysisRepository
    ) {
        this.deepseekChatService = deepseekChatService;
        this.objectMapper = objectMapper;
        this.leetcodeAnalysisRepository = leetcodeAnalysisRepository;
    }

    public LeetcodeAnalysisItem analyze(LeetcodeAnalyzeRequest request) {
        String userPrompt = """
                Solve this coding problem and explain in interview style.
                language: %s
                difficulty: %s
                title: %s
                description: %s
                constraints: %s
                If description is empty, infer the canonical LeetCode problem from title and clearly state assumptions.
                Provide the main solution and at least 2 alternative solutions.
                Keep the main explanation very beginner-friendly, as if teaching someone with no algorithm background.
                """.formatted(
                request.language(),
                request.difficulty(),
                request.title(),
                request.description(),
                request.constraints()
        );

        String content = deepseekChatService.chatJson(SYSTEM_PROMPT, userPrompt);
        try {
            JsonNode node = objectMapper.readTree(content);
            LeetcodeAnalysisItem item = new LeetcodeAnalysisItem(
                    "ana_" + UUID.randomUUID().toString().replace("-", ""),
                    request.appId(),
                    request.title(),
                    request.description(),
                    request.constraints(),
                    request.language(),
                    request.difficulty(),
                    node.path("thinking").asText(""),
                    node.path("solutionCode").asText(""),
                    node.path("timeComplexity").asText(""),
                    node.path("spaceComplexity").asText(""),
                    readStringList(node.path("keyPoints")),
                    readAlternativeSolutions(node.path("alternativeSolutions")),
                    Instant.now()
            );
            leetcodeAnalysisRepository.save(item);
            return item;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse LeetCode analysis: " + ex.getMessage(), ex);
        }
    }

    public List<LeetcodeAnalysisItem> list(String keyword, int page, int size) {
        return leetcodeAnalysisRepository.list(keyword, page, size);
    }

    public LeetcodeAnalysisItem getById(String analysisId) {
        return leetcodeAnalysisRepository.getByAnalysisId(analysisId);
    }

    private List<String> readStringList(JsonNode jsonNode) {
        List<String> result = new ArrayList<>();
        if (jsonNode == null || !jsonNode.isArray()) {
            return result;
        }
        jsonNode.forEach(item -> result.add(item.asText("")));
        return result;
    }

    private List<LeetcodeAlternativeSolution> readAlternativeSolutions(JsonNode jsonNode) {
        List<LeetcodeAlternativeSolution> result = new ArrayList<>();
        if (jsonNode == null || !jsonNode.isArray()) {
            return result;
        }
        jsonNode.forEach(item -> result.add(new LeetcodeAlternativeSolution(
                item.path("approachName").asText("Alternative approach"),
                item.path("thinking").asText(""),
                item.path("solutionCode").asText(""),
                item.path("timeComplexity").asText(""),
                item.path("spaceComplexity").asText("")
        )));
        return result;
    }
}
