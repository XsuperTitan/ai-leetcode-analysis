import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { createDiagram, deleteDiagram, listDiagrams } from "../api/client";
import { useAppStore } from "../stores/app";
import { useSystemDesignStore } from "../stores/systemDesign";
const NODE_WIDTH = 150;
const NODE_HEIGHT = 80;
const CANVAS_WIDTH = 980;
const CANVAS_HEIGHT = 520;
const DRAG_THRESHOLD_PX = 6;
const appStore = useAppStore();
const systemDesignStore = useSystemDesignStore();
const { title, nodes, edges, diagrams, newNodeType, edgeSourceId, edgeTargetId, edgeLabel } = storeToRefs(systemDesignStore);
const errorMessage = ref("");
const canvasRef = ref(null);
const selectedNodeId = ref("");
const selectedEdgeId = ref("");
const draggingNodeId = ref(null);
const gestureMoved = ref(false);
const pendingDrag = ref(null);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);
const editingNodeId = ref("");
const editingNodeLabel = ref("");
const nodeEditInputEl = ref(null);
const editingEdgeId = ref("");
const editingEdgeLabel = ref("");
const edgeEditorX = ref(0);
const edgeEditorY = ref(0);
const edgeEditInputEl = ref(null);
const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    kind: "",
    nodeId: "",
    edgeId: "",
    canvasX: 0,
    canvasY: 0
});
const hoveredEdgeId = ref("");
watch([title, newNodeType, edgeSourceId, edgeTargetId, edgeLabel], () => {
    systemDesignStore.persist();
});
const ICON_SLUG = {
    client: "client",
    gateway: "gateway",
    service: "service",
    db: "db",
    cache: "cache",
    mq: "mq"
};
function nodeIconSlug(kind) {
    return ICON_SLUG[kind] ?? "service";
}
function newEntityId(prefix) {
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
        .filter((item) => item !== null);
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
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function clampNodePosition(x, y) {
    return {
        x: clamp(x, 0, CANVAS_WIDTH - NODE_WIDTH),
        y: clamp(y, 0, CANVAS_HEIGHT - NODE_HEIGHT)
    };
}
function strokeWidthPx(edgeId) {
    if (selectedEdgeId.value === edgeId)
        return "3.5";
    if (hoveredEdgeId.value === edgeId)
        return "3";
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
function canvasLocalPoint(clientX, clientY) {
    if (!canvasRef.value)
        return null;
    const r = canvasRef.value.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
}
function onCanvasCtxMenu(ev) {
    if (!canvasRef.value)
        return;
    const local = canvasLocalPoint(ev.clientX, ev.clientY);
    if (!local)
        return;
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
function openNodeCtx(ev, nodeId) {
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
function openEdgeCtx(ev, edgeId) {
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
function onGlobalClickDismissMenu(ev) {
    if (!contextMenu.value.visible)
        return;
    const tgt = ev.target;
    if (tgt?.closest(".ctx-menu"))
        return;
    closeContextMenu();
}
function duplicateNode(nodeId) {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (!node)
        return;
    const spread = NODE_WIDTH >= NODE_HEIGHT ? 32 : 32;
    const pos = clampNodePosition(node.x + spread, node.y + spread);
    const copy = {
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
function pushNodeNear(cx, cy) {
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
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
function useDiagram(item) {
    finishEditingEdge(false);
    finishEditingNode(false);
    closeContextMenu();
    systemDesignStore.setCanvasData(item.title, [...item.nodes], [...item.edges]);
    deselectAll();
}
async function removeSavedDiagram(diagramId) {
    errorMessage.value = "";
    try {
        await deleteDiagram(diagramId);
        systemDesignStore.removeDiagram(diagramId);
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
function selectNode(nodeId) {
    selectedNodeId.value = nodeId;
    selectedEdgeId.value = "";
}
function selectEdge(edgeId) {
    selectedEdgeId.value = edgeId;
    selectedNodeId.value = "";
}
function onNodeClick(nodeId) {
    if (gestureMoved.value)
        return;
    selectNode(nodeId);
}
function onNodeMouseDown(event, nodeId) {
    if (event.button !== 0)
        return;
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
function beginDragFromPending(event) {
    const prep = pendingDrag.value;
    if (!prep || !canvasRef.value)
        return;
    const node = nodes.value.find((item) => item.id === prep.nodeId);
    if (!node)
        return;
    draggingNodeId.value = prep.nodeId;
    gestureMoved.value = true;
    const canvasRect = canvasRef.value.getBoundingClientRect();
    dragOffsetX.value = event.clientX - canvasRect.left - node.x;
    dragOffsetY.value = event.clientY - canvasRect.top - node.y;
    pendingDrag.value = null;
}
function startEditingNode(nodeId) {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (!node)
        return;
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
function finishEditingNode(save) {
    const id = editingNodeId.value;
    if (!id)
        return;
    if (save) {
        const next = editingNodeLabel.value.trim();
        if (!next) {
            errorMessage.value = "Node text cannot be empty.";
            return;
        }
        nodes.value = nodes.value.map((node) => node.id === id ? { ...node, label: next } : node);
        errorMessage.value = "";
        systemDesignStore.persist();
    }
    editingNodeId.value = "";
    editingNodeLabel.value = "";
}
function startEditingEdge(edgeId) {
    const edge = edges.value.find((e) => e.id === edgeId);
    const rendered = renderedEdges.value.find((r) => r.id === edgeId);
    if (!edge || !rendered)
        return;
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
let edgeBlurTimer = null;
function finishEditingEdge(save) {
    const id = editingEdgeId.value;
    if (!id)
        return;
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
        edges.value = edges.value.map((edge) => edge.id === id ? { ...edge, label: next } : edge);
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
    }
    else if (selectedEdgeId.value) {
        deleteSelectedEdge();
    }
}
function deleteSelectedNode() {
    if (!selectedNodeId.value)
        return;
    const nodeId = selectedNodeId.value;
    nodes.value = nodes.value.filter((node) => node.id !== nodeId);
    edges.value = edges.value.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
    if (edgeSourceId.value === nodeId)
        edgeSourceId.value = "";
    if (edgeTargetId.value === nodeId)
        edgeTargetId.value = "";
    finishEditingNode(false);
    selectedNodeId.value = "";
    if (selectedEdgeId.value && !edges.value.some((e) => e.id === selectedEdgeId.value)) {
        selectedEdgeId.value = "";
    }
    systemDesignStore.persist();
}
function deleteSelectedEdge() {
    if (!selectedEdgeId.value)
        return;
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
function onMouseMove(event) {
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
    nodes.value = nodes.value.map((node) => node.id === draggingNodeId.value ? { ...node, x: clampedX, y: clampedY } : node);
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
function onKeyDown(ev) {
    if (ev.target instanceof HTMLInputElement ||
        ev.target instanceof HTMLTextAreaElement ||
        ev.target instanceof HTMLSelectElement) {
        return;
    }
    if (ev.key === "Escape") {
        closeContextMenu();
        deselectAll();
        finishEditingEdge(false);
        finishEditingNode(false);
    }
    if (ev.key !== "Delete" && ev.key !== "Backspace")
        return;
    if (!selectedNodeId.value && !selectedEdgeId.value)
        return;
    ev.preventDefault();
    if (selectedNodeId.value) {
        deleteSelectedNode();
    }
    else if (selectedEdgeId.value) {
        deleteSelectedEdge();
    }
}
function extractErrorMessage(error) {
    const maybeAxios = error;
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
    if (edgeBlurTimer !== null)
        clearTimeout(edgeBlurTimer);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['hints']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['editing']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['dragging']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['editing']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-line']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-label']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-label']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-edit-popover']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-menu']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "hints" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Diagram title",
    'aria-label': "Diagram title",
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.newNodeType),
    'aria-label': "Node type before add",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "client",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "gateway",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "service",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "db",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "cache",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "mq",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.addNode) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveDiagram) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.clearCanvas) },
    type: "button",
    ...{ class: "danger" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.edgeSourceId),
    'aria-label': "New edge source node",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [node] of __VLS_getVForSourceType((__VLS_ctx.nodes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (`source-${node.id}`),
        value: (node.id),
    });
    (node.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.edgeTargetId),
    'aria-label': "New edge target node",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [node] of __VLS_getVForSourceType((__VLS_ctx.nodes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (`target-${node.id}`),
        value: (node.id),
    });
    (node.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Edge label (e.g. HTTP)",
    'aria-label': "New edge label",
});
(__VLS_ctx.edgeLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.addEdge) },
    type: "button",
    ...{ class: "secondary" },
});
if (__VLS_ctx.selectionBanner) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-banner" },
        role: "status",
    });
    (__VLS_ctx.selectionBanner);
    if (__VLS_ctx.selectedNodeId || __VLS_ctx.selectedEdgeId) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.deleteCurrentSelection) },
            type: "button",
            ...{ class: "danger small" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "counts" },
});
(__VLS_ctx.nodes.length);
(__VLS_ctx.edges.length);
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error-text" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onContextmenu: (__VLS_ctx.onCanvasCtxMenu) },
    ref: "canvasRef",
    ...{ class: "diagram-canvas" },
});
/** @type {typeof __VLS_ctx.canvasRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "icon-symbols" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.symbol, __VLS_intrinsicElements.symbol)({
    id: "sd-icon-client",
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "3",
    y: "4",
    width: "18",
    height: "14",
    rx: "2",
    ry: "2",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M8 22h8",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.symbol, __VLS_intrinsicElements.symbol)({
    id: "sd-icon-gateway",
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M4 12h16M12 4v16",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "8",
    cy: "8",
    r: "2",
    stroke: "currentColor",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "16",
    cy: "8",
    r: "2",
    stroke: "currentColor",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "8",
    cy: "16",
    r: "2",
    stroke: "currentColor",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "16",
    cy: "16",
    r: "2",
    stroke: "currentColor",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.symbol, __VLS_intrinsicElements.symbol)({
    id: "sd-icon-service",
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "5",
    y: "5",
    width: "14",
    height: "14",
    rx: "2",
    ry: "2",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M9 12h6M12 9v6",
    stroke: "currentColor",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.symbol, __VLS_intrinsicElements.symbol)({
    id: "sd-icon-db",
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ellipse)({
    cx: "12",
    cy: "6",
    rx: "7",
    ry: "3",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 6v12c0 1.66 5 3 14 3",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ellipse)({
    cx: "12",
    cy: "18",
    rx: "7",
    ry: "3",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.symbol, __VLS_intrinsicElements.symbol)({
    id: "sd-icon-cache",
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "4",
    y: "6",
    width: "16",
    height: "12",
    rx: "1",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M7 14h10",
    stroke: "currentColor",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.symbol, __VLS_intrinsicElements.symbol)({
    id: "sd-icon-mq",
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 17V7l12-2v14",
    stroke: "currentColor",
    fill: "none",
    'stroke-width': "1.25",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 7l12 2",
    stroke: "currentColor",
    'stroke-width': "1.25",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "diagram-svg" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    ...{ onClick: (__VLS_ctx.onDiagramBackdropClick) },
    ...{ class: "diagram-backdrop" },
    width: "100%",
    height: "100%",
    fill: "transparent",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.marker, __VLS_intrinsicElements.marker)({
    id: "sd-arrow",
    markerWidth: "10",
    markerHeight: "10",
    refX: "7",
    refY: "3",
    orient: "auto",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
    points: "0 0, 8 3, 0 6",
    fill: "#4b5563",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.marker, __VLS_intrinsicElements.marker)({
    id: "sd-arrow-selected",
    markerWidth: "10",
    markerHeight: "10",
    refX: "7",
    refY: "3",
    orient: "auto",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
    points: "0 0, 8 3, 0 6",
    fill: "#dc2626",
});
for (const [edge] of __VLS_getVForSourceType((__VLS_ctx.renderedEdges))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
        ...{ onMouseenter: (...[$event]) => {
                __VLS_ctx.hoveredEdgeId = edge.id;
            } },
        ...{ onMouseleave: (...[$event]) => {
                __VLS_ctx.hoveredEdgeId = '';
            } },
        key: (edge.id),
        ...{ class: "edge-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectEdge(edge.id);
            } },
        ...{ onDblclick: (...[$event]) => {
                __VLS_ctx.startEditingEdge(edge.id);
            } },
        ...{ onContextmenu: (...[$event]) => {
                __VLS_ctx.openEdgeCtx($event, edge.id);
            } },
        ...{ class: "edge-hit" },
        x1: (edge.x1),
        y1: (edge.y1),
        x2: (edge.x2),
        y2: (edge.y2),
        stroke: "transparent",
        'stroke-width': "16",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        ...{ class: "edge-line" },
        ...{ class: ({ selected: __VLS_ctx.selectedEdgeId === edge.id }) },
        x1: (edge.x1),
        y1: (edge.y1),
        x2: (edge.x2),
        y2: (edge.y2),
        stroke: (__VLS_ctx.selectedEdgeId === edge.id ? '#dc2626' : '#4b5563'),
        'stroke-width': (__VLS_ctx.strokeWidthPx(edge.id)),
        'marker-end': (__VLS_ctx.selectedEdgeId === edge.id ? 'url(#sd-arrow-selected)' : 'url(#sd-arrow)'),
        'pointer-events': "none",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectEdge(edge.id);
            } },
        ...{ onDblclick: (...[$event]) => {
                __VLS_ctx.startEditingEdge(edge.id);
            } },
        ...{ onContextmenu: (...[$event]) => {
                __VLS_ctx.openEdgeCtx($event, edge.id);
            } },
        ...{ class: "edge-label" },
        ...{ class: ({ selected: __VLS_ctx.selectedEdgeId === edge.id }) },
        x: (edge.labelX),
        y: (edge.labelY),
        'text-anchor': "middle",
        'dominant-baseline': "middle",
    });
    (edge.label);
}
if (__VLS_ctx.editingEdgeId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "edge-edit-popover" },
        ...{ style: ({ left: `${__VLS_ctx.edgeEditorX}px`, top: `${__VLS_ctx.edgeEditorY}px` }) },
        role: "dialog",
        'aria-label': "Edit edge label",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeydown: (...[$event]) => {
                if (!(__VLS_ctx.editingEdgeId))
                    return;
                __VLS_ctx.finishEditingEdge(true);
            } },
        ...{ onKeydown: (...[$event]) => {
                if (!(__VLS_ctx.editingEdgeId))
                    return;
                __VLS_ctx.finishEditingEdge(false);
            } },
        ...{ onBlur: (__VLS_ctx.onEdgeEditorBlur) },
        ref: "edgeEditInputEl",
        maxlength: "160",
    });
    (__VLS_ctx.editingEdgeLabel);
    /** @type {typeof __VLS_ctx.edgeEditInputEl} */ ;
}
for (const [node] of __VLS_getVForSourceType((__VLS_ctx.nodes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (...[$event]) => {
                __VLS_ctx.onNodeMouseDown($event, node.id);
            } },
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.onNodeClick(node.id);
            } },
        ...{ onDblclick: (...[$event]) => {
                __VLS_ctx.startEditingNode(node.id);
            } },
        ...{ onContextmenu: (...[$event]) => {
                __VLS_ctx.openNodeCtx($event, node.id);
            } },
        key: (node.id),
        ...{ class: "diagram-node" },
        'data-type': (node.type),
        ...{ class: ({
                selected: __VLS_ctx.selectedNodeId === node.id && !__VLS_ctx.editingNodeId,
                dragging: __VLS_ctx.draggingNodeId === node.id,
                editing: __VLS_ctx.editingNodeId === node.id
            }) },
        ...{ style: ({ left: `${node.x}px`, top: `${node.y}px` }) },
    });
    if (__VLS_ctx.editingNodeId !== node.id) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            ...{ class: "node-badge" },
            viewBox: "0 0 24 24",
            'aria-hidden': "true",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.use)({
            href: ('#sd-icon-' + __VLS_ctx.nodeIconSlug(node.type)),
            width: "24",
            height: "24",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
            ...{ class: "node-label-text" },
        });
        (node.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "node-type" },
        });
        (node.type);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onKeydown: (...[$event]) => {
                    if (!!(__VLS_ctx.editingNodeId !== node.id))
                        return;
                    __VLS_ctx.finishEditingNode(true);
                } },
            ...{ onKeydown: (...[$event]) => {
                    if (!!(__VLS_ctx.editingNodeId !== node.id))
                        return;
                    __VLS_ctx.finishEditingNode(false);
                } },
            ...{ onClick: () => { } },
            ref: "nodeEditInputEl",
            ...{ class: "node-label-input" },
            maxlength: "160",
        });
        (__VLS_ctx.editingNodeLabel);
        /** @type {typeof __VLS_ctx.nodeEditInputEl} */ ;
    }
}
if (__VLS_ctx.contextMenu.visible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ctx-menu" },
        ...{ style: ({ left: `${__VLS_ctx.contextMenu.x}px`, top: `${__VLS_ctx.contextMenu.y}px` }) },
        role: "menu",
    });
    if (__VLS_ctx.contextMenu.kind === 'node') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.ctxEditNodeLabel) },
            type: "button",
            role: "menuitem",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.ctxDuplicateNode) },
            type: "button",
            role: "menuitem",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.ctxDeleteNode) },
            type: "button",
            ...{ class: "danger-plain" },
            role: "menuitem",
        });
    }
    else if (__VLS_ctx.contextMenu.kind === 'edge') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.ctxEditEdgeLabel) },
            type: "button",
            role: "menuitem",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.ctxDeleteEdge) },
            type: "button",
            ...{ class: "danger-plain" },
            role: "menuitem",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.ctxAddNodeHere) },
            type: "button",
            role: "menuitem",
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loadDiagrams) },
    type: "button",
    ...{ class: "secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.diagrams))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (item.diagramId),
    });
    (item.title);
    (item.nodes.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.useDiagram(item);
            } },
        type: "button",
        ...{ class: "secondary" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeSavedDiagram(item.diagramId);
            } },
        type: "button",
        ...{ class: "danger" },
        ...{ style: {} },
    });
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['hints']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['small']} */ ;
/** @type {__VLS_StyleScopedClasses['counts']} */ ;
/** @type {__VLS_StyleScopedClasses['error-text']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-symbols']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-svg']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-backdrop']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-group']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-line']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-label']} */ ;
/** @type {__VLS_StyleScopedClasses['edge-edit-popover']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['node-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['node-label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['node-type']} */ ;
/** @type {__VLS_StyleScopedClasses['node-label-input']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['danger-plain']} */ ;
/** @type {__VLS_StyleScopedClasses['danger-plain']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            title: title,
            nodes: nodes,
            edges: edges,
            diagrams: diagrams,
            newNodeType: newNodeType,
            edgeSourceId: edgeSourceId,
            edgeTargetId: edgeTargetId,
            edgeLabel: edgeLabel,
            errorMessage: errorMessage,
            canvasRef: canvasRef,
            selectedNodeId: selectedNodeId,
            selectedEdgeId: selectedEdgeId,
            draggingNodeId: draggingNodeId,
            editingNodeId: editingNodeId,
            editingNodeLabel: editingNodeLabel,
            nodeEditInputEl: nodeEditInputEl,
            editingEdgeId: editingEdgeId,
            editingEdgeLabel: editingEdgeLabel,
            edgeEditorX: edgeEditorX,
            edgeEditorY: edgeEditorY,
            edgeEditInputEl: edgeEditInputEl,
            contextMenu: contextMenu,
            hoveredEdgeId: hoveredEdgeId,
            nodeIconSlug: nodeIconSlug,
            renderedEdges: renderedEdges,
            selectionBanner: selectionBanner,
            strokeWidthPx: strokeWidthPx,
            onDiagramBackdropClick: onDiagramBackdropClick,
            onCanvasCtxMenu: onCanvasCtxMenu,
            openNodeCtx: openNodeCtx,
            openEdgeCtx: openEdgeCtx,
            ctxEditNodeLabel: ctxEditNodeLabel,
            ctxDuplicateNode: ctxDuplicateNode,
            ctxDeleteNode: ctxDeleteNode,
            ctxEditEdgeLabel: ctxEditEdgeLabel,
            ctxDeleteEdge: ctxDeleteEdge,
            ctxAddNodeHere: ctxAddNodeHere,
            addNode: addNode,
            addEdge: addEdge,
            saveDiagram: saveDiagram,
            loadDiagrams: loadDiagrams,
            useDiagram: useDiagram,
            removeSavedDiagram: removeSavedDiagram,
            selectEdge: selectEdge,
            onNodeClick: onNodeClick,
            onNodeMouseDown: onNodeMouseDown,
            startEditingNode: startEditingNode,
            finishEditingNode: finishEditingNode,
            startEditingEdge: startEditingEdge,
            finishEditingEdge: finishEditingEdge,
            onEdgeEditorBlur: onEdgeEditorBlur,
            deleteCurrentSelection: deleteCurrentSelection,
            clearCanvas: clearCanvas,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
