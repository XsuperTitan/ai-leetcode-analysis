<template>
  <section class="card">
    <h2>System Design Draft</h2>

    <p class="hints">
      Click nodes or edges to select. Double-click labels to rename. Drag nodes to reposition. Right-click opens a menu.
      <kbd>Delete</kbd>/<kbd>Backspace</kbd> removes the selection · <kbd>Esc</kbd> clears selection · Click empty canvas to deselect.
    </p>

    <div class="row toolbar">
      <input v-model="title" placeholder="Diagram title" aria-label="Diagram title" />
      <select v-model="newNodeType" aria-label="Node type before add">
        <option value="client">Client</option>
        <option value="gateway">API Gateway</option>
        <option value="service">Service</option>
        <option value="db">Database</option>
        <option value="cache">Cache</option>
        <option value="mq">MQ</option>
      </select>
      <button type="button" @click="addNode">Add Node</button>
      <button type="button" @click="saveDiagram">Save Diagram</button>
      <button type="button" class="danger" @click="clearCanvas">Clear Canvas</button>
    </div>

    <div class="row toolbar">
      <select v-model="edgeSourceId" aria-label="New edge source node">
        <option value="">Source node</option>
        <option v-for="node in nodes" :key="`source-${node.id}`" :value="node.id">{{ node.label }}</option>
      </select>
      <select v-model="edgeTargetId" aria-label="New edge target node">
        <option value="">Target node</option>
        <option v-for="node in nodes" :key="`target-${node.id}`" :value="node.id">{{ node.label }}</option>
      </select>
      <input v-model="edgeLabel" placeholder="Edge label (e.g. HTTP)" aria-label="New edge label" />
      <button type="button" class="secondary" @click="addEdge">Add Edge</button>
    </div>

    <div v-if="selectionBanner" class="selection-banner" role="status">
      {{ selectionBanner }}
      <button
        v-if="selectedNodeId || selectedEdgeId"
        type="button"
        class="danger small"
        @click="deleteCurrentSelection"
      >
        Delete
      </button>
    </div>

    <p class="counts">Canvas: {{ nodes.length }} nodes · {{ edges.length }} edges</p>
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div ref="canvasRef" class="diagram-canvas" @contextmenu.prevent="onCanvasCtxMenu">
      <!-- Hidden symbols for lightweight node glyphs -->
      <svg class="icon-symbols" aria-hidden="true">
        <defs>
          <symbol id="sd-icon-client" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="14" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="1.25" />
            <path d="M8 22h8" stroke="currentColor" fill="none" stroke-width="1.25" />
          </symbol>
          <symbol id="sd-icon-gateway" viewBox="0 0 24 24">
            <path d="M4 12h16M12 4v16" stroke="currentColor" fill="none" stroke-width="1.25" />
            <circle cx="8" cy="8" r="2" stroke="currentColor" fill="none" />
            <circle cx="16" cy="8" r="2" stroke="currentColor" fill="none" />
            <circle cx="8" cy="16" r="2" stroke="currentColor" fill="none" />
            <circle cx="16" cy="16" r="2" stroke="currentColor" fill="none" />
          </symbol>
          <symbol id="sd-icon-service" viewBox="0 0 24 24">
            <rect x="5" y="5" width="14" height="14" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="1.25" />
            <path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="1.25" />
          </symbol>
          <symbol id="sd-icon-db" viewBox="0 0 24 24">
            <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" fill="none" stroke-width="1.25" />
            <path d="M5 6v12c0 1.66 5 3 14 3" stroke="currentColor" fill="none" stroke-width="1.25" />
            <ellipse cx="12" cy="18" rx="7" ry="3" stroke="currentColor" fill="none" stroke-width="1.25" />
          </symbol>
          <symbol id="sd-icon-cache" viewBox="0 0 24 24">
            <rect x="4" y="6" width="16" height="12" rx="1" stroke="currentColor" fill="none" stroke-width="1.25" />
            <path d="M7 14h10" stroke="currentColor" stroke-width="1.25" />
          </symbol>
          <symbol id="sd-icon-mq" viewBox="0 0 24 24">
            <path d="M5 17V7l12-2v14" stroke="currentColor" fill="none" stroke-width="1.25" stroke-linejoin="round" />
            <path d="M5 7l12 2" stroke="currentColor" stroke-width="1.25" />
          </symbol>
        </defs>
      </svg>

      <svg class="diagram-svg" aria-hidden="true">
        <rect class="diagram-backdrop" width="100%" height="100%" fill="transparent" @click.stop="onDiagramBackdropClick" />
        <defs>
          <marker id="sd-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
          </marker>
          <marker id="sd-arrow-selected" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#dc2626" />
          </marker>
        </defs>

        <g
          v-for="edge in renderedEdges"
          :key="edge.id"
          class="edge-group"
          @mouseenter="hoveredEdgeId = edge.id"
          @mouseleave="hoveredEdgeId = ''"
        >
          <line
            class="edge-hit"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
            stroke="transparent"
            stroke-width="16"
            @click.stop="selectEdge(edge.id)"
            @dblclick.stop="startEditingEdge(edge.id)"
            @contextmenu.prevent.stop="openEdgeCtx($event, edge.id)"
          />
          <line
            class="edge-line"
            :class="{ selected: selectedEdgeId === edge.id }"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
            :stroke="selectedEdgeId === edge.id ? '#dc2626' : '#4b5563'"
            :stroke-width="strokeWidthPx(edge.id)"
            :marker-end="selectedEdgeId === edge.id ? 'url(#sd-arrow-selected)' : 'url(#sd-arrow)'"
            pointer-events="none"
          />
          <text
            class="edge-label"
            :class="{ selected: selectedEdgeId === edge.id }"
            :x="edge.labelX"
            :y="edge.labelY"
            text-anchor="middle"
            dominant-baseline="middle"
            @click.stop="selectEdge(edge.id)"
            @dblclick.stop="startEditingEdge(edge.id)"
            @contextmenu.prevent.stop="openEdgeCtx($event, edge.id)"
          >
            {{ edge.label }}
          </text>
        </g>
      </svg>

      <!-- Edge label editor -->
      <div
        v-if="editingEdgeId"
        class="edge-edit-popover"
        :style="{ left: `${edgeEditorX}px`, top: `${edgeEditorY}px` }"
        role="dialog"
        aria-label="Edit edge label"
      >
        <input
          ref="edgeEditInputEl"
          v-model.trim="editingEdgeLabel"
          maxlength="160"
          @keydown.enter.prevent="finishEditingEdge(true)"
          @keydown.esc.prevent="finishEditingEdge(false)"
          @blur="onEdgeEditorBlur"
        />
      </div>

      <div
        v-for="node in nodes"
        :key="node.id"
        class="diagram-node"
        :data-type="node.type"
        :class="{
          selected: selectedNodeId === node.id && !editingNodeId,
          dragging: draggingNodeId === node.id,
          editing: editingNodeId === node.id
        }"
        :style="{ left: `${node.x}px`, top: `${node.y}px` }"
        @mousedown="onNodeMouseDown($event, node.id)"
        @click.stop="onNodeClick(node.id)"
        @dblclick.stop="startEditingNode(node.id)"
        @contextmenu.prevent.stop="openNodeCtx($event, node.id)"
      >
        <template v-if="editingNodeId !== node.id">
          <svg class="node-badge" viewBox="0 0 24 24" aria-hidden="true">
            <use :href="'#sd-icon-' + nodeIconSlug(node.type)" width="24" height="24" />
          </svg>
          <strong class="node-label-text">{{ node.label }}</strong>
          <div class="node-type">{{ node.type }}</div>
        </template>
        <input
          v-else
          ref="nodeEditInputEl"
          v-model.trim="editingNodeLabel"
          class="node-label-input"
          maxlength="160"
          @keydown.enter.prevent="finishEditingNode(true)"
          @keydown.esc.prevent="finishEditingNode(false)"
          @click.stop
        />
      </div>

      <!-- Context menu -->
      <div
        v-if="contextMenu.visible"
        class="ctx-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        role="menu"
      >
        <template v-if="contextMenu.kind === 'node'">
          <button type="button" role="menuitem" @click="ctxEditNodeLabel">Edit label</button>
          <button type="button" role="menuitem" @click="ctxDuplicateNode">Duplicate</button>
          <button type="button" class="danger-plain" role="menuitem" @click="ctxDeleteNode">Delete</button>
        </template>
        <template v-else-if="contextMenu.kind === 'edge'">
          <button type="button" role="menuitem" @click="ctxEditEdgeLabel">Edit label</button>
          <button type="button" class="danger-plain" role="menuitem" @click="ctxDeleteEdge">Delete</button>
        </template>
        <template v-else>
          <button type="button" role="menuitem" @click="ctxAddNodeHere">Add node here</button>
        </template>
      </div>
    </div>
  </section>

  <section class="card">
    <h3>Saved Diagrams</h3>
    <button type="button" class="secondary" @click="loadDiagrams">Refresh</button>
    <ul>
      <li v-for="item in diagrams" :key="item.diagramId">
        {{ item.title }} ({{ item.nodes.length }} nodes)
        <button type="button" class="secondary" style="margin-left: 8px" @click="useDiagram(item)">Load</button>
        <button type="button" class="danger" style="margin-left: 8px" @click="removeSavedDiagram(item.diagramId)">Delete</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { createDiagram, deleteDiagram, listDiagrams } from "../api/client";
