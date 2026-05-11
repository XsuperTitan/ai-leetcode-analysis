import { defineStore } from "pinia";
import type { DiagramEdge, DiagramNode, SystemDesignDiagram } from "../types/api";

const SYSTEM_DESIGN_CACHE_KEY = "ai-coding-analysis.system-design.cache";

type SystemDesignCache = {
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  diagrams: SystemDesignDiagram[];
  newNodeType: string;
  edgeSourceId: string;
  edgeTargetId: string;
  edgeLabel: string;
};

export const useSystemDesignStore = defineStore("systemDesign", {
  state: (): SystemDesignCache => loadCache(),
  actions: {
    persist() {
      saveCache(this.$state);
    },
    setDiagrams(diagrams: SystemDesignDiagram[]) {
      this.diagrams = diagrams;
      saveCache(this.$state);
    },
    setCanvasData(title: string, nodes: DiagramNode[], edges: DiagramEdge[]) {
      this.title = title;
      this.nodes = nodes;
      this.edges = edges;
      saveCache(this.$state);
    }
  }
});

function loadCache(): SystemDesignCache {
  const stored = localStorage.getItem(SYSTEM_DESIGN_CACHE_KEY);
  if (!stored) {
    return defaultCache();
  }
  try {
    const parsed = JSON.parse(stored) as Partial<SystemDesignCache>;
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
  } catch {
    return defaultCache();
  }
}

function defaultCache(): SystemDesignCache {
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

function saveCache(cache: SystemDesignCache) {
  localStorage.setItem(SYSTEM_DESIGN_CACHE_KEY, JSON.stringify(cache));
}
