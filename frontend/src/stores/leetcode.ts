import { defineStore } from "pinia";
import type { LeetcodeAnalysisItem } from "../types/api";

const LEETCODE_CACHE_KEY = "ai-coding-analysis.leetcode.cache";

type LeetcodeCache = {
  title: string;
  description: string;
  language: string;
  difficulty: string;
  constraintsInput: string;
  result: LeetcodeAnalysisItem | null;
  history: LeetcodeAnalysisItem[];
};

export const useLeetcodeStore = defineStore("leetcode", {
  state: (): LeetcodeCache => loadCache(),
  actions: {
    persist() {
      saveCache(this.$state);
    },
    setResult(result: LeetcodeAnalysisItem | null) {
      this.result = result;
      saveCache(this.$state);
    },
    setHistory(history: LeetcodeAnalysisItem[]) {
      this.history = history;
      saveCache(this.$state);
    },
    removeHistoryItem(analysisId: string) {
      this.history = this.history.filter((item) => item.analysisId !== analysisId);
      if (this.result?.analysisId === analysisId) {
        this.result = null;
      }
      saveCache(this.$state);
    }
  }
});

function loadCache(): LeetcodeCache {
  const stored = localStorage.getItem(LEETCODE_CACHE_KEY);
  if (!stored) {
    return defaultCache();
  }
  try {
    const parsed = JSON.parse(stored) as Partial<LeetcodeCache>;
    return {
      title: parsed.title || "",
      description: parsed.description || "",
      language: parsed.language || "java",
      difficulty: parsed.difficulty || "easy",
      constraintsInput: parsed.constraintsInput || "",
      result: parsed.result || null,
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    return defaultCache();
  }
}

function defaultCache(): LeetcodeCache {
  return {
    title: "",
    description: "",
    language: "java",
    difficulty: "easy",
    constraintsInput: "",
    result: null,
    history: []
  };
}

function saveCache(cache: LeetcodeCache) {
  localStorage.setItem(LEETCODE_CACHE_KEY, JSON.stringify(cache));
}
