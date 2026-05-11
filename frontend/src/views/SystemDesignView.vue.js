import { computed, onBeforeUnmount, ref } from "vue";
import { createDiagram, listDiagrams } from "../api/client";
import { useAppStore } from "../stores/app";
const NODE_WIDTH = 150;
const NODE_HEIGHT = 64;
const CANVAS_WIDTH = 980;
const CANVAS_HEIGHT = 520;
const appStore = useAppStore();
const title = ref("Sample Architecture");
const nodes = ref([]);
const edges = ref([]);
const diagrams = ref([]);
const errorMessage = ref("");
const newNodeType = ref("service");
const edgeSourceId = ref("");
const edgeTargetId = ref("");
const edgeLabel = ref("HTTP");
const canvasRef = ref(null);
const draggingNodeId = ref(null);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);
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
}
async function loadDiagrams() {
    try {
        diagrams.value = await listDiagrams();
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
function useDiagram(item) {
    title.value = item.title;
    nodes.value = [...item.nodes];
    edges.value = [...item.edges];
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
    draggingNodeId.value = null;
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function extractErrorMessage(error) {
    const maybeAxios = error;
    return maybeAxios.response?.data?.message || maybeAxios.message || "Request failed";
}
void loadDiagrams();
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
        key: (edge.id),
        x1: (edge.x1),
        y1: (edge.y1),
        x2: (edge.x2),
        y2: (edge.y2),
        stroke: "#4b5563",
        'stroke-width': "2",
        'marker-end': "url(#arrow)",
    });
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
        key: (node.id),
        ...{ class: "diagram-node" },
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
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-svg']} */ ;
/** @type {__VLS_StyleScopedClasses['diagram-node']} */ ;
/** @type {__VLS_StyleScopedClasses['node-type']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            title: title,
            nodes: nodes,
            edges: edges,
            diagrams: diagrams,
            errorMessage: errorMessage,
            newNodeType: newNodeType,
            edgeSourceId: edgeSourceId,
            edgeTargetId: edgeTargetId,
            edgeLabel: edgeLabel,
            canvasRef: canvasRef,
            renderedEdges: renderedEdges,
            addNode: addNode,
            addEdge: addEdge,
            saveDiagram: saveDiagram,
            loadDiagrams: loadDiagrams,
            useDiagram: useDiagram,
            startDrag: startDrag,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
