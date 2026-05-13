package com.aicoding.analysis.service;

import com.aicoding.analysis.model.leetcode.LeetcodeAnalysisItem;
import com.aicoding.analysis.model.leetcode.LeetcodeAnalyzeRequest;
import com.aicoding.analysis.model.leetcode.LeetcodeAlternativeSolution;
import com.aicoding.analysis.model.leetcode.LeetcodeCheatSheetResponse;
import com.aicoding.analysis.repository.LeetcodeAnalysisRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
public class LeetcodeService {

    private static final String CHEAT_SHEET_SYSTEM_PROMPT_EN = """
            You build ONE GitHub-flavored Markdown cheat sheet from several saved LeetCode-style analyses.
            Return JSON only with a single key: markdown.
            The markdown value is the full document (English).
            For each problem section:
            - Use ## with the problem title, then bullets for difficulty, language, time/space complexity.
            - Give a **short** interview-style explanation (tight bullets or one short paragraph). Compress long prose
              from the source, but do not drop algorithmic ideas that matter for correctness or the given code.
            - List **key points** as a compact bullet list (merge or shorten wording; keep every distinct idea).
            - Include the **main solution source code in full** inside a fenced code block with the correct language tag.
              Every line of the main solution must appear exactly as provided — never truncate, omit, or "compress" code.
            - For each alternative approach provided in the source, repeat: short explanation + **full** code in its own fenced block.
            - Do not invent code; only reorganize and narrate around the supplied solutions.
            """;

    private static final String CHEAT_SHEET_SYSTEM_PROMPT_ZH = """
            你根据多个已保存的 LeetCode 风格分析，构建一份 GitHub 风格的 Markdown 速查表。
            仅返回 JSON，包含一个键：markdown。
            markdown 的值是完整的文档（中文）。
            对于每道题的部分：
            - 使用 ## 加题目标题，然后用列表标注难度、语言、时间/空间复杂度。
            - 给出**简短的**面试风格解释（紧凑的要点或一个短段落）。压缩冗长的描述，
              但不要删除对正确性或给定代码重要的算法思想。
            - 将**关键点**列为紧凑的要点列表（合并或缩短措辞；保留每个不同的想法）。
            - 在带有正确语言标签的围栏代码块中包含**完整的**主要解决方案源代码。
              主要解决方案的每一行必须与提供的一模一样——永远不要截断、省略或"压缩"代码。
            - 对于源中提供的每个替代方法，重复：简短解释 + 在自己的围栏块中的**完整**代码。
            - 不要编造代码；只围绕提供的解决方案重新组织和叙述。
            """;

