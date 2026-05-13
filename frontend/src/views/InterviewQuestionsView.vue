<template>
  <section class="card">
    <h2>English Interview Questions</h2>
    <div class="row">
      <input v-model="keyword" placeholder="keyword, e.g. spring transaction" />
      <select v-model="category">
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
        <option value="fullstack">Fullstack</option>
        <option value="behavioral">Behavioral</option>
      </select>
      <select v-model="level">
        <option value="junior">Junior</option>
        <option value="middle">Middle</option>
        <option value="senior">Senior</option>
      </select>
      <select v-model="lang">
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
      <button @click="search" :disabled="loading">{{ loading ? "Loading..." : "Search" }}</button>
    </div>
    <p v-if="errorMessage" style="color: #dc2626; margin: 0;">{{ errorMessage }}</p>
  </section>

  <section class="card">
    <h3>Result</h3>
    <ul>
      <li v-for="item in result" :key="item.questionId" style="margin-bottom: 12px;">
        <strong>{{ item.question }}</strong>
        <ul>
          <li v-for="hint in item.answerHints" :key="hint">{{ hint }}</li>
        </ul>
        <button v-if="!item.isFavorite" @click="saveFavorite(item.questionId)">Favorite</button>
        <button v-else class="danger" @click="cancelFavorite(item.questionId)">Unfavorite</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { addFavorite, removeFavorite, searchInterviewQuestions } from "../api/client";
import { useAppStore } from "../stores/app";
import { useInterviewStore } from "../stores/interview";

const appStore = useAppStore();
const interviewStore = useInterviewStore();
const { keyword, category, level, result } = storeToRefs(interviewStore);
const lang = ref("en");
const loading = ref(false);
const errorMessage = ref("");

watch([keyword, category, level], () => {
  interviewStore.persist();
});

async function search() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const resp = await searchInterviewQuestions({
      appId: appStore.appId,
      keyword: keyword.value,
      category: category.value,
      level: level.value,
      count: 8,
      lang: lang.value
    });
    interviewStore.setResult(resp.items);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function saveFavorite(questionId: string) {
  errorMessage.value = "";
  try {
    await addFavorite(questionId);
    interviewStore.updateFavorite(questionId, true);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

async function cancelFavorite(questionId: string) {
  errorMessage.value = "";
  try {
    await removeFavorite(questionId);
    interviewStore.updateFavorite(questionId, false);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

function extractErrorMessage(error: unknown): string {
  const maybeAxios = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return maybeAxios.response?.data?.message || maybeAxios.message || "Request failed";
}
</script>
