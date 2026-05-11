<template>
  <section class="card">
    <h2>Favorite Questions</h2>
    <button @click="load">Refresh</button>
    <p v-if="errorMessage" style="color: #dc2626; margin-top: 8px;">{{ errorMessage }}</p>
    <ul>
      <li v-for="item in items" :key="item.questionId" style="margin-bottom: 12px;">
        <strong>{{ item.question }}</strong>
        <ul>
          <li v-for="hint in item.answerHints" :key="hint">{{ hint }}</li>
        </ul>
        <button class="danger" @click="removeFromFavorites(item.questionId)">Delete from favorites</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getFavorites, removeFavorite } from "../api/client";
import { useAppStore } from "../stores/app";
import { useInterviewStore } from "../stores/interview";
import type { InterviewQuestionItem } from "../types/api";

const appStore = useAppStore();
const interviewStore = useInterviewStore();
const items = ref<InterviewQuestionItem[]>([]);
const errorMessage = ref("");

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

void load();

function extractErrorMessage(error: unknown): string {
  const maybeAxios = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return maybeAxios.response?.data?.message || maybeAxios.message || "Request failed";
}
</script>
