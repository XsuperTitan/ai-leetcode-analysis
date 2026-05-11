<template>
  <section class="card">
    <h2>System Design Draft (Draggable)</h2>
    <div class="row">
      <input v-model="title" placeholder="Diagram title" />
      <select v-model="newNodeType">
        <option value="client">Client</option>
        <option value="gateway">API Gateway</option>
        <option value="service">Service</option>
        <option value="db">Database</option>
        <option value="cache">Cache</option>
        <option value="mq">MQ</option>
      </select>
      <button @click="addNode">Add Node</button>
      <button @click="saveDiagram">Save Diagram</button>
    </div>
    <div class="row">
      <select v-model="edgeSourceId">
        <option value="">Source node</option>
        <option v-for="node in nodes" :key="`source-${node.id}`" :value="node.id">{{ node.label }}</option>
      </select>
      <select v-model="edgeTargetId">
        <option value="">Target node</option>
        <option v-for="node in nodes" :key="`target-${node.id}`" :value="node.id">{{ node.label }}</option>
      </select>
      <input v-model="edgeLabel" placeholder="Edge label (e.g. HTTP)" />
      <button class="secondary" @click="addEdge">Add Edge</button>
    </div>
    <p>Current nodes: {{ nodes.length }} | edges: {{ edges.length }}</p>
    <p v-if="errorMessage" style="color: #dc2626; margin-top: 0;">{{ errorMessage }}</p>

    <div ref="canvasRef" class="diagram-canvas">
      <svg class="diagram-svg">
        <line
          v-for="edge in renderedEdges"
          :key="edge.id"
          :x1="edge.x1"
          :y1="edge.y1"
          :x2="edge.x2"
          :y2="edge.y2"
          stroke="#4b5563"
          stroke-width="2"
          marker-end="url(#arrow)"
        />
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
          </marker>
        </defs>
      </svg>

      <div
        v-for="node in nodes"
        :key="node.id"
        class="diagram-node"
        :style="{ left: `${node.x}px`, top: `${node.y}px` }"
        @mousedown="startDrag($event, node.id)"
      >
        <strong>{{ node.label }}</strong>
        <div class="node-type">{{ node.type }}</div>
      </div>
    </div>
  </section>

  <section class="card">
    <h3>Saved Diagrams</h3>
    <button class="secondary" @click="loadDiagrams">Refresh</button>
    <ul>
      <li v-for="item in diagrams" :key="item.diagramId">
        {{ item.title }} ({{ item.nodes.length }} nodes)
        <button class="secondary" style="margin-left: 8px;" @click="useDiagram(item)">Load</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { createDiagram, listDiagrams } from "../api/client";
import { useAppStore } from "../stores/app";
import { useSystemDesignStore } from "../stores/systemDesign";
import type { SystemDesignDiagram } from "../types/api";

const NODE_WIDTH = 150;
const NODE_HEIGHT = 64;
const CANVAS_WIDTH = 980;
const CANVAS_HEIGHT = 520;

const appStore = useAppStore();
const systemDesignStore = useSystemDesignStore();
const { title, nodes, edges, diagrams, newNodeType, edgeSourceId, edgeTargetId, edgeLabel } = storeToRefs(systemDesignStore);
const errorMessage = ref("");
const canvasRef = ref<HTMLElement | null>(null);

const draggingNodeId = ref<string | null>(null);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);

watch([title, newNodeType, edgeSourceId, edgeTargetId, edgeLabel], () => {
  systemDesignStore.persist();
});

const renderedEdges = computed(() => {
  return edges.value
    .map((edge) => {
      const source = nodes.value.find((node) => node.id === edge.source);
      const target = nodes.value.find((node) => node.id === edge.target);
      if (!source || !target) {
        return null;
      }
      return {
        id: edge.id,
        x1: source.x + NODE_WIDTH / 2,
        y1: source.y + NODE_HEIGHT / 2,
        x2: target.x + NODE_WIDTH / 2,
        y2: target.y + NODE_HEIGHT / 2
      };
    })
    .filter((item): item is { id: string; x1: number; y1: number; x2: number; y2: number } => item !== null);
});