import { useAppStore } from "../stores/app";
import { useSystemDesignStore } from "../stores/systemDesign";
import type { DiagramNode, SystemDesignDiagram } from "../types/api";

const NODE_WIDTH = 150;
const NODE_HEIGHT = 80;
const CANVAS_WIDTH = 980;
const CANVAS_HEIGHT = 520;
const DRAG_THRESHOLD_PX = 6;

const appStore = useAppStore();
const systemDesignStore = useSystemDesignStore();
const { title, nodes, edges, diagrams, newNodeType, edgeSourceId, edgeTargetId, edgeLabel } = storeToRefs(systemDesignStore);

const errorMessage = ref("");
const canvasRef = ref<HTMLElement | null>(null);
const selectedNodeId = ref("");
const selectedEdgeId = ref("");
const draggingNodeId = ref<string | null>(null);

const gestureMoved = ref(false);
const pendingDrag = ref<{ nodeId: string; sx: number; sy: number } | null>(null);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);

const editingNodeId = ref("");
const editingNodeLabel = ref("");
const nodeEditInputEl = ref<HTMLInputElement | null>(null);

const editingEdgeId = ref("");
const editingEdgeLabel = ref("");
const edgeEditorX = ref(0);
const edgeEditorY = ref(0);
const edgeEditInputEl = ref<HTMLInputElement | null>(null);

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  kind: "" as "node" | "edge" | "canvas" | "",
  nodeId: "",
  edgeId: "",
  canvasX: 0,
  canvasY: 0
});

