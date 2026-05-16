package com.aicoding.analysis.service;

import com.aicoding.analysis.model.interview.InterviewQaPair;
import com.aicoding.analysis.model.interview.InterviewRecordingReportResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class InterviewRecordingReportService {

    private static final String SYSTEM_PROMPT = """
            你是面试复盘助手。用户会提供语音转文字（ASR）的原始文本，内容来自面试录音，可能有口头语、停顿、重复、转写错误。
            
            你必须严格遵守：
            1) **唯一事实来源**：只能基于原始转写内容归纳；禁止编造录音里未出现的经历、项目、数字、公司、人名或技术结论。
            2) **清理冗余**：去掉无信息量的口头语（如“那个、嗯、就是、然后”等）、重复与纯停顿占位，压缩为保留面试实质信息的表述。不要过度脑补对话。
            3) **说话人**：若无法可靠区分面试官与面试者，可用「说话人A / 说话人B」或「面试官（推断）/ 面试者（推断）」标注，并在 uncertainties 中说明推断依据。
            4) **问答提取**：在清理后的语义上罗列面试问题与面试者的回答要点；问题与答案必须能在转写中找到对应依据。若某处因转写不清无法对齐，在 uncertainties 中列出，并仅在必要时做**最小幅度**补全，补全处需标明「原文不清，以下为合理推测」之类措辞。
            5) **面试官希望的回答**：对每个问题，除面试者实际回答外，基于该题常见考察意图与岗位语境，用 interviewerExpectedAnswer 总结「面试官更想听到的答题要点」（条理清晰；若该类题通常需要，可含数量级、口径、边界与权衡等）。不得编造与转写矛盾的事实；若转写未暴露岗位或考点，可写「结合问题与常见面试期望，供参考」并简短说明不确定性。
            6) **明显错误**：在 obviousMistakes 中总结面试者答题中的**明显错误**（事实错误、严重概念混淆、与自身前文矛盾、关键要点完全遗漏却仍下结论等）。若未发现，写「未发现明显硬伤」或说明录音信息不足无法判断。
            7) **输出格式**：仅返回一个 JSON 对象，键必须有：
               - cleanedDialogue (string)：清洗后的对话或分段文本（中文）。
               - qaPairs (array)：每项为 {"question": string, "answer": string, "interviewerExpectedAnswer": string}；interviewerExpectedAnswer 为「面试官希望的回答」正文（不要重复写「面试官希望的回答：」前缀）。
               - summary (string)：对整个面试的简短总结（中文）。
               - obviousMistakes (string 或 string[])：面试者答题明显错误总结；如为数组，合并成列表语义即可。
               - reportMarkdown (string)：完整 GitHub 风格 Markdown（中文）。必须包含这些章节：# 面试录音复盘、## 清洗后的有效内容、## 面试问与答、## 面试总结、## 面试者答题明显错误（承接 obviousMistakes）。
                 在「## 面试问与答」中，每条依次编号，格式严格为三行一组：第一行「问：…」，第二行「答：…」，第三行「面试官希望的回答：」紧接一段正文（与对应 qaPairs[].interviewerExpectedAnswer 一致）。
               - uncertainties (array of string，可选)：列举模糊点及如何处理。
            
            reportMarkdown 中的「面试者答题明显错误」必须与 obviousMistakes 一致，不得新增无依据的指责。
            """;

    private final DeepseekChatService deepseekChatService;
    private final ObjectMapper objectMapper;

    public InterviewRecordingReportService(DeepseekChatService deepseekChatService, ObjectMapper objectMapper) {
        this.deepseekChatService = deepseekChatService;
        this.objectMapper = objectMapper;
    }

    public InterviewRecordingReportResponse buildReport(String rawTranscript) {
        if (!StringUtils.hasText(rawTranscript)) {
            throw new IllegalArgumentException("Transcript is empty");
        }

        String userPrompt = """
                以下是原始 ASR 转写（可能有错误）。请按 system 要求输出 JSON：
                
                ---
                %s
                ---
                """.formatted(rawTranscript);

        String content = deepseekChatService.chatJson(SYSTEM_PROMPT, userPrompt);
        try {
            JsonNode root = objectMapper.readTree(content);
            String cleanedDialogue = root.path("cleanedDialogue").asText("");
            String summary = root.path("summary").asText("");
            String reportMarkdown = root.path("reportMarkdown").asText("");

            List<InterviewQaPair> qaPairs = new ArrayList<>();
            JsonNode qaNode = root.path("qaPairs");
            if (qaNode.isArray()) {
                for (JsonNode item : qaNode) {
                    qaPairs.add(new InterviewQaPair(
                            item.path("question").asText(""),
                            item.path("answer").asText(""),
                            item.path("interviewerExpectedAnswer").asText("")
                    ));
                }
            }

            List<String> uncertainties = new ArrayList<>();
            JsonNode u = root.path("uncertainties");
            if (u.isArray()) {
                for (JsonNode item : u) {
                    String line = item.asText("");
                    if (StringUtils.hasText(line)) {
                        uncertainties.add(line);
                    }
                }
            }

            String obviousMistakes = normalizeObviousMistakes(root.path("obviousMistakes"));

            return new InterviewRecordingReportResponse(
                    rawTranscript,
                    cleanedDialogue,
                    List.copyOf(qaPairs),
                    summary,
                    obviousMistakes,
                    List.copyOf(uncertainties),
                    reportMarkdown
            );
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse interview recording report: " + ex.getMessage(), ex);
        }
    }

    private static String normalizeObviousMistakes(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) {
            return "";
        }
        if (node.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode item : node) {
                String line = item.asText("").trim();
                if (StringUtils.hasText(line)) {
                    if (sb.length() > 0) {
                        sb.append("\n");
                    }
                    sb.append("- ").append(line);
                }
            }
            return sb.toString();
        }
        return node.asText("").trim();
    }
}
