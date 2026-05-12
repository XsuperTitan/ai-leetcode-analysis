import { defineStore } from "pinia";
const INTERVIEW_CACHE_KEY = "ai-coding-analysis.interview.cache";
export const useInterviewStore = defineStore("interview", {
    state: () => loadCache(),
    actions: {
        persist() {
            saveCache(this.$state);
        },
        setResult(result) {
            this.result = result;
            saveCache(this.$state);
        },
        patchQuestion(questionId, partial) {
            this.result = this.result.map((item) => item.questionId === questionId ? { ...item, ...partial } : item);
            saveCache(this.$state);
        },
        updateFavorite(questionId, isFavorite) {
            this.result = this.result.map((item) => item.questionId === questionId ? { ...item, isFavorite } : item);
            saveCache(this.$state);
        },
        syncFavorites(favoriteIds) {
            const favoriteIdSet = new Set(favoriteIds);
            this.result = this.result.map((item) => ({ ...item, isFavorite: favoriteIdSet.has(item.questionId) }));
            saveCache(this.$state);
        }
    }
});
function loadCache() {
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
        const parsed = JSON.parse(stored);
        return {
            keyword: parsed.keyword || "spring transaction",
            category: parsed.category || "backend",
            level: parsed.level || "middle",
            result: Array.isArray(parsed.result)
                ? parsed.result.map((item) => ({
                    ...item,
                    detailAnswer: item.detailAnswer ?? "",
                    answerHints: Array.isArray(item.answerHints) ? item.answerHints : [],
                    tags: Array.isArray(item.tags) ? item.tags : []
                }))
                : []
        };
    }
    catch {
        return {
            keyword: "spring transaction",
            category: "backend",
            level: "middle",
            result: []
        };
    }
}
function saveCache(cache) {
    localStorage.setItem(INTERVIEW_CACHE_KEY, JSON.stringify(cache));
}
