import { defineStore } from "pinia";
const SYSTEM_DESIGN_CACHE_KEY = "ai-coding-analysis.system-design.cache";
export const useSystemDesignStore = defineStore("systemDesign", {
    state: () => loadCache(),
    actions: {
        persist() {
            saveCache(this.$state);
        },
        setDiagrams(diagrams) {
            this.diagrams = diagrams;
            saveCache(this.$state);
        },
        removeDiagram(diagramId) {
            this.diagrams = this.diagrams.filter((item) => item.diagramId !== diagramId);
            saveCache(this.$state);
        },
        setCanvasData(title, nodes, edges) {
            this.title = title;
            this.nodes = nodes;
            this.edges = edges;
            saveCache(this.$state);
        }
    }
});
function loadCache() {
    const stored = localStorage.getItem(SYSTEM_DESIGN_CACHE_KEY);
    if (!stored) {
        return defaultCache();
    }
    try {
        const parsed = JSON.parse(stored);
        return {
            title: parsed.title || "Sample Architecture",
            nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
            edges: Array.isArray(parsed.edges) ? parsed.edges : [],
            diagrams: Array.isArray(parsed.diagrams) ? parsed.diagrams : [],
            newNodeType: parsed.newNodeType || "service",
            edgeSourceId: parsed.edgeSourceId || "",
            edgeTargetId: parsed.edgeTargetId || "",
            edgeLabel: parsed.edgeLabel || "HTTP"
        };
    }
    catch {
        return defaultCache();
    }
}
function defaultCache() {
    return {
        title: "Sample Architecture",
        nodes: [],
        edges: [],
        diagrams: [],
        newNodeType: "service",
        edgeSourceId: "",
        edgeTargetId: "",
        edgeLabel: "HTTP"
    };
}
function saveCache(cache) {
    localStorage.setItem(SYSTEM_DESIGN_CACHE_KEY, JSON.stringify(cache));
}
