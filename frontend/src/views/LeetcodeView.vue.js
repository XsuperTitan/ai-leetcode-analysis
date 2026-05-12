import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { analyzeLeetcode, deleteLeetcodeAnalysis, downloadLeetcodeMarkdown, generateLeetcodeCheatSheet, getLeetcodeAnalysis, listLeetcode } from "../api/client";
import { useAppStore } from "../stores/app";
import { useLeetcodeStore } from "../stores/leetcode";
const appStore = useAppStore();
const leetcodeStore = useLeetcodeStore();
const { title, description, language, difficulty, constraintsInput, result, history } = storeToRefs(leetcodeStore);
const loading = ref(false);
const validationMessage = ref("");
const errorMessage = ref("");
const selectedIds = ref([]);
const generatingCheat = ref(false);
const cheatMarkdown = ref("");
const cheatIdsAtGenerate = ref([]);
function sortedKey(ids) {
    return [...ids].sort().join("\u0001");
}
const cheatMeta = computed(() => {
    if (!cheatMarkdown.value.trim() || cheatIdsAtGenerate.value.length === 0) {
        return "";
    }
    return `Last sheet used ${cheatIdsAtGenerate.value.length} analysis(es).`;
});
const staleCheatHint = computed(() => {
    if (!cheatMarkdown.value.trim()) {
        return "";
    }
    if (sortedKey(cheatIdsAtGenerate.value) !== sortedKey(selectedIds.value)) {
        return "Your checkbox selection changed since the last run — generate again to align the sheet with the current pick.";
    }
    return "";
});
watch([title, description, language, difficulty, constraintsInput], () => {
    leetcodeStore.persist();
});
async function submit() {
    validationMessage.value = "";
    errorMessage.value = "";
    if (!title.value.trim()) {
        validationMessage.value = "Please enter problem title.";
        return;
    }
    loading.value = true;
    try {
        const constraints = constraintsInput.value
            .split(";")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        result.value = await analyzeLeetcode({
            appId: appStore.appId,
            title: title.value,
            description: description.value,
            constraints,
            language: language.value,
            difficulty: difficulty.value
        });
        leetcodeStore.setResult(result.value);
        await loadHistory();
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
    finally {
        loading.value = false;
    }
}
async function loadHistory() {
    const list = await listLeetcode("", 0, 50);
    leetcodeStore.setHistory(list);
    const valid = new Set(list.map((i) => i.analysisId));
    selectedIds.value = selectedIds.value.filter((id) => valid.has(id));
}
function selectAllHistory() {
    selectedIds.value = history.value.map((h) => h.analysisId);
}
function clearSelection() {
    selectedIds.value = [];
}
function onToggleAnalysis(ev, analysisId) {
    const checked = ev.target.checked;
    if (checked) {
        if (!selectedIds.value.includes(analysisId)) {
            selectedIds.value = [...selectedIds.value, analysisId];
        }
    }
    else {
        selectedIds.value = selectedIds.value.filter((id) => id !== analysisId);
    }
}
async function openHistory(analysisId) {
    errorMessage.value = "";
    try {
        const detail = await getLeetcodeAnalysis(analysisId);
        leetcodeStore.setResult(detail);
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
async function downloadMarkdown(analysisId) {
    errorMessage.value = "";
    try {
        const item = result.value && result.value.analysisId === analysisId ? result.value : await getLeetcodeAnalysis(analysisId);
        if (!item) {
            return;
        }
        const blob = await downloadLeetcodeMarkdown(analysisId);
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${item.title.replace(/[^a-zA-Z0-9\-_]+/g, "_")}-${analysisId}.md`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
async function deleteHistory(analysisId) {
    errorMessage.value = "";
    try {
        await deleteLeetcodeAnalysis(analysisId);
        leetcodeStore.removeHistoryItem(analysisId);
        selectedIds.value = selectedIds.value.filter((id) => id !== analysisId);
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
async function generateCheatSheet() {
    errorMessage.value = "";
    if (selectedIds.value.length === 0) {
        errorMessage.value = "Select at least one recent analysis.";
        return;
    }
    generatingCheat.value = true;
    cheatMarkdown.value = "";
    try {
        const resp = await generateLeetcodeCheatSheet({
            appId: appStore.appId,
            analysisIds: [...selectedIds.value]
        });
        cheatMarkdown.value = resp.markdown;
        cheatIdsAtGenerate.value = [...selectedIds.value];
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
        cheatIdsAtGenerate.value = [];
    }
    finally {
        generatingCheat.value = false;
    }
}
function downloadCheatMarkdown() {
    errorMessage.value = "";
    const body = cheatMarkdown.value.trim();
    if (!body) {
        errorMessage.value = "Generate a cheat sheet first.";
        return;
    }
    const safeApp = appStore.appId.replace(/[^a-zA-Z0-9\-_]+/g, "_");
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leetcode-cheat-sheet-${safeApp}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
}
if (history.value.length === 0) {
    void loadHistory();
}
function extractErrorMessage(error) {
    const maybeAxios = error;
    return maybeAxios.response?.data?.message || maybeAxios.message || "Analyze failed";
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['validation']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-section']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-section']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-section']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['history-check']} */ ;
/** @type {__VLS_StyleScopedClasses['history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['history-actions']} */ ;
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
    placeholder: "Title",
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.language),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "java",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "python",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "javascript",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.difficulty),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "easy",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "medium",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "hard",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.description),
    placeholder: "Problem description (optional, title-only is supported)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Constraints separated by ;",
});
(__VLS_ctx.constraintsInput);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.submit) },
    type: "button",
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? "Analyzing..." : "Analyze");
if (__VLS_ctx.validationMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "validation" },
    });
    (__VLS_ctx.validationMessage);
}
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error" },
    });
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.result) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.result.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.result))
                    return;
                __VLS_ctx.downloadMarkdown(__VLS_ctx.result.analysisId);
            } },
        type: "button",
        ...{ class: "secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.result.analysisId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "pre-wrap" },
    });
    (__VLS_ctx.result.thinking);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.result.timeComplexity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.result.spaceComplexity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.result.keyPoints))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (item),
        });
        (item);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
    (__VLS_ctx.result.solutionCode);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    if (__VLS_ctx.result.alternativeSolutions.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    }
    for (const [solution, idx] of __VLS_getVForSourceType((__VLS_ctx.result.alternativeSolutions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (`${solution.approachName}-${idx}`),
            ...{ class: "card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (idx + 1);
        (solution.approachName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (solution.thinking);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (solution.timeComplexity);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (solution.spaceComplexity);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
        (solution.solutionCode);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "pre-wrap" },
    });
    (__VLS_ctx.result.markdownContent);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card recent-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "recent-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loadHistory) },
    type: "button",
    ...{ class: "secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.selectAllHistory) },
    type: "button",
    ...{ class: "secondary" },
    disabled: (__VLS_ctx.history.length === 0),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.clearSelection) },
    type: "button",
    ...{ class: "secondary" },
    disabled: (__VLS_ctx.selectedIds.length === 0),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "count" },
});
(__VLS_ctx.selectedIds.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "history-list" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.history))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (item.analysisId),
        ...{ class: "history-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.onToggleAnalysis($event, item.analysisId);
            } },
        id: (`chk-${item.analysisId}`),
        type: "checkbox",
        checked: (__VLS_ctx.selectedIds.includes(item.analysisId)),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "history-title-label" },
        for: (`chk-${item.analysisId}`),
    });
    (item.title);
    (item.language);
    (item.difficulty);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openHistory(item.analysisId);
            } },
        type: "button",
        ...{ class: "secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.deleteHistory(item.analysisId);
            } },
        type: "button",
        ...{ class: "danger" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
    ...{ class: "cheat-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cheat-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.generateCheatSheet) },
    type: "button",
    disabled: (__VLS_ctx.generatingCheat || __VLS_ctx.selectedIds.length === 0),
});
(__VLS_ctx.generatingCheat ? "Generating…" : "Generate cheat sheet");
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.downloadCheatMarkdown) },
    type: "button",
    ...{ class: "secondary" },
    disabled: (!__VLS_ctx.cheatMarkdown.trim()),
});
if (__VLS_ctx.cheatMeta) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "meta" },
    });
    (__VLS_ctx.cheatMeta);
}
if (__VLS_ctx.staleCheatHint) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "stale-hint" },
    });
    (__VLS_ctx.staleCheatHint);
}
if (!__VLS_ctx.cheatMarkdown.trim() && !__VLS_ctx.generatingCheat) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "muted" },
    });
}
if (__VLS_ctx.cheatMarkdown.trim()) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "cheat-preview" },
    });
    (__VLS_ctx.cheatMarkdown);
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['validation']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['pre-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['pre-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-section']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['history-list']} */ ;
/** @type {__VLS_StyleScopedClasses['history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['history-check']} */ ;
/** @type {__VLS_StyleScopedClasses['history-title-label']} */ ;
/** @type {__VLS_StyleScopedClasses['history-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['cheat-title']} */ ;
/** @type {__VLS_StyleScopedClasses['cheat-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['meta']} */ ;
/** @type {__VLS_StyleScopedClasses['stale-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['cheat-preview']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            title: title,
            description: description,
            language: language,
            difficulty: difficulty,
            constraintsInput: constraintsInput,
            result: result,
            history: history,
            loading: loading,
            validationMessage: validationMessage,
            errorMessage: errorMessage,
            selectedIds: selectedIds,
            generatingCheat: generatingCheat,
            cheatMarkdown: cheatMarkdown,
            cheatMeta: cheatMeta,
            staleCheatHint: staleCheatHint,
            submit: submit,
            loadHistory: loadHistory,
            selectAllHistory: selectAllHistory,
            clearSelection: clearSelection,
            onToggleAnalysis: onToggleAnalysis,
            openHistory: openHistory,
            downloadMarkdown: downloadMarkdown,
            deleteHistory: deleteHistory,
            generateCheatSheet: generateCheatSheet,
            downloadCheatMarkdown: downloadCheatMarkdown,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