function addNode() {
  errorMessage.value = "";
  const id = `n${nodes.value.length + 1}`;
  nodes.value.push({
    id,
    type: newNodeType.value,
    label: `${newNodeType.value.toUpperCase()} ${nodes.value.length + 1}`,
    x: 80 + (nodes.value.length % 4) * 200,
    y: 80 + Math.floor(nodes.value.length / 4) * 120
  });
  systemDesignStore.persist();
}

function addEdge() {
  errorMessage.value = "";
  if (!edgeSourceId.value || !edgeTargetId.value) {
    errorMessage.value = "Please select both source and target nodes.";
    return;
  }
  if (edgeSourceId.value === edgeTargetId.value) {
    errorMessage.value = "Source and target cannot be the same node.";
    return;
  }
  edges.value.push({
    id: `e${edges.value.length + 1}`,
    source: edgeSourceId.value,
    target: edgeTargetId.value,
    label: edgeLabel.value || "link"
  });
  systemDesignStore.persist();
}

async function saveDiagram() {
  errorMessage.value = "";
  if (!title.value.trim()) {
    errorMessage.value = "Please enter diagram title.";
    return;
  }
  await createDiagram({
    appId: appStore.appId,
    title: title.value.trim(),
    description: "MVP diagram",
    nodes: nodes.value,
    edges: edges.value,
    canvasMeta: { zoom: 1, version: "1.0" }
  });
  await loadDiagrams();
  systemDesignStore.persist();
}

async function loadDiagrams() {
  try {
    const list = await listDiagrams();
    systemDesignStore.setDiagrams(list);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

function useDiagram(item: SystemDesignDiagram) {
  systemDesignStore.setCanvasData(item.title, [...item.nodes], [...item.edges]);
}

function startDrag(event: MouseEvent, nodeId: string) {
  const node = nodes.value.find((item) => item.id === nodeId);
  if (!node || !canvasRef.value) {
    return;
  }
  const canvasRect = canvasRef.value.getBoundingClientRect();
  draggingNodeId.value = nodeId;
  dragOffsetX.value = event.clientX - canvasRect.left - node.x;
  dragOffsetY.value = event.clientY - canvasRect.top - node.y;
}

function onMouseMove(event: MouseEvent) {
  if (!draggingNodeId.value || !canvasRef.value) {
    return;
  }
  const canvasRect = canvasRef.value.getBoundingClientRect();
  const rawX = event.clientX - canvasRect.left - dragOffsetX.value;
  const rawY = event.clientY - canvasRect.top - dragOffsetY.value;
  const clampedX = clamp(rawX, 0, CANVAS_WIDTH - NODE_WIDTH);
  const clampedY = clamp(rawY, 0, CANVAS_HEIGHT - NODE_HEIGHT);
  nodes.value = nodes.value.map((node) =>
    node.id === draggingNodeId.value
      ? { ...node, x: clampedX, y: clampedY }
      : node
  );
}

function onMouseUp() {
  if (draggingNodeId.value) {
    systemDesignStore.persist();
  }
  draggingNodeId.value = null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function extractErrorMessage(error: unknown): string {
  const maybeAxios = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return maybeAxios.response?.data?.message || maybeAxios.message || "Request failed";
}

if (diagrams.value.length === 0) {
  void loadDiagrams();
}
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mouseup", onMouseUp);

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
});
</script>

<style scoped>
.diagram-canvas {
  position: relative;
  width: 980px;
  height: 520px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.diagram-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.diagram-node {
  position: absolute;
  width: 150px;
  height: 64px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  padding: 8px 10px;
  cursor: grab;
  user-select: none;
}

.diagram-node:active {
  cursor: grabbing;
}

.node-type {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}
</style>