const hoveredEdgeId = ref("");

watch([title, newNodeType, edgeSourceId, edgeTargetId, edgeLabel], () => {
  systemDesignStore.persist();
});

const ICON_SLUG: Record<string, string> = {
  client: "client",
  gateway: "gateway",
  service: "service",
  db: "db",
  cache: "cache",
  mq: "mq"
};

function nodeIconSlug(kind: string): string {
  return ICON_SLUG[kind] ?? "service";
}

function newEntityId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const renderedEdges = computed(() => {
  return edges.value
    .map((edge) => {
      const source = nodes.value.find((node) => node.id === edge.source);
      const target = nodes.value.find((node) => node.id === edge.target);
      if (!source || !target) {
        return null;
      }
      const midX = (source.x + target.x) / 2 + NODE_WIDTH / 2;
      const midY = (source.y + target.y) / 2 + NODE_HEIGHT / 2;
      return {
        id: edge.id,
        x1: source.x + NODE_WIDTH / 2,
        y1: source.y + NODE_HEIGHT / 2,
        x2: target.x + NODE_WIDTH / 2,
        y2: target.y + NODE_HEIGHT / 2,
        labelX: midX,
        labelY: midY - 2,
        label: edge.label
      };
    })
    .filter(
      (
        item
      ): item is {
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        labelX: number;
        labelY: number;
        label: string;
      } => item !== null
    );
});

