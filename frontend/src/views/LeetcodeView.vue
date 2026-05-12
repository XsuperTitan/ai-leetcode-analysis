<template>
  <section class="card">
    <h2>LeetCode Analyze</h2>
    <div class="row">
      <input v-model="title" placeholder="Title" />
      <select v-model="language">
        <option value="java">Java</option>
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
      </select>
      <select v-model="difficulty">
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
    <textarea v-model="description" placeholder="Problem description (optional, title-only is supported)"></textarea>
    <div class="row">
      <input v-model="constraintsInput" placeholder="Constraints separated by ;" />
      <button type="button" @click="submit" :disabled="loading">{{ loading ? "Analyzing..." : "Analyze" }}</button>
    </div>
    <p v-if="validationMessage" class="validation">{{ validationMessage }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </section>

  <section v-if="result" class="card">
    <h3>{{ result.title }}</h3>
    <div class="row">
      <button type="button" class="secondary" @click="downloadMarkdown(result.analysisId)">Download Markdown</button>
      <span>{{ result.analysisId }}</span>
    </div>
    <p><strong>Simple Detailed Explanation:</strong></p>
    <pre class="pre-wrap">{{ result.thinking }}</pre>
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
    <pre class="pre-wrap">{{ result.markdownContent }}</pre>
  </section>

  <section class="card recent-section">
    <h3>Recent Analyses</h3>
    <p class="hint">
      Tick any subset of saved analyses, then <strong>Generate cheat sheet</strong> (LLM runs only on that click).
      The sheet uses <strong>short</strong> explanations and compressed key points, but keeps every
      <strong>solution block complete</strong> (same idea as the Interview Favorites cheat sheet + Markdown download).
    </p>
    <div class="recent-toolbar">
      <button type="button" class="secondary" @click="loadHistory">Refresh</button>
      <button type="button" class="secondary" @click="selectAllHistory" :disabled="history.length === 0">
        Select all
      </button>
      <button type="button" class="secondary" @click="clearSelection" :disabled="selectedIds.length === 0">
        Clear selection
      </button>
      <span class="count">{{ selectedIds.length }} selected</span>
    </div>

    <ul class="history-list">
      <li v-for="item in history" :key="item.analysisId" class="history-row">
        <div class="history-check">
          <input
            :id="`chk-${item.analysisId}`"
            type="checkbox"
            :checked="selectedIds.includes(item.analysisId)"
            @change="onToggleAnalysis($event, item.analysisId)"
          />
        </div>
        <label class="history-title-label" :for="`chk-${item.analysisId}`">
          {{ item.title }} ({{ item.language }}, {{ item.difficulty }})
        </label>
        <div class="history-actions">
          <button type="button" class="secondary" @click="openHistory(item.analysisId)">Open</button>
          <button type="button" class="danger" @click="deleteHistory(item.analysisId)">Delete</button>
        </div>
      </li>
    </ul>

    <h4 class="cheat-title">Cheat sheet from selected analyses</h4>
    <div class="cheat-toolbar">
      <button type="button" :disabled="generatingCheat || selectedIds.length === 0" @click="generateCheatSheet">
        {{ generatingCheat ? "Generating…" : "Generate cheat sheet" }}
      </button>
      <button type="button" class="secondary" :disabled="!cheatMarkdown.trim()" @click="downloadCheatMarkdown">
        Download Markdown
      </button>
    </div>
    <p v-if="cheatMeta" class="meta">{{ cheatMeta }}</p>
    <p v-if="staleCheatHint" class="stale-hint">{{ staleCheatHint }}</p>
    <p v-if="!cheatMarkdown.trim() && !generatingCheat" class="muted">Preview appears here after generation.</p>
    <pre v-if="cheatMarkdown.trim()" class="cheat-preview">{{ cheatMarkdown }}</pre>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import {
  analyzeLeetcode,
  deleteLeetcodeAnalysis,
  downloadLeetcodeMarkdown,
  generateLeetcodeCheatSheet,
  getLeetcodeAnalysis,
  listLeetcode
} from "../api/client";
import { useAppStore } from "../stores/app";
import { useLeetcodeStore } from "../stores/leetcode";

const appStore = useAppStore();
const leetcodeStore = useLeetcodeStore();
const { title, description, language, difficulty, constraintsInput, result, history } = storeToRefs(leetcodeStore);
const loading = ref(false);
const validationMessage = ref("");
const errorMessage = ref("");

const selectedIds = ref<string[]>([]);
const generatingCheat = ref(false);
const cheatMarkdown = ref("");
const cheatIdsAtGenerate = ref<string[]>([]);

function sortedKey(ids: string[]): string {
  return [...ids].sort().join("\u0001");
}

const cheatMeta = computed(() => {
  if (!cheatMarkdown.value.trim() || cheatIdsAtGenerate.value.length === 0) {
    return "";
  }
  return `Last sheet used ${cheatIdsAtGenerate.value.length} analysis(es).`;
});

const staleCheatHint = computed(() => {
  if (!cheatMarkdown.value.trim()) {
    return "";
  }
  if (sortedKey(cheatIdsAtGenerate.value) !== sortedKey(selectedIds.value)) {
    return "Your checkbox selection changed since the last run — generate again to align the sheet with the current pick.";
  }
  return "";
});

watch([title, description, language, difficulty, constraintsInput], () => {
  leetcodeStore.persist();
});

async function submit() {
  validationMessage.value = "";
  errorMessage.value = "";
  if (!title.value.trim()) {
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
      title: title.value,
      description: description.value,
      constraints,
      language: language.value,
      difficulty: difficulty.value
    });
    leetcodeStore.setResult(result.value);
    await loadHistory();
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function loadHistory() {
  const list = await listLeetcode("", 0, 50);
  leetcodeStore.setHistory(list);
  const valid = new Set(list.map((i) => i.analysisId));
  selectedIds.value = selectedIds.value.filter((id) => valid.has(id));
}

function selectAllHistory() {
  selectedIds.value = history.value.map((h) => h.analysisId);
}

function clearSelection() {
  selectedIds.value = [];
}

function onToggleAnalysis(ev: Event, analysisId: string) {
  const checked = (ev.target as HTMLInputElement).checked;
  if (checked) {
    if (!selectedIds.value.includes(analysisId)) {
      selectedIds.value = [...selectedIds.value, analysisId];
    }
  } else {
    selectedIds.value = selectedIds.value.filter((id) => id !== analysisId);
  }
}

async function openHistory(analysisId: string) {
  errorMessage.value = "";
  try {
    const detail = await getLeetcodeAnalysis(analysisId);
    leetcodeStore.setResult(detail);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

async function downloadMarkdown(analysisId: string) {
  errorMessage.value = "";
  try {
    const item =
      result.value && result.value.analysisId === analysisId ? result.value : await getLeetcodeAnalysis(analysisId);
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

async function deleteHistory(analysisId: string) {
  errorMessage.value = "";
  try {
    await deleteLeetcodeAnalysis(analysisId);
    leetcodeStore.removeHistoryItem(analysisId);
    selectedIds.value = selectedIds.value.filter((id) => id !== analysisId);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

async function generateCheatSheet() {
  errorMessage.value = "";
  if (selectedIds.value.length === 0) {
    errorMessage.value = "Select at least one recent analysis.";
    return;
  }
  generatingCheat.value = true;
  cheatMarkdown.value = "";
  try {
    const resp = await generateLeetcodeCheatSheet({
      appId: appStore.appId,
      analysisIds: [...selectedIds.value]
    });
    cheatMarkdown.value = resp.markdown;
    cheatIdsAtGenerate.value = [...selectedIds.value];
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
    cheatIdsAtGenerate.value = [];
  } finally {
    generatingCheat.value = false;
  }
}

function downloadCheatMarkdown() {
  errorMessage.value = "";
  const body = cheatMarkdown.value.trim();
  if (!body) {
    errorMessage.value = "Generate a cheat sheet first.";
    return;
  }
  const safeApp = appStore.appId.replace(/[^a-zA-Z0-9\-_]+/g, "_");
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `leetcode-cheat-sheet-${safeApp}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

if (history.value.length === 0) {
  void loadHistory();
}

function extractErrorMessage(error: unknown): string {
  const maybeAxios = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return maybeAxios.response?.data?.message || maybeAxios.message || "Analyze failed";
}
</script>

<style scoped>
.validation,
.error {
  color: #dc2626;
  margin: 0;
}

.validation {
  margin-bottom: 6px;
}

.pre-wrap {
  white-space: pre-wrap;
}

.recent-section .hint {
  font-size: 14px;
  color: #475569;
  line-height: 1.45;
  margin: 0 0 12px;
}

.recent-section .recent-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.recent-section .recent-toolbar .count {
  margin-left: auto;
}

@media (max-width: 520px) {
  .recent-section .recent-toolbar .count {
    margin-left: 0;
    width: 100%;
  }
}

.count {
  font-size: 14px;
  color: #64748b;
}

.history-list {
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.history-row {
  display: grid;
  grid-template-columns: 2.25rem 1fr auto;
  align-items: center;
  column-gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  min-height: 48px;
}

.history-row:last-child {
  border-bottom: none;
}

.history-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Global styles.css sets input { width: 100% } — reset for row checkboxes */
.history-check input[type="checkbox"] {
  width: 1.1rem;
  height: 1.1rem;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  cursor: pointer;
}

.history-title-label {
  font-weight: 500;
  line-height: 1.35;
  cursor: pointer;
  min-width: 0;
  padding: 4px 0;
}

.history-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .history-row {
    grid-template-columns: 2.25rem 1fr;
    grid-template-rows: auto auto;
  }

  .history-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    padding-top: 4px;
  }
}

.cheat-title {
  margin: 8px 0 10px;
  font-size: 1rem;
}

.cheat-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.meta {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 6px;
}

.stale-hint {
  font-size: 13px;
  color: #b45309;
  margin: 0 0 8px;
}

.muted {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 8px;
}

.cheat-preview {
  margin: 0;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: min(60vh, 560px);
  overflow-y: auto;
}
</style>
