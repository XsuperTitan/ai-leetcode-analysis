import { computed, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { createDiagram, deleteDiagram, listDiagrams } from "../api/client";
import { useAppStore } from "../stores/app";
import { useSystemDesignStore } from "../stores/systemDesign";
const NODE_WIDTH = 150;
const NODE_HEIGHT = 64;
const CANVAS_WIDTH = 980;
const CANVAS_HEIGHT = 520;
const appStore = useAppStore();
const systemDesignStore = useSystemDesignStore();
const { title, nodes, edges, diagrams, newNodeType, edgeSourceId, edgeTargetId, edgeLabel } = storeToRefs(systemDesignStore);
const errorMessage = ref("");
const canvasRef = ref(null);
const selectedNodeId = ref("");
const selectedEdgeId = ref("");
const selectedNodeLabel = ref("");
const selectedEdgeLabel = ref("");
const draggingNodeId = ref(null);
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
            y2: target.y + NODE_HEIGHT / 2,
            labelX: (source.x + target.x) / 2 + NODE_WIDTH / 2,
            labelY: (source.y + target.y) / 2 + NODE_HEIGHT / 2 - 6,
            label: edge.label
        };
    })
        .filter((item) => item !== null);
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
    selectedEdgeId.value = edges.value[edges.value.length - 1].id;
    selectedEdgeLabel.value = edges.value[edges.value.length - 1].label;
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
    systemDesignStore.setCanvasData(item.title, [...item.nodes], [...item.edges]);
    selectedNodeId.value = "";
    selectedEdgeId.value = "";
    selectedNodeLabel.value = "";
    selectedEdgeLabel.value = "";
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
function startDrag(event, nodeId) {
    const node = nodes.value.find((item) => item.id === nodeId);
    if (!node || !canvasRef.value) {
        return;
    }
    const canvasRect = canvasRef.value.getBoundingClientRect();
    draggingNodeId.value = nodeId;
    dragOffsetX.value = event.clientX - canvasRect.left - node.x;
    dragOffsetY.value = event.clientY - canvasRect.top - node.y;
}
function selectNode(nodeId) {
    selectedNodeId.value = nodeId;
    const node = nodes.value.find((item) => item.id === nodeId);
    selectedNodeLabel.value = node?.label || "";
}
function selectEdge(edgeId) {
    selectedEdgeId.value = edgeId;
    const edge = edges.value.find((item) => item.id === edgeId);
    selectedEdgeLabel.value = edge?.label || "";
}
function syncSelectedNodeLabel() {
    const node = nodes.value.find((item) => item.id === selectedNodeId.value);
    selectedNodeLabel.value = node?.label || "";
}
function syncSelectedEdgeLabel() {
    const edge = edges.value.find((item) => item.id === selectedEdgeId.value);
    selectedEdgeLabel.value = edge?.label || "";
}
function applyNodeLabel() {
    if (!selectedNodeId.value) {
        return;
    }
    const nextLabel = selectedNodeLabel.value.trim();
    if (!nextLabel) {
        errorMessage.value = "Node text cannot be empty.";
        return;
    }
    nodes.value = nodes.value.map((node) => node.id === selectedNodeId.value ? { ...node, label: nextLabel } : node);
    systemDesignStore.persist();
}
function applyEdgeLabel() {
    if (!selectedEdgeId.value) {
        return;
    }
    const nextLabel = selectedEdgeLabel.value.trim();
    if (!nextLabel) {
        errorMessage.value = "Edge text cannot be empty.";
        return;
    }
    edges.value = edges.value.map((edge) => edge.id === selectedEdgeId.value ? { ...edge, label: nextLabel } : edge);
    systemDesignStore.persist();
}
function deleteSelectedNode() {
    if (!selectedNodeId.value) {
        return;
    }
    const nodeId = selectedNodeId.value;
    nodes.value = nodes.value.filter((node) => node.id !== nodeId);
    edges.value = edges.value.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
    if (edgeSourceId.value === nodeId) {
        edgeSourceId.value = "";
    }
    if (edgeTargetId.value === nodeId) {
        edgeTargetId.value = "";
    }
    selectedNodeId.value = "";
    selectedNodeLabel.value = "";
    if (selectedEdgeId.value && !edges.value.some((edge) => edge.id === selectedEdgeId.value)) {
        selectedEdgeId.value = "";
        selectedEdgeLabel.value = "";
    }
    systemDesignStore.persist();
}
function deleteSelectedEdge() {
    if (!selectedEdgeId.value) {
        return;
    }
    edges.value = edges.value.filter((edge) => edge.id !== selectedEdgeId.value);
    selectedEdgeId.value = "";
    selectedEdgeLabel.value = "";
    systemDesignStore.persist();
}
function clearCanvas() {
    nodes.value = [];
    edges.value = [];
    edgeSourceId.value = "";
    edgeTargetId.value = "";
    selectedNodeId.value = "";
    selectedEdgeId.value = "";
    selectedNodeLabel.value = "";
    selectedEdgeLabel.value = "";
    systemDesignStore.persist();
}
function onMouseMove(event) {
    if (!draggingNodeId.value || !canvasRef.value) {
        return;
    }
    const canvasRect = canvasRef.value.getBoundingClientRect();
    const rawX = event.clientX - canvasRect.left - dragOffsetX.value;
    const rawY = event.clientY - canvasRect.top - dragOffsetY.value;
    const clampedX = clamp(rawX, 0, CANVAS_WIDTH - NODE_WIDTH);
    const clampedY = clamp(rawY, 0, CANVAS_HEIGHT - NODE_HEIGHT);
    nodes.value = nodes.value.map((node) => node.id === draggingNodeId.value
        ? { ...node, x: clampedX, y: clampedY }
        : node);
}
function onMouseUp() {
    if (draggingNodeId.value) {
        systemDesignStore.persist();
    }
    draggingNodeId.value = null;
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function extractErrorMessage(error) {
    const maybeAxios = error;
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Diagram title",
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.newNodeType),
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
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveDiagram) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.clearCanvas) },
    ...{ class: "danger" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.edgeSourceId),
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
});
(__VLS_ctx.edgeLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.addEdge) },
    ...{ class: "secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (__VLS_ctx.syncSelectedNodeLabel) },
    value: (__VLS_ctx.selectedNodeId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [node] of __VLS_getVForSourceType((__VLS_ctx.nodes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (`edit-node-${node.id}`),
        value: (node.id),
    });
    (node.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Edit node text",
});
(__VLS_ctx.selectedNodeLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.applyNodeLabel) },
    ...{ class: "secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.deleteSelectedNode) },
    ...{ class: "danger" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (__VLS_ctx.syncSelectedEdgeLabel) },
    value: (__VLS_ctx.selectedEdgeId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [edge] of __VLS_getVForSourceType((__VLS_ctx.edges))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (`edit-edge-${edge.id}`),
        value: (edge.id),
    });
    (edge.source);
    (edge.target);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Edit edge text",
});
(__VLS_ctx.selectedEdgeLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.applyEdgeLabel) },
    ...{ class: "secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.deleteSelectedEdge) },
    ...{ class: "danger" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.nodes.length);
(__VLS_ctx.edges.length);
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "canvasRef",
    ...{ class: "diagram-canvas" },
});
/** @type {typeof __VLS_ctx.canvasRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "diagram-svg" },
});
for (const [edge] of __VLS_getVForSourceType((__VLS_ctx.renderedEdges))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectEdge(edge.id);
            } },
        key: (edge.id),
        x1: (edge.x1),
        y1: (edge.y1),
        x2: (edge.x2),
        y2: (edge.y2),
        stroke: (__VLS_ctx.selectedEdgeId === edge.id ? '#dc2626' : '#4b5563'),
        'stroke-width': "2",
        'marker-end': "url(#arrow)",
    });
}
for (const [edge] of __VLS_getVForSourceType((__VLS_ctx.renderedEdges))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        key: (`label-${edge.id}`),
        x: (edge.labelX),
        y: (edge.labelY),
        'text-anchor': "middle",
        'font-size': "12",
        fill: "#111827",
    });
    (edge.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.marker, __VLS_intrinsicElements.marker)({
    id: "arrow",
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
for (const [node] of __VLS_getVForSourceType((__VLS_ctx.nodes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (...[$event]) => {
                __VLS_ctx.startDrag($event, node.id);
            } },
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectNode(node.id);
            } },
        key: (node.id),
        ...{ class: "diagram-node" },
        ...{ class: ({ selected: __VLS_ctx.selectedNodeId === node.id }) },
        ...{ style: ({ left: `${node.x}px`, top: `${node.y}px` }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (node.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "node-type" },
    });
    (node.type);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loadDiagrams) },
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
        ...{ class: "secondary" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeSavedDiagram(item.diagramId);
            } },
        ...{ class: "danger" },
        ...{ style: {} },
    });
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-svg']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['node-type']} */ ;
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
            selectedNodeLabel: selectedNodeLabel,
            selectedEdgeLabel: selectedEdgeLabel,
            renderedEdges: renderedEdges,
            addNode: addNode,
            addEdge: addEdge,
            saveDiagram: saveDiagram,
            loadDiagrams: loadDiagrams,
            useDiagram: useDiagram,
            removeSavedDiagram: removeSavedDiagram,
            startDrag: startDrag,
            selectNode: selectNode,
            selectEdge: selectEdge,
            syncSelectedNodeLabel: syncSelectedNodeLabel,
            syncSelectedEdgeLabel: syncSelectedEdgeLabel,
            applyNodeLabel: applyNodeLabel,
            applyEdgeLabel: applyEdgeLabel,
            deleteSelectedNode: deleteSelectedNode,
            deleteSelectedEdge: deleteSelectedEdge,
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
