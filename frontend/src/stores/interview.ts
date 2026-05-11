import { defineStore } from "pinia";
import type { InterviewQuestionItem } from "../types/api";

const INTERVIEW_CACHE_KEY = "ai-coding-analysis.interview.cache";

type InterviewCache = {
  keyword: string;
  category: string;
  level: string;
  result: InterviewQuestionItem[];
};

export const useInterviewStore = defineStore("interview", {
  state: (): InterviewCache => loadCache(),
  actions: {
    persist() {
      saveCache(this.$state);
    },
    setResult(result: InterviewQuestionItem[]) {
      this.result = result;
      saveCache(this.$state);
    },
    updateFavorite(questionId: string, isFavorite: boolean) {
      this.result = this.result.map((item) =>
        item.questionId === questionId ? { ...item, isFavorite } : item
      );
      saveCache(this.$state);
    },
    syncFavorites(favoriteIds: string[]) {
      const favoriteIdSet = new Set(favoriteIds);
      this.result = this.result.map((item) => ({ ...item, isFavorite: favoriteIdSet.has(item.questionId) }));
      saveCache(this.$state);
    }
  }
});

function loadCache(): InterviewCache {
  const stored = localStorage.getItem(INTERVIEW_CACHE_KEY);
  if (!stored) {
    return {
      keyword: "spring transaction",
      category: "backend",
      level: "middle",
      result: []
    };
  }
  try {
    const parsed = JSON.parse(stored) as Partial<InterviewCache>;
    return {
      keyword: parsed.keyword || "spring transaction",
      category: parsed.category || "backend",
      level: parsed.level || "middle",
      result: Array.isArray(parsed.result) ? parsed.result : []
    };
  } catch {
    return {
      keyword: "spring transaction",
      category: "backend",
      level: "middle",
      result: []
    };
  }
}

function saveCache(cache: InterviewCache) {
  localStorage.setItem(INTERVIEW_CACHE_KEY, JSON.stringify(cache));
}
