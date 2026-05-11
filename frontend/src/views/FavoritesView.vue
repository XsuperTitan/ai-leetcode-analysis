<template>
  <section class="card">
    <h2>Favorite Questions</h2>
    <button @click="load">Refresh</button>
    <ul>
      <li v-for="item in items" :key="item.questionId" style="margin-bottom: 12px;">
        <strong>{{ item.question }}</strong>
        <ul>
          <li v-for="hint in item.answerHints" :key="hint">{{ hint }}</li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getFavorites } from "../api/client";
import { useAppStore } from "../stores/app";
import type { InterviewQuestionItem } from "../types/api";

const appStore = useAppStore();
const items = ref<InterviewQuestionItem[]>([]);

async function load() {
  items.value = await getFavorites(appStore.appId);
}

void load();
</script>
