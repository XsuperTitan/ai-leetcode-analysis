<template>
  <section class="card">
    <h2>LeetCode Analyze</h2>
    <div class="row">
      <input v-model="form.title" placeholder="Title" />
      <select v-model="form.language">
        <option value="java">Java</option>
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
      </select>
      <select v-model="form.difficulty">
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
    <textarea v-model="form.description" placeholder="Problem description (optional, title-only is supported)"></textarea>
    <div class="row">
      <input v-model="constraintsInput" placeholder="Constraints separated by ;" />
      <button @click="submit" :disabled="loading">{{ loading ? "Analyzing..." : "Analyze" }}</button>
    </div>
    <p v-if="validationMessage" style="color: #dc2626; margin: 0 0 6px;">{{ validationMessage }}</p>
    <p v-if="errorMessage" style="color: #dc2626; margin: 0;">{{ errorMessage }}</p>
  </section>

  <section v-if="result" class="card">
    <h3>{{ result.title }}</h3>
    <div class="row">
      <button class="secondary" @click="downloadMarkdown(result.analysisId)">Download Markdown</button>
      <span>{{ result.analysisId }}</span>
    </div>
    <p><strong>Simple Detailed Explanation:</strong></p>
    <pre style="white-space: pre-wrap;">{{ result.thinking }}</pre>
    <p><strong>Time:</strong> {{ result.timeComplexity }} | <strong>Space:</strong> {{ result.spaceComplexity }}</p>
    <p><strong>Key points:</strong></p>
    <ul>
      <li v-for="item in result.keyPoints" :key="item">{{ item }}</li>
    </ul>
    <h4>Solution Code</h4>
    <pre>{{ result.solutionCode }}</pre>

    <h4>Alternative Solutions</h4>
    <div v-if="result.alternativeSolutions.length === 0">No alternative solution returned.</div>
    <div v-for="(solution, idx) in result.alternativeSolutions" :key="`${solution.approachName}-${idx}`" class="card">
      <p><strong>{{ idx + 1 }}. {{ solution.approachName }}</strong></p>
      <p><strong>Thinking:</strong> {{ solution.thinking }}</p>
      <p><strong>Time:</strong> {{ solution.timeComplexity }} | <strong>Space:</strong> {{ solution.spaceComplexity }}</p>
      <pre>{{ solution.solutionCode }}</pre>
    </div>

    <h4>Markdown Content</h4>
    <pre style="white-space: pre-wrap;">{{ result.markdownContent }}</pre>
  </section>

  <section class="card">
    <h3>Recent Analyses</h3>
    <button class="secondary" @click="loadHistory">Refresh</button>
    <ul>
      <li v-for="item in history" :key="item.analysisId">
        <button class="secondary" @click="openHistory(item.analysisId)">
          {{ item.title }} ({{ item.language }})
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { analyzeLeetcode, downloadLeetcodeMarkdown, getLeetcodeAnalysis, listLeetcode } from "../api/client";
import { useAppStore } from "../stores/app";
import type { LeetcodeAnalysisItem } from "../types/api";

const appStore = useAppStore();
const loading = ref(false);
const result = ref<LeetcodeAnalysisItem | null>(null);
const history = ref<LeetcodeAnalysisItem[]>([]);
const constraintsInput = ref("");
const validationMessage = ref("");
const errorMessage = ref("");

const form = reactive({
  title: "",
  description: "",
  language: "java",
  difficulty: "easy"
});

async function submit() {
  validationMessage.value = "";
  errorMessage.value = "";
  if (!form.title.trim()) {
    validationMessage.value = "Please enter problem title.";
    return;
  }

  loading.value = true;
  try {
    const constraints = constraintsInput.value
      .split(";")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    result.value = await analyzeLeetcode({
      appId: appStore.appId,
      title: form.title,
      description: form.description,
      constraints,
      language: form.language,
      difficulty: form.difficulty
    });
    await loadHistory();
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function loadHistory() {
  history.value = await listLeetcode();
}

async function openHistory(analysisId: string) {
  errorMessage.value = "";
  try {
    result.value = await getLeetcodeAnalysis(analysisId);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

async function downloadMarkdown(analysisId: string) {
  errorMessage.value = "";
  try {
    const item = result.value && result.value.analysisId === analysisId
      ? result.value
      : await getLeetcodeAnalysis(analysisId);
    if (!item) {
      return;
    }
    const blob = await downloadLeetcodeMarkdown(analysisId);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.title.replace(/[^a-zA-Z0-9\-_]+/g, "_")}-${analysisId}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

void loadHistory();

function extractErrorMessage(error: unknown): string {
  const maybeAxios = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return maybeAxios.response?.data?.message || maybeAxios.message || "Analyze failed";
}
</script>