const selectionBanner = computed(() => {
  const nodeId = selectedNodeId.value;
  const edgeId = selectedEdgeId.value;
  const node = nodeId ? nodes.value.find((n) => n.id === nodeId) : undefined;
  const edge = edgeId ? edges.value.find((e) => e.id === edgeId) : undefined;

  if (node) {
    return `Selected node: "${node.label}" (${node.type})`;
  }
  if (edge) {
    const s = nodes.value.find((n) => n.id === edge.source)?.label ?? edge.source;
    const t = nodes.value.find((n) => n.id === edge.target)?.label ?? edge.target;
    return `Selected edge: ${s} → ${t} (${edge.label})`;
  }
  return "";
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampNodePosition(x: number, y: number): { x: number; y: number } {
  return {
    x: clamp(x, 0, CANVAS_WIDTH - NODE_WIDTH),
    y: clamp(y, 0, CANVAS_HEIGHT - NODE_HEIGHT)
  };
}

function strokeWidthPx(edgeId: string): string {
  if (selectedEdgeId.value === edgeId) return "3.5";
  if (hoveredEdgeId.value === edgeId) return "3";
  return "2";
}

function closeContextMenu() {
  contextMenu.value = { visible: false, x: 0, y: 0, kind: "", nodeId: "", edgeId: "", canvasX: 0, canvasY: 0 };
}

function onDiagramBackdropClick() {
  closeContextMenu();
  deselectAll();
}

function deselectAll() {
  selectedNodeId.value = "";
  selectedEdgeId.value = "";
}

function canvasLocalPoint(clientX: number, clientY: number): { x: number; y: number } | null {
  if (!canvasRef.value) return null;
  const r = canvasRef.value.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top };
}

function onCanvasCtxMenu(ev: MouseEvent) {
  if (!canvasRef.value) return;
  const local = canvasLocalPoint(ev.clientX, ev.clientY);
  if (!local) return;
  contextMenu.value = {
    visible: true,
    x: clamp(ev.clientX, 8, window.innerWidth - 160),
    y: clamp(ev.clientY, 8, window.innerHeight - 140),
    kind: "canvas",
    nodeId: "",
    edgeId: "",
    canvasX: local.x,
    canvasY: local.y
  };
}

function openNodeCtx(ev: MouseEvent, nodeId: string) {
  contextMenu.value = {
    visible: true,
    x: clamp(ev.clientX, 8, window.innerWidth - 160),
    y: clamp(ev.clientY, 8, window.innerHeight - 140),
    kind: "node",
    nodeId,
    edgeId: "",
    canvasX: 0,
    canvasY: 0
  };
}

function openEdgeCtx(ev: MouseEvent, edgeId: string) {
  contextMenu.value = {
    visible: true,
    x: clamp(ev.clientX, 8, window.innerWidth - 160),
    y: clamp(ev.clientY, 8, window.innerHeight - 140),
    kind: "edge",
    nodeId: "",
    edgeId,
    canvasX: 0,
    canvasY: 0
  };
}

function ctxEditNodeLabel() {
  const id = contextMenu.value.nodeId;
  closeContextMenu();
  startEditingNode(id);
}

function ctxDuplicateNode() {
  duplicateNode(contextMenu.value.nodeId);
  closeContextMenu();
}

function ctxDeleteNode() {
  const id = contextMenu.value.nodeId;
  closeContextMenu();
  selectedNodeId.value = id;
  deleteSelectedNode();
}

function ctxEditEdgeLabel() {
  const id = contextMenu.value.edgeId;
  closeContextMenu();
  startEditingEdge(id);
}

function ctxDeleteEdge() {
  const id = contextMenu.value.edgeId;
  closeContextMenu();
  selectedEdgeId.value = id;
  deleteSelectedEdge();
}

function ctxAddNodeHere() {
  const { canvasX: x, canvasY: y } = contextMenu.value;
  closeContextMenu();
  pushNodeNear(x, y);
}

/** Dismiss floating menu after other UI handles the click target */
function onGlobalClickDismissMenu(ev: MouseEvent) {
  if (!contextMenu.value.visible) return;
  const tgt = ev.target as HTMLElement | null;
  if (tgt?.closest(".ctx-menu")) return;
  closeContextMenu();
}

function duplicateNode(nodeId: string) {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node) return;
  const spread = NODE_WIDTH >= NODE_HEIGHT ? 32 : 32;
  const pos = clampNodePosition(node.x + spread, node.y + spread);
  const copy: DiagramNode = {
    ...node,
    id: newEntityId("n"),
    label: `${node.label} copy`,
    x: pos.x,
    y: pos.y
  };
  nodes.value = [...nodes.value, copy];
  selectedNodeId.value = copy.id;
  selectedEdgeId.value = "";
  systemDesignStore.persist();
}

function pushNodeNear(cx: number, cy: number) {
  errorMessage.value = "";
  const { x, y } = clampNodePosition(cx - NODE_WIDTH / 2, cy - NODE_HEIGHT / 2);
  const id = newEntityId("n");
  const nextIndex = nodes.value.length + 1;
  nodes.value = [
    ...nodes.value,
    {
      id,
      type: newNodeType.value,
      label: `${newNodeType.value.toUpperCase()} ${nextIndex}`,
      x,
      y
    }
  ];
  selectedNodeId.value = id;
  selectedEdgeId.value = "";
  systemDesignStore.persist();
}

