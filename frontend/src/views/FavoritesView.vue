<template>
  <section class="card favorites-page">
    <h2>Favorite Questions</h2>
    <p class="intro">
      Left: your starred interview items. Right: build a single <strong>cheat sheet</strong> from all of them via the
      LLM, then review or download Markdown (same idea as LeetCode “Download Markdown”, but from the preview text).
    </p>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="split">
      <aside class="panel panel-left">
        <div class="panel-head">
          <h3>Favorites</h3>
          <button type="button" class="secondary" @click="load">Refresh</button>
        </div>
        <p v-if="items.length === 0" class="muted">No favorites yet. Star items from Interview Questions.</p>
        <ul v-else class="fav-list">
          <li v-for="item in items" :key="item.questionId" class="fav-item">
            <p class="fav-q">{{ item.question }}</p>
            <ul class="fav-hints">
              <li v-for="(hint, idx) in item.answerHints" :key="`${item.questionId}-h-${idx}`">{{ hint }}</li>
            </ul>
            <button type="button" class="danger small" @click="removeFromFavorites(item.questionId)">
              Remove
            </button>
          </li>
        </ul>
      </aside>

      <div class="panel panel-right">
        <div class="panel-head">
          <h3>Cheat sheet review</h3>
          <div class="panel-actions">
            <select v-model="lang" class="lang-select">
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
            <button
              type="button"
              :disabled="generating || items.length === 0"
              @click="generateCheatSheet"
            >
              {{ generating ? "Generating…" : "Generate cheat sheet" }}
            </button>
            <button
              type="button"
              class="secondary"
              :disabled="!cheatSheetMarkdown.trim()"
              @click="downloadMarkdown"
            >
              Download Markdown
            </button>
          </div>
        </div>
        <p v-if="cheatMeta" class="meta">{{ cheatMeta }}</p>
        <p v-if="staleHint" class="stale-hint">{{ staleHint }}</p>
        <div v-if="!cheatSheetMarkdown.trim() && !generating" class="muted preview-placeholder">
          Click <strong>Generate cheat sheet</strong> to combine all favorites and call the LLM. The result appears
          here.
        </div>
        <pre v-else class="markdown-preview">{{ cheatSheetMarkdown }}</pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { generateInterviewCheatSheet, getFavorites, removeFavorite } from "../api/client";
import { useAppStore } from "../stores/app";
import { useInterviewStore } from "../stores/interview";
import type { InterviewQuestionItem } from "../types/api";

const appStore = useAppStore();
const interviewStore = useInterviewStore();
const items = ref<InterviewQuestionItem[]>([]);
const lang = ref("en");
const errorMessage = ref("");
const generating = ref(false);
const cheatSheetMarkdown = ref("");
const cheatSheetSourceCount = ref<number | null>(null);

const cheatMeta = computed(() => {
  if (cheatSheetSourceCount.value == null || !cheatSheetMarkdown.value.trim()) {
    return "";
  }
  return `Last sheet built from ${cheatSheetSourceCount.value} favorite(s).`;
});

const staleHint = computed(() => {
  if (cheatSheetSourceCount.value == null) return "";
  if (items.value.length !== cheatSheetSourceCount.value) {
    return "Your favorites list changed — generate again for an up-to-date cheat sheet.";
  }
  return "";
});

async function load() {
  errorMessage.value = "";
  try {
    items.value = await getFavorites(appStore.appId);
    interviewStore.syncFavorites(items.value.map((item) => item.questionId));
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

async function removeFromFavorites(questionId: string) {
  errorMessage.value = "";
  try {
    await removeFavorite(questionId);
    items.value = items.value.filter((item) => item.questionId !== questionId);
    interviewStore.updateFavorite(questionId, false);
    interviewStore.syncFavorites(items.value.map((item) => item.questionId));
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

async function generateCheatSheet() {
  errorMessage.value = "";
  generating.value = true;
  cheatSheetMarkdown.value = "";
  try {
    const resp = await generateInterviewCheatSheet({ appId: appStore.appId, lang: lang.value });
    cheatSheetMarkdown.value = resp.markdown;
    cheatSheetSourceCount.value = resp.favoriteCount;
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
    cheatSheetSourceCount.value = null;
  } finally {
    generating.value = false;
  }
}

function downloadMarkdown() {
  errorMessage.value = "";
  const body = cheatSheetMarkdown.value.trim();
  if (!body) {
    errorMessage.value = "Generate a cheat sheet first.";
    return;
  }
  const safeApp = appStore.appId.replace(/[^a-zA-Z0-9\-_]+/g, "_");
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `interview-favorites-cheat-sheet-${safeApp}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

void load();

function extractErrorMessage(error: unknown): string {
  const maybeAxios = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return maybeAxios.response?.data?.message || maybeAxios.message || "Request failed";
}
</script>

<style scoped>
.favorites-page {
  max-width: 1280px;
}

.intro {
  font-size: 14px;
  color: #475569;
  line-height: 1.45;
  margin: 0 0 12px;
}

.error {
  color: #dc2626;
  margin: 0 0 10px;
}

.split {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.2fr);
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 900px) {
  .split {
    grid-template-columns: 1fr;
  }
}

.panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fafafa;
  padding: 12px 14px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.panel-left {
  max-height: min(70vh, 720px);
  overflow: hidden;
}

.panel-right {
  min-height: min(70vh, 720px);
}

.panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.panel-head h3 {
  margin: 0;
  font-size: 1.05rem;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.muted {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.fav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.fav-item {
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.fav-item:last-child {
  border-bottom: none;
}

.fav-q {
  font-weight: 600;
  margin: 0 0 6px;
  line-height: 1.35;
  font-size: 14px;
}

.fav-hints {
  margin: 0 0 8px;
  padding-left: 1.1rem;
  font-size: 13px;
  color: #334155;
}

.fav-hints li {
  margin: 4px 0;
}

button.small {
  padding: 4px 10px;
  font-size: 12px;
}

.lang-select {
  font-size: 13px;
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
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

.preview-placeholder {
  flex: 1;
}

.markdown-preview {
  flex: 1;
  margin: 0;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
  max-height: min(65vh, 680px);
}
</style>