    private static final String SYSTEM_PROMPT_EN = """
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

    private static final String SYSTEM_PROMPT_ZH = """
            你是一位资深编程面试教练。
            仅返回 JSON，包含以下键：
            thinking, solutionCode, timeComplexity, spaceComplexity, keyPoints, alternativeSolutions。
            thinking 必须非常详细但对完全的初学者来说足够简单，使用通俗易懂的语言。
            在 thinking 中，使用以下精确结构：
            1) 用简单的话描述问题
            2) 直觉（生活中的类比）
            3) 逐步算法
            4) 用示例输入进行手动演算
            5) 为什么这样做是正确的
            6) 边界情况
            7) 面试口述模板
            keyPoints 必须是一个简洁的面试就绪要点数组。
            alternativeSolutions 必须是一个至少包含 2 种不同方法的数组。
            每个条目必须包含：
            approachName, thinking, solutionCode, timeComplexity, spaceComplexity。
            所有文本内容必须使用中文输出，代码保持原样，代码注释可用中文。
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
        boolean isZh = "zh".equals(request.lang());
        String systemPrompt = isZh ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;

        String userPromptEn = """
                Solve this coding problem and explain in interview style.
                language: %s
                difficulty: %s
                title: %s
                description: %s
                constraints: %s
                If description is empty, infer the canonical LeetCode problem from title and clearly state assumptions.
                Provide the main solution and at least 2 alternative solutions.
                Keep the main explanation very beginner-friendly, as if teaching someone with no algorithm background.
                """;

        String userPromptZh = """
                解决这道编程题并用面试风格解释。
                语言: %s
                难度: %s
                题目: %s
                描述: %s
                约束: %s
                如果描述为空，根据题目推断标准的 LeetCode 题目并明确说明假设。
                提供主要解决方案和至少 2 种替代方案。
                主要解释要对初学者非常友好，就像教一个没有算法基础的人一样。
                """;

        String userPrompt = (isZh ? userPromptZh : userPromptEn).formatted(
                request.language(),
                request.difficulty(),
                request.title(),
                request.description(),
                request.constraints()
        );

        String content = deepseekChatService.chatJson(systemPrompt, userPrompt);
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
                    "",
                    Instant.now()
            );
            String markdownContent = buildMarkdown(item);
            LeetcodeAnalysisItem finalized = new LeetcodeAnalysisItem(
                    item.analysisId(),
                    item.appId(),
                    item.title(),
                    item.description(),
                    item.constraints(),
                    item.language(),
                    item.difficulty(),
                    item.thinking(),
                    item.solutionCode(),
                    item.timeComplexity(),
                    item.spaceComplexity(),
                    item.keyPoints(),
                    item.alternativeSolutions(),
                    markdownContent,
                    item.createdAt()
            );
            leetcodeAnalysisRepository.save(finalized);
            return finalized;
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

    public void deleteById(String analysisId) {
        leetcodeAnalysisRepository.deleteByAnalysisId(analysisId);
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

    public String getMarkdownContent(String analysisId) {
        LeetcodeAnalysisItem item = getById(analysisId);
        if (item.markdownContent() != null && !item.markdownContent().isBlank()) {
            return item.markdownContent();
        }
        return buildMarkdown(item);
    }

    public LeetcodeCheatSheetResponse generateCheatSheetFromAnalyses(String appId, List<String> analysisIds, String lang) {
        if (analysisIds == null || analysisIds.isEmpty()) {
            throw new IllegalArgumentException("Select at least one recent analysis.");
        }
        LinkedHashSet<String> unique = new LinkedHashSet<>();
        for (String id : analysisIds) {
            if (id != null && !id.isBlank()) {
                unique.add(id.trim());
            }
        }
        if (unique.isEmpty()) {
            throw new IllegalArgumentException("Select at least one recent analysis.");
        }
        List<LeetcodeAnalysisItem> items = new ArrayList<>();
        for (String analysisId : unique) {
            LeetcodeAnalysisItem item = leetcodeAnalysisRepository.getByAnalysisId(analysisId);
            if (!appId.equals(item.appId())) {
                throw new IllegalArgumentException("Analysis " + analysisId + " does not belong to this app.");
            }
            items.add(item);
        }
        String bundle = buildCheatSheetSourceBundle(items);
        int maxChars = 120_000;
        if (bundle.length() > maxChars) {
            bundle = bundle.substring(0, maxChars) + "\n\n(Bundle truncated: select fewer analyses or items with less text.)\n";
        }
        boolean isZh = "zh".equals(lang);
        String cheatSheetSystemPrompt = isZh ? CHEAT_SHEET_SYSTEM_PROMPT_ZH : CHEAT_SHEET_SYSTEM_PROMPT_EN;

        String userPromptEn = """
                Build the final cheat sheet from the following selected analyses only.
                Follow the system rules: short explanations and key points, but every solution block must remain complete.

                --- BEGIN SELECTED ANALYSES ---
                %s
                --- END SELECTED ANALYSES ---
                """;

        String userPromptZh = """
                根据以下选定的分析构建最终的速查表。
                遵循系统规则：简短的解释和关键点，但每个解决方案代码块必须保持完整。

                --- 选定分析开始 ---
                %s
                --- 选定分析结束 ---
                """;

        String userPrompt = (isZh ? userPromptZh : userPromptEn).formatted(bundle);

        String content = deepseekChatService.chatJson(cheatSheetSystemPrompt, userPrompt);
        try {
            JsonNode root = objectMapper.readTree(content);
            String markdown = root.path("markdown").asText("").trim();
            if (markdown.isBlank()) {
                throw new IllegalStateException("Model returned empty markdown");
            }
            return new LeetcodeCheatSheetResponse(markdown, items.size());
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse cheat sheet JSON: " + ex.getMessage(), ex);
        }
    }

    private static String buildCheatSheetSourceBundle(List<LeetcodeAnalysisItem> items) {
        StringBuilder sb = new StringBuilder();
        int n = 1;
        for (LeetcodeAnalysisItem item : items) {
            sb.append("### Analysis ").append(n++).append(" — ").append(item.title()).append("\n");
            sb.append("analysisId: ").append(item.analysisId()).append("\n");
            sb.append("language: ").append(item.language()).append(" | difficulty: ").append(item.difficulty()).append("\n");
            sb.append("time: ").append(nullToEmpty(item.timeComplexity()))
                    .append(" | space: ").append(nullToEmpty(item.spaceComplexity())).append("\n\n");
            sb.append("KEY_POINTS_JSON:\n");
            if (item.keyPoints() != null) {
                for (String kp : item.keyPoints()) {
                    if (kp != null && !kp.isBlank()) {
                        sb.append("- ").append(kp.trim().replace("\n", " ")).append("\n");
                    }
                }
            }
            sb.append("\nTHINKING (may be long; compress in output, do not drop ideas needed for the code):\n");
            sb.append(clip(item.thinking(), 4_000)).append("\n\n");
            sb.append("MAIN_SOLUTION_CODE (must appear verbatim in final markdown):\n```")
                    .append(item.language()).append("\n")
                    .append(item.solutionCode() == null ? "" : item.solutionCode())
                    .append("\n```\n\n");
            if (item.alternativeSolutions() != null && !item.alternativeSolutions().isEmpty()) {
                int a = 1;
                for (LeetcodeAlternativeSolution alt : item.alternativeSolutions()) {
                    sb.append("ALT_").append(a++).append(" name: ").append(alt.approachName()).append("\n");
                    sb.append("time: ").append(nullToEmpty(alt.timeComplexity()))
                            .append(" | space: ").append(nullToEmpty(alt.spaceComplexity())).append("\n");
                    sb.append("thinking (compress in output):\n").append(clip(alt.thinking(), 2_000)).append("\n");
                    sb.append("ALT_SOLUTION_CODE (verbatim):\n```")
                            .append(item.language()).append("\n")
                            .append(alt.solutionCode() == null ? "" : alt.solutionCode())
                            .append("\n```\n\n");
                }
            }
            sb.append("\n---\n\n");
        }
        return sb.toString();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String clip(String s, int max) {
        if (s == null) {
            return "";
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max) + "\n...(truncated in bundle only; full solution code is provided separately.)";
    }

    private String buildMarkdown(LeetcodeAnalysisItem item) {
        StringBuilder builder = new StringBuilder();
        builder.append("# ").append(item.title()).append("\n\n");
        builder.append("- Analysis ID: ").append(item.analysisId()).append("\n");
        builder.append("- Language: ").append(item.language()).append("\n");
        builder.append("- Difficulty: ").append(item.difficulty()).append("\n");
        builder.append("- Time Complexity: ").append(item.timeComplexity()).append("\n");
        builder.append("- Space Complexity: ").append(item.spaceComplexity()).append("\n\n");

        if (item.description() != null && !item.description().isBlank()) {
            builder.append("## Problem Description\n\n");
            builder.append(item.description()).append("\n\n");
        }

        if (item.constraints() != null && !item.constraints().isEmpty()) {
            builder.append("## Constraints\n\n");
            for (String constraint : item.constraints()) {
                builder.append("- ").append(constraint).append("\n");
            }
            builder.append("\n");
        }

        builder.append("## Beginner Friendly Explanation\n\n");
        builder.append(item.thinking()).append("\n\n");

        builder.append("## Main Solution\n\n");
        builder.append("```").append(item.language()).append("\n");
        builder.append(item.solutionCode()).append("\n");
        builder.append("```\n\n");

        if (item.keyPoints() != null && !item.keyPoints().isEmpty()) {
            builder.append("## Key Points\n\n");
            for (String keyPoint : item.keyPoints()) {
                builder.append("- ").append(keyPoint).append("\n");
            }
            builder.append("\n");
        }

        if (item.alternativeSolutions() != null && !item.alternativeSolutions().isEmpty()) {
            builder.append("## Alternative Solutions\n\n");
            int index = 1;
            for (LeetcodeAlternativeSolution solution : item.alternativeSolutions()) {
                builder.append("### ").append(index++).append(". ").append(solution.approachName()).append("\n\n");
                builder.append("- Time Complexity: ").append(solution.timeComplexity()).append("\n");
                builder.append("- Space Complexity: ").append(solution.spaceComplexity()).append("\n\n");
                builder.append(solution.thinking()).append("\n\n");
                builder.append("```").append(item.language()).append("\n");
                builder.append(solution.solutionCode()).append("\n");
                builder.append("```\n\n");
            }
        }

        return builder.toString();
    }
}
