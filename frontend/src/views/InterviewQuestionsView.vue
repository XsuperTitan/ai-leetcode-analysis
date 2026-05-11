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
      <button @click="search" :disabled="loading">{{ loading ? "Loading..." : "Search" }}</button>
    </div>
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
import { ref } from "vue";
import { addFavorite, removeFavorite, searchInterviewQuestions } from "../api/client";
import { useAppStore } from "../stores/app";
import type { InterviewQuestionItem } from "../types/api";

const appStore = useAppStore();
const keyword = ref("spring transaction");
const category = ref("backend");
const level = ref("middle");
const loading = ref(false);
const result = ref<InterviewQuestionItem[]>([]);

async function search() {
  loading.value = true;
  try {
    const resp = await searchInterviewQuestions({
      appId: appStore.appId,
      keyword: keyword.value,
      category: category.value,
      level: level.value,
      count: 8
    });
    result.value = resp.items;
  } finally {
    loading.value = false;
  }
}

async function saveFavorite(questionId: string) {
  await addFavorite(questionId);
  result.value = result.value.map((item) => item.questionId === questionId ? { ...item, isFavorite: true } : item);
}

async function cancelFavorite(questionId: string) {
  await removeFavorite(questionId);
  result.value = result.value.map((item) => item.questionId === questionId ? { ...item, isFavorite: false } : item);
}
</script>