function addNode() {
  errorMessage.value = "";
  const id = newEntityId("n");
  const nextIndex = nodes.value.length + 1;
  nodes.value = [
    ...nodes.value,
    {
      id,
      type: newNodeType.value,
      label: `${newNodeType.value.toUpperCase()} ${nextIndex}`,
      x: 80 + ((nextIndex - 1) % 4) * 200,
      y: 80 + Math.floor((nextIndex - 1) / 4) * 120
    }
  ];
  selectedNodeId.value = id;
  selectedEdgeId.value = "";
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
  const edge = {
    id: newEntityId("e"),
    source: edgeSourceId.value,
    target: edgeTargetId.value,
    label: edgeLabel.value.trim() || "HTTP"
  };
  edges.value = [...edges.value, edge];
  selectedEdgeId.value = edge.id;
  selectedNodeId.value = "";
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
  finishEditingEdge(false);
  finishEditingNode(false);
  closeContextMenu();
  systemDesignStore.setCanvasData(item.title, [...item.nodes], [...item.edges]);
  deselectAll();
}

async function removeSavedDiagram(diagramId: string) {
  errorMessage.value = "";
  try {
    await deleteDiagram(diagramId);
    systemDesignStore.removeDiagram(diagramId);
  } catch (error: unknown) {
    errorMessage.value = extractErrorMessage(error);
  }
}

function selectNode(nodeId: string) {
  selectedNodeId.value = nodeId;
  selectedEdgeId.value = "";
}

function selectEdge(edgeId: string) {
  selectedEdgeId.value = edgeId;
  selectedNodeId.value = "";
}

function onNodeClick(nodeId: string) {
  if (gestureMoved.value) return;
  selectNode(nodeId);
}

function onNodeMouseDown(event: MouseEvent, nodeId: string) {
  if (event.button !== 0) return;
  const node = nodes.value.find((item) => item.id === nodeId);
  if (!node || !canvasRef.value) {
    return;
  }
  gestureMoved.value = false;
  pendingDrag.value = {
    nodeId,
    sx: event.clientX,
    sy: event.clientY
  };
}

function beginDragFromPending(event: MouseEvent) {
  const prep = pendingDrag.value;
  if (!prep || !canvasRef.value) return;
  const node = nodes.value.find((item) => item.id === prep.nodeId);
  if (!node) return;

  draggingNodeId.value = prep.nodeId;
  gestureMoved.value = true;
  const canvasRect = canvasRef.value.getBoundingClientRect();
  dragOffsetX.value = event.clientX - canvasRect.left - node.x;
  dragOffsetY.value = event.clientY - canvasRect.top - node.y;
  pendingDrag.value = null;
}

function startEditingNode(nodeId: string) {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node) return;
  finishEditingEdge(false);
  editingNodeId.value = nodeId;
  editingNodeLabel.value = node.label;
  selectedNodeId.value = nodeId;
  selectedEdgeId.value = "";

  nextTick(() => {
    const el = nodeEditInputEl.value;
    el?.focus();
    el?.select();
  });
}

function finishEditingNode(save: boolean) {
  const id = editingNodeId.value;
  if (!id) return;
  if (save) {
    const next = editingNodeLabel.value.trim();
    if (!next) {
      errorMessage.value = "Node text cannot be empty.";
      return;
    }
    nodes.value = nodes.value.map((node) =>
      node.id === id ? { ...node, label: next } : node
    );
    errorMessage.value = "";
    systemDesignStore.persist();
  }
  editingNodeId.value = "";
  editingNodeLabel.value = "";
}

function startEditingEdge(edgeId: string) {
  const edge = edges.value.find((e) => e.id === edgeId);
  const rendered = renderedEdges.value.find((r) => r.id === edgeId);
  if (!edge || !rendered) return;
  finishEditingNode(false);

  editingEdgeId.value = edgeId;
  editingEdgeLabel.value = edge.label;
  edgeEditorX.value = clamp(rendered.labelX, 80, CANVAS_WIDTH - 80);
  edgeEditorY.value = clamp(rendered.labelY, 28, CANVAS_HEIGHT - 28);

  selectedEdgeId.value = edgeId;
  selectedNodeId.value = "";

  nextTick(() => {
    const el = edgeEditInputEl.value;
    el?.focus();
    el?.select();
  });
}

