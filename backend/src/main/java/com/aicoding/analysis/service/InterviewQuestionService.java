package com.aicoding.analysis.service;

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

    private static final String SYSTEM_PROMPT = """
            You are a fullstack interview coach.
            Return JSON only with key: items.
            items is an array of objects with keys:
            question, answerHints, tags.
            question and answerHints must be English.
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
        String userPrompt = """
                Generate %d interview questions.
                keyword: %s
                category: %s
                level: %s
                focus stack: Angular + Java interview expectations, but code practice project stack is Vue + Spring Boot.
                """.formatted(request.count(), request.keyword(), request.category(), request.level());

        String content = deepseekChatService.chatJson(SYSTEM_PROMPT, userPrompt);
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
                            readStringList(aiItem.path("answerHints")),
                            readStringList(aiItem.path("tags")),
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
}
