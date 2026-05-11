import { defineStore } from "pinia";
const LEETCODE_CACHE_KEY = "ai-coding-analysis.leetcode.cache";
export const useLeetcodeStore = defineStore("leetcode", {
    state: () => loadCache(),
    actions: {
        persist() {
            saveCache(this.$state);
        },
        setResult(result) {
            this.result = result;
            saveCache(this.$state);
        },
        setHistory(history) {
            this.history = history;
            saveCache(this.$state);
        }
    }
});
function loadCache() {
    const stored = localStorage.getItem(LEETCODE_CACHE_KEY);
    if (!stored) {
        return defaultCache();
    }
    try {
        const parsed = JSON.parse(stored);
        return {
            title: parsed.title || "",
            description: parsed.description || "",
            language: parsed.language || "java",
            difficulty: parsed.difficulty || "easy",
            constraintsInput: parsed.constraintsInput || "",
            result: parsed.result || null,
            history: Array.isArray(parsed.history) ? parsed.history : []
        };
    }
    catch {
        return defaultCache();
    }
}
function defaultCache() {
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
function saveCache(cache) {
    localStorage.setItem(LEETCODE_CACHE_KEY, JSON.stringify(cache));
}