let edgeBlurTimer: ReturnType<typeof setTimeout> | null = null;

function finishEditingEdge(save: boolean) {
  const id = editingEdgeId.value;
  if (!id) return;
  if (edgeBlurTimer !== null) {
    clearTimeout(edgeBlurTimer);
    edgeBlurTimer = null;
  }
  if (save) {
    const next = editingEdgeLabel.value.trim();
    if (!next) {
      errorMessage.value = "Edge text cannot be empty.";
      return;
    }
    edges.value = edges.value.map((edge) =>
      edge.id === id ? { ...edge, label: next } : edge
    );
    errorMessage.value = "";
    systemDesignStore.persist();
  }
  editingEdgeId.value = "";
  editingEdgeLabel.value = "";
}

function onEdgeEditorBlur() {
  edgeBlurTimer = setTimeout(() => finishEditingEdge(true), 80);
}

function deleteCurrentSelection() {
  if (selectedNodeId.value) {
    deleteSelectedNode();
  } else if (selectedEdgeId.value) {
    deleteSelectedEdge();
  }
}

function deleteSelectedNode() {
  if (!selectedNodeId.value) return;
  const nodeId = selectedNodeId.value;
  nodes.value = nodes.value.filter((node) => node.id !== nodeId);
  edges.value = edges.value.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
  if (edgeSourceId.value === nodeId) edgeSourceId.value = "";
  if (edgeTargetId.value === nodeId) edgeTargetId.value = "";
  finishEditingNode(false);
  selectedNodeId.value = "";
  if (selectedEdgeId.value && !edges.value.some((e) => e.id === selectedEdgeId.value)) {
    selectedEdgeId.value = "";
  }
  systemDesignStore.persist();
}

function deleteSelectedEdge() {
  if (!selectedEdgeId.value) return;
  edges.value = edges.value.filter((edge) => edge.id !== selectedEdgeId.value);
  finishEditingEdge(false);
  selectedEdgeId.value = "";
  systemDesignStore.persist();
}

function clearCanvas() {
  finishEditingEdge(false);
  finishEditingNode(false);
  nodes.value = [];
  edges.value = [];
  edgeSourceId.value = "";
  edgeTargetId.value = "";
  deselectAll();
  closeContextMenu();
  systemDesignStore.persist();
}

function onMouseMove(event: MouseEvent) {
  if (pendingDrag.value && !draggingNodeId.value) {
    const p = pendingDrag.value;
    if (Math.hypot(event.clientX - p.sx, event.clientY - p.sy) >= DRAG_THRESHOLD_PX) {
      beginDragFromPending(event);
    }
    return;
  }

  if (!draggingNodeId.value || !canvasRef.value) {
    return;
  }
  gestureMoved.value = true;
  const canvasRect = canvasRef.value.getBoundingClientRect();
  const rawX = event.clientX - canvasRect.left - dragOffsetX.value;
  const rawY = event.clientY - canvasRect.top - dragOffsetY.value;
  const { x: clampedX, y: clampedY } = clampNodePosition(rawX, rawY);
  nodes.value = nodes.value.map((node) =>
    node.id === draggingNodeId.value ? { ...node, x: clampedX, y: clampedY } : node
  );
}

function onMouseUp() {
  pendingDrag.value = null;
  if (draggingNodeId.value) {
    systemDesignStore.persist();
  }
  draggingNodeId.value = null;
  setTimeout(() => {
    gestureMoved.value = false;
  }, 0);
}

