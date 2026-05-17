# AI Coding Analysis

全栈面试练习与 AI 辅助工具：算法题解析、系统设计草稿、英文面试题生成，以及**面试录音（MP3）转写 + Markdown 复盘报告**。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Vite、TypeScript、Pinia、Vue Router、Axios |
| 后端 | Spring Boot 3.3、Java 21、JDBC + MyBatis、MySQL |
| 文本 LLM | DeepSeek Chat API（OpenAI 兼容 `/chat/completions`，`response_format: json_object`） |
| 语音转写（ASR） | OpenAI 兼容 `/audio/transcriptions`（multipart）；支持 **Whisper 风格**与 **StepFun（Challenger）**，由配置切换 |

## 项目架构

```
ai-coding-analysis/
├── frontend/                 # Vue SPA
│   ├── src/
│   │   ├── api/client.ts     # 后端 /api/v1 调用（含面试录音 multipart 上传）
│   │   ├── router/           # 路由：首页、LeetCode、系统设计、面试题、收藏
│   │   ├── stores/           # Pinia（含 appId 等）
│   │   └── views/
│   │       └── HomeView.vue  # 首页：模块说明、appId、MP3 上传与报告展示/下载
│   └── vite.config.ts
├── backend/
│   ├── src/main/java/com/aicoding/analysis/
│   │   ├── AiCodingAnalysisApplication.java
│   │   ├── config/           # DeepseekProperties、AsrProperties、InterviewRecordingProperties、WebConfig（CORS）
│   │   ├── controller/       # REST：leetcode、system-design、interview-questions、interview-recording
│   │   ├── service/          # 业务：DeepseekChatService、TranscriptionService、InterviewRecordingReportService 等
│   │   ├── repository/       # 持久化封装
│   │   ├── mapper/           # MyBatis Mapper
│   │   └── model/            # DTO、ApiResponse 等
│   ├── src/main/resources/
│   │   ├── application.yml   # 端口、数据源、multipart、deepseek、asr、上传上限
│   │   └── schema.sql        # MySQL 表初始化（spring.sql.init.mode=always）
│   ├── .env.local.example    # 环境变量模板（复制为 .env.local）
│   └── pom.xml
└── README.md
```

### 请求链路（面试录音报告）

1. 浏览器：`POST /api/v1/interview-recording/report`，`multipart/form-data`，字段 `file`（MP3）、可选 `appId`（**字符串**，勿转成数字）。
2. `InterviewRecordingController`：校验 `.mp3` 与大小上限 → `TranscriptionService` 调 ASR → 得到原文。
3. `InterviewRecordingReportService`：`DeepseekChatService.chatJson` 基于原文生成结构化 JSON，并拼出 **Markdown 报告**（含问与答、**面试官希望的回答**、总结、答题明显错误等）。
4. 前端展示 `reportMarkdown`，并支持下载 `.md`。

### 后端分层约定

- **Controller**：`/api/v1/...`，统一包装 `ApiResponse`（成功 `code: 0`）。
- **Service**：LLM 调用、转写、领域逻辑。
- **Repository / Mapper**：MySQL 数据访问。
- **GlobalExceptionHandler**：`IllegalArgumentException` → HTTP 400 风格业务码（见 `ApiResponse`）。

## 功能概览

- **LeetCode 风格分析**：题解思路、代码、复杂度、Markdown 导出。
- **系统设计草稿**：可编辑节点、连线、画布元数据，持久化到 MySQL。
- **面试题**：按关键词等生成 AI 提示；收藏与合并 **速查表（cheat sheet）**。
- **首页 · 面试录音（MP3）**  
  - 上传 MP3 → ASR 转写 → DeepSeek 生成复盘报告。  
  - 报告 Markdown 包含：清洗后有效内容、问与答（每条含 **问 / 答 / 面试官希望的回答**）、面试总结、面试者答题明显错误。  
  - 原始 ASR 文本可在页面折叠查看；报告可下载为 `.md`。

## 近期改动摘要

- **面试录音**：新增 `TranscriptionService`（对齐 ai-no-note）、`InterviewRecordingController`、`InterviewRecordingReportService`；`application.yml` 中 `asr.*` 与 `spring.servlet.multipart`（**30MB**）。
- **依赖**：`pom.xml` 显式加入 `org.reactivestreams:reactive-streams`，避免 `RestClient` 发送 multipart 时出现 `NoClassDefFoundError: org/reactivestreams/Publisher`。
- **报告内容**：`InterviewQaPair` 增加 `interviewerExpectedAnswer`，报告与 JSON 中同步体现「面试官希望的回答」。
- **配置**：`app.interview-recording.max-upload-size-bytes`（默认 31457280，即 30MB）；可用 `INTERVIEW_RECORDING_MAX_UPLOAD_BYTES` 覆盖。

## 本地启动配置

### 环境要求

- **JDK 21**
- **Node.js**（建议 18+）与 npm
- **MySQL**（本地库名示例：`ai_coding_analysis`）

### 1. 数据库

创建数据库（名称需与 `MYSQL_URL` 一致），例如：

```sql
CREATE DATABASE IF NOT EXISTS ai_coding_analysis
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

应用启动时会执行 `schema.sql` 初始化表（`spring.sql.init.mode: always`）。

### 2. 后端

```bash
cd backend
cp .env.local.example .env.local
# 编辑 .env.local：至少配置 DEEPSEEK_API_KEY、MYSQL_*；
# 若使用首页 MP3 转写，还需配置 ASR（如 STEPFUN_* 或 ASR_WHISPER_*）。
mvn spring-boot:run
```

- 服务地址：**http://localhost:8080**
- API 前缀：**/api/v1**

### 3. 前端

```bash
cd frontend
npm install
npm run dev
```

- 页面地址：**http://localhost:5173**
- 前端通过 Axios 访问 **http://localhost:8080/api/v1**（见 `frontend/src/api/client.ts`）。
- CORS：后端允许来源 **http://localhost:5173**（`WebConfig`）。

### 4. 环境变量说明（`backend/.env.local`）

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek 文本模型密钥（报告生成、面试题等） |
| `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL` / `DEEPSEEK_CHAT_PATH` | 可选覆盖默认值 |
| `MYSQL_URL` / `MYSQL_USERNAME` / `MYSQL_PASSWORD` | 数据源 |
| `ASR_DEFAULT_PROVIDER` | `auto`（默认）/ `whisper` / `challenger` |
| `STEPFUN_*` 或 `ASR_CHALLENGER_*` | StepFun 兼容 ASR |
| `ASR_WHISPER_*` 或 `OPENAI_API_KEY` 等 | Whisper 兼容 ASR |
| `INTERVIEW_RECORDING_MAX_UPLOAD_BYTES` | 面试 MP3 大小上限（字节） |

**安全**：勿将 `.env.local` 提交到 Git；密钥仅放本机。

### 5. 约定

- **`appId`**：在全栈传递时始终保持 **字符串**类型，避免大整数精度问题。

## 主要 HTTP 接口（节选）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/interview-recording/report` | `multipart`：`file`（MP3），可选 `appId` |
| POST | `/api/v1/interview-questions/search` | JSON 搜索面试题 |
| POST | `/api/v1/leetcode/analyze` | LeetCode 分析 |
| … | 其余见各 `*Controller` | |

## Git 与 GitHub（推送代码）

远程通常为 GitHub 上的 `origin`。

```bash
git checkout main
git pull origin main
git status
git add -A
git commit -m "Describe your change in one clear sentence."
git push origin main
```

若在其它分支开发，先合并或通过 Pull Request 合入 `main` 再推送。
