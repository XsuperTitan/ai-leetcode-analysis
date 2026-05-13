package com.aicoding.analysis.service;

import com.aicoding.analysis.model.interview.CheatSheetResponse;
import com.aicoding.analysis.model.interview.InterviewQuestionItem;
import com.aicoding.analysis.model.interview.InterviewSearchRequest;
import com.aicoding.analysis.model.interview.InterviewSearchResult;
import com.aicoding.analysis.repository.InterviewQuestionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class InterviewQuestionService {

    private static final String CHEAT_SHEET_SYSTEM_PROMPT_EN = """
            You merge many interview question-and-answer notes into ONE consolidated study cheat sheet.
            Return JSON only with a single key: markdown.
            The value of markdown must be a complete GitHub-flavored Markdown document (English).
            Use a clear title (#), overview paragraph, then group related ideas under ## and ### headings.
            Prefer tight bullet lists, occasional compact tables, and **bold** for terms worth memorizing.
            Deduplicate overlapping content across sources; synthesize and reorder for quick review (most interview-signal first).
            Do not paste the raw input back verbatim; compress and reorganize.
            """;

    private static final String CHEAT_SHEET_SYSTEM_PROMPT_ZH = """
            你将多组面试问答笔记合并为一份综合学习速查表。
            仅返回 JSON，包含一个键：markdown。
            markdown 的值必须是完整的 GitHub 风格 Markdown 文档（中文）。
            使用清晰的标题（#），概述段落，然后在 ## 和 ### 标题下对相关想法进行分组。
            优先使用紧凑的要点列表、偶尔的紧凑表格，以及 **加粗** 值得记忆的术语。
            去重跨来源的重叠内容；综合并重新排序以便快速复习（面试信号最强的排在前面）。
            不要逐字粘贴原始输入；压缩并重新组织。
            """;

    private static final String SYSTEM_PROMPT_EN = """
            You are a fullstack interview coach.
            Return JSON only with key: items.
            items is an array of objects with keys:
            question, answerHints, tags.
            question and answerHints must be English.
            answerHints is an array of strings; each string is one spoken-style talking point (often 2–4 sentences).
            CRITICAL — variable structure, not a template:
            The number of answerHints entries MUST differ by question and by topic depth.
            Do NOT use a fixed bullet count (never default to exactly 4, 5, or 6 for every item).
            Narrow or factual questions: fewer, deeper bullets (often 2–4) may be enough.
            Broad, design, or multi-part questions: more bullets when the topic genuinely splits into many distinct points (e.g. 7–12+).
            Within one response, vary counts across items so the batch does not look templated.
            Never pad with empty, duplicate, or filler bullets just to reach a count.
            """;

    private static final String SYSTEM_PROMPT_ZH = """
            你是一位全栈面试教练。
            仅返回 JSON，包含键：items。
            items 是一个对象数组，每个对象包含键：
            question, answerHints, tags。
            question 和 answerHints 必须使用中文。
            answerHints 是一个字符串数组；每个字符串是一个口语风格的要点（通常 2-4 句话）。
            关键 — 可变结构，不是模板：
            answerHints 的条目数量必须因问题和主题深度而异。
            不要使用固定的要点数量（永远不要默认每个条目恰好 4、5 或 6 个）。
            狭窄或事实性问题：更少、更深入的要点（通常 2-4 个）可能就够了。
            宽泛、设计或多部分问题：当主题确实分为许多不同要点时，使用更多要点（例如 7-12+）。
            在一次响应中，各条目的要点数量应有变化，使整批看起来不像模板。
            永远不要为了凑数而添加空白、重复或填充要点。
            """;

    private final DeepseekChatService deepseekChatService;
    private final ObjectMapper objectMapper;
    private final InterviewQuestionRepository interviewQuestionRepository;

    public InterviewQuestionService(
            DeepseekChatService deepseekChatService,
            ObjectMapper objectMapper,
            InterviewQuestionRepository interviewQuestionRepository
    ) {
        this.deepseekChatService = deepseekChatService;
        this.objectMapper = objectMapper;
        this.interviewQuestionRepository = interviewQuestionRepository;
    }

    public InterviewSearchResult search(InterviewSearchRequest request) {
        String queryId = "q_" + UUID.randomUUID().toString().replace("-", "");
        boolean isZh = "zh".equals(request.lang());
        String systemPrompt = isZh ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;

        String userPromptEn = """
                Generate %d interview questions.
                keyword: %s
                category: %s
                level: %s
                focus stack: Angular + Java interview expectations, but code practice project stack is Vue + Spring Boot.

                For each question, choose answerHints length by substance only:
                if the question is tight (definition, one API, one behavior), keep bullets few and rich;
                if it spans design, trade-offs, failure modes, and examples, use more bullets only where each adds a new idea.
                """;

        String userPromptZh = """
                生成 %d 道面试题。
                关键词: %s
                分类: %s
                级别: %s
                重点技术栈: Angular + Java 面试期望，但代码练习项目技术栈是 Vue + Spring Boot。

                对于每道题，仅根据实质内容选择 answerHints 长度：
                如果问题很具体（定义、一个 API、一个行为），保持要点少而精；
                如果涉及设计、权衡、故障模式和示例，只在每个要点增加新想法时才使用更多要点。
                """;

        String userPrompt = (isZh ? userPromptZh : userPromptEn).formatted(request.count(), request.keyword(), request.category(), request.level());

        String content = deepseekChatService.chatJson(systemPrompt, userPrompt);
        try {
            JsonNode root = objectMapper.readTree(content);
            List<InterviewQuestionItem> items = new ArrayList<>();
            JsonNode aiItems = root.path("items");
            if (aiItems.isArray()) {
                for (JsonNode aiItem : aiItems) {
                    String questionId = "iq_" + UUID.randomUUID().toString().replace("-", "");
                    items.add(new InterviewQuestionItem(
                            questionId,
                            queryId,
                            request.appId(),
                            aiItem.path("question").asText(""),
                            readNonEmptyStringList(aiItem.path("answerHints")),
                            readNonEmptyStringList(aiItem.path("tags")),
                            false,
                            Instant.now()
                    ));
                }
            }
            interviewQuestionRepository.saveAll(items, request.category(), request.level());
            return new InterviewSearchResult(queryId, markFavorite(request.appId(), items));
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse interview questions: " + ex.getMessage(), ex);
        }
    }

    public void addFavorite(String questionId) {
        interviewQuestionRepository.addFavorite(questionId);
    }

    public void removeFavorite(String questionId) {
        interviewQuestionRepository.removeFavorite(questionId);
    }

    public List<InterviewQuestionItem> favorites(String appId) {
        return interviewQuestionRepository.listFavorites(appId);
    }

    /**
     * Loads all favorites for the app, sends them to the LLM, and returns a single synthesized Markdown cheat sheet.
     */
    public CheatSheetResponse generateCheatSheetFromFavorites(String appId, String lang) {
        List<InterviewQuestionItem> favorites = interviewQuestionRepository.listFavorites(appId);
        if (favorites.isEmpty()) {
            throw new IllegalArgumentException("Add at least one favorite interview question before generating a cheat sheet.");
        }
        String bundle = buildFavoritesBundleForPrompt(favorites);
        boolean isZh = "zh".equals(lang);
        String cheatSheetSystemPrompt = isZh ? CHEAT_SHEET_SYSTEM_PROMPT_ZH : CHEAT_SHEET_SYSTEM_PROMPT_EN;

        String userPromptEn = """
                Create the final cheat sheet from the following favorite interview items (questions and talking points).
                Each block is one starred favorite; preserve all important technical content while merging overlaps.

                --- BEGIN FAVORITES ---
                %s
                --- END FAVORITES ---
                """;

        String userPromptZh = """
                根据以下收藏的面试题目（问题和要点）创建最终的速查表。
                每个块是一个收藏项；保留所有重要的技术内容，同时合并重叠部分。

                --- 收藏开始 ---
                %s
                --- 收藏结束 ---
                """;

        String userPrompt = (isZh ? userPromptZh : userPromptEn).formatted(bundle);

        String content = deepseekChatService.chatJson(cheatSheetSystemPrompt, userPrompt);
        try {
            JsonNode root = objectMapper.readTree(content);
            String markdown = root.path("markdown").asText("").trim();
            if (markdown.isBlank()) {
                throw new IllegalStateException("Model returned empty markdown");
            }
            return new CheatSheetResponse(markdown, favorites.size());
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse cheat sheet JSON: " + ex.getMessage(), ex);
        }
    }

    private static String buildFavoritesBundleForPrompt(List<InterviewQuestionItem> favorites) {
        StringBuilder sb = new StringBuilder();
        int n = 1;
        for (InterviewQuestionItem item : favorites) {
            sb.append("### Favorite ").append(n++).append("\n");
            sb.append("Question:\n").append(item.question().trim()).append("\n\n");
            sb.append("Talking points:\n");
            for (String hint : item.answerHints()) {
                if (hint != null && !hint.isBlank()) {
                    sb.append("- ").append(hint.trim().replace("\n", " ")).append("\n");
                }
            }
            if (!item.tags().isEmpty()) {
                sb.append("Tags: ").append(String.join(", ", item.tags())).append("\n");
            }
            sb.append("\n");
        }
        String out = sb.toString();
        int max = 90_000;
        if (out.length() > max) {
            return out.substring(0, max) + "\n\n(Bundle truncated for model context length.)\n";
        }
        return out;
    }

    private List<InterviewQuestionItem> markFavorite(String appId, List<InterviewQuestionItem> items) {
        Set<String> favoriteQuestionIds = interviewQuestionRepository.findFavoriteQuestionIds(
                appId,
                items.stream().map(InterviewQuestionItem::questionId).toList()
        );
        return items.stream()
                .map(item -> new InterviewQuestionItem(
                        item.questionId(),
                        item.queryId(),
                        item.appId(),
                        item.question(),
                        item.answerHints(),
                        item.tags(),
                        favoriteQuestionIds.contains(item.questionId()),
                        item.createdAt()
                ))
                .toList();
    }

    private List<String> readStringList(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return result;
        }
        node.forEach(entry -> result.add(entry.asText("")));
        return result;
    }

    private List<String> readNonEmptyStringList(JsonNode node) {
        List<String> raw = readStringList(node);
        List<String> out = new ArrayList<>();
        for (String s : raw) {
            if (s != null && !s.isBlank()) {
                out.add(s.trim());
            }
        }
        return out;
    }
}