function onKeyDown(ev: KeyboardEvent) {
  if (
    ev.target instanceof HTMLInputElement ||
    ev.target instanceof HTMLTextAreaElement ||
    ev.target instanceof HTMLSelectElement
  ) {
    return;
  }

  if (ev.key === "Escape") {
    closeContextMenu();
    deselectAll();
    finishEditingEdge(false);
    finishEditingNode(false);
  }
  if (ev.key !== "Delete" && ev.key !== "Backspace") return;
  if (!selectedNodeId.value && !selectedEdgeId.value) return;

  ev.preventDefault();
  if (selectedNodeId.value) {
    deleteSelectedNode();
  } else if (selectedEdgeId.value) {
    deleteSelectedEdge();
  }
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

onMounted(() => {
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("click", onGlobalClickDismissMenu, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("click", onGlobalClickDismissMenu, true);
  if (edgeBlurTimer !== null) clearTimeout(edgeBlurTimer);
});
</script>

<style scoped>
.toolbar {
  flex-wrap: wrap;
  gap: 8px;
}

.hints {
  font-size: 13px;
  color: #475569;
  line-height: 1.45;
  margin: 0 0 12px;
}

.hints kbd {
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  font-size: 12px;
  font-family: inherit;
}

.counts {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.error-text {
  color: #dc2626;
  margin-top: 4px;
}

.selection-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  font-size: 14px;
  color: #1e3a5f;
}

.selection-banner button.small {
  padding: 4px 10px;
  font-size: 12px;
}

.diagram-canvas {
  position: relative;
  width: 980px;
  height: 520px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
  margin-top: 10px;
}

.icon-symbols {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

.diagram-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.diagram-node {
  position: absolute;
  display: grid;
  grid-template-columns: 36px 1fr;
  grid-template-rows: auto auto;
  gap: 0 10px;
  align-items: start;
  box-sizing: border-box;
  width: 150px;
  min-height: 80px;
  padding: 10px;
  cursor: grab;
  user-select: none;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease;
  border-radius: 10px;
  border: 1px solid transparent;
}

.diagram-node:hover:not(.dragging):not(.editing) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.diagram-node:active:not(.editing),
.diagram-node.dragging {
  cursor: grabbing;
}

.node-badge {
  grid-row: span 2;
  align-self: start;
  width: 32px;
  height: 32px;
  color: inherit;
  overflow: visible;
}

.node-label-text {
  font-size: 14px;
  line-height: 1.25;
  word-break: break-word;
}

.node-type {
  grid-column: 2;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.node-label-input {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  width: 100%;
  font: inherit;
  padding: 4px;
  border: 1px solid #64748b;
  border-radius: 6px;
}

.diagram-node[data-type="client"] {
  background: linear-gradient(145deg, #fdf2f8 0%, #fce7f3 100%);
  border-color: #f9a8d4;
  color: #831843;
}
.diagram-node[data-type="gateway"] {
  background: linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #6ee7b7;
  color: #064e3b;
}
.diagram-node[data-type="service"] {
  background: linear-gradient(145deg, #f9fafb 0%, #e5e7eb 100%);
  border-color: #9ca3af;
  color: #1f2937;
}
.diagram-node[data-type="db"] {
  background: linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #60a5fa;
  color: #1e3a8a;
}
.diagram-node[data-type="cache"] {
  background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #fbbf24;
  color: #78350f;
}
.diagram-node[data-type="mq"] {
  background: linear-gradient(145deg, #f5f3ff 0%, #ddd6fe 100%);
  border-color: #a78bfa;
  color: #312e81;
}

.diagram-node.selected {
  border-width: 2px;
  box-shadow:
    0 0 0 2px #2563eb,
    0 10px 24px rgba(37, 99, 235, 0.2);
}

.diagram-node.editing {
  z-index: 4;
}

.edge-hit {
  cursor: pointer;
}

.edge-line {
  transition: stroke-width 140ms ease;
}

.edge-group:hover .edge-line:not(.selected) {
  opacity: 0.94;
}

.edge-label {
  font-size: 12px;
  fill: #111827;
  pointer-events: all;
  cursor: pointer;
  transition: fill 140ms ease;
}

.edge-label:hover {
  fill: #0369a1;
}

.edge-label.selected {
  fill: #dc2626;
  font-weight: 700;
  font-size: 13px;
}

.edge-edit-popover {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, -130%);
}

.edge-edit-popover input {
  min-width: 140px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #94a3b8;
  background: white;
  font-size: 13px;
  box-shadow:
    0 4px 16px rgba(15, 23, 42, 0.12),
    0 0 0 2px rgba(37, 99, 235, 0.2);
}

.ctx-menu {
  position: fixed;
  z-index: 50;
  min-width: 160px;
  padding: 4px;
  border-radius: 10px;
  background: white;
  border: 1px solid #cbd5e1;
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.12),
    0 4px 8px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ctx-menu button {
  text-align: left;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
}

.ctx-menu button:hover {
  background: #eff6ff;
}

.ctx-menu button.danger-plain:hover {
  background: #fef2f2;
  color: #b91c1c;
}
</style>
