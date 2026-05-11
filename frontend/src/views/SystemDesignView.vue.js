import { ref } from "vue";
import { createDiagram, listDiagrams } from "../api/client";
import { useAppStore } from "../stores/app";
const appStore = useAppStore();
const title = ref("Sample Architecture");
const nodes = ref([]);
const edges = ref([]);
const diagrams = ref([]);
function addNode() {
    const id = `n${nodes.value.length + 1}`;
    nodes.value.push({
        id,
        type: "service",
        label: `Service ${nodes.value.length + 1}`,
        x: 100 + nodes.value.length * 80,
        y: 100
    });
}
function addEdge() {
    if (nodes.value.length < 2) {
        return;
    }
    const source = nodes.value[nodes.value.length - 2].id;
    const target = nodes.value[nodes.value.length - 1].id;
    edges.value.push({
        id: `e${edges.value.length + 1}`,
        source,
        target,
        label: "HTTP"
    });
}
async function saveDiagram() {
    await createDiagram({
        appId: appStore.appId,
        title: title.value,
        description: "MVP diagram",
        nodes: nodes.value,
        edges: edges.value,
        canvasMeta: { zoom: 1, version: "1.0" }
    });
    await loadDiagrams();
}
async function loadDiagrams() {
    diagrams.value = await listDiagrams();
}
void loadDiagrams();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.addNode) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.addEdge) },
    ...{ class: "secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveDiagram) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.nodes.length);
(__VLS_ctx.edges.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
for (const [node] of __VLS_getVForSourceType((__VLS_ctx.nodes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (node.id),
    });
    (node.id);
    (node.type);
    (node.label);
    (node.x);
    (node.y);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
for (const [edge] of __VLS_getVForSourceType((__VLS_ctx.edges))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (edge.id),
    });
    (edge.source);
    (edge.target);
    (edge.label);
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
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            title: title,
            nodes: nodes,
            edges: edges,
            diagrams: diagrams,
            addNode: addNode,
            addEdge: addEdge,
            saveDiagram: saveDiagram,
            loadDiagrams: loadDiagrams,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
