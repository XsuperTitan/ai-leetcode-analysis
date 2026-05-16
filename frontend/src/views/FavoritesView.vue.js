import { computed, ref } from "vue";
import { generateInterviewCheatSheet, getFavorites, removeFavorite } from "../api/client";
import { useAppStore } from "../stores/app";
import { useInterviewStore } from "../stores/interview";
const appStore = useAppStore();
const interviewStore = useInterviewStore();
const items = ref([]);
const lang = ref("en");
const errorMessage = ref("");
const generating = ref(false);
const cheatSheetMarkdown = ref("");
const cheatSheetSourceCount = ref(null);
const cheatMeta = computed(() => {
    if (cheatSheetSourceCount.value == null || !cheatSheetMarkdown.value.trim()) {
        return "";
    }
    return `Last sheet built from ${cheatSheetSourceCount.value} favorite(s).`;
});
const staleHint = computed(() => {
    if (cheatSheetSourceCount.value == null)
        return "";
    if (items.value.length !== cheatSheetSourceCount.value) {
        return "Your favorites list changed — generate again for an up-to-date cheat sheet.";
    }
    return "";
});
async function load() {
    errorMessage.value = "";
    try {
        items.value = await getFavorites(appStore.appId);
        interviewStore.syncFavorites(items.value.map((item) => item.questionId));
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
async function removeFromFavorites(questionId) {
    errorMessage.value = "";
    try {
        await removeFavorite(questionId);
        items.value = items.value.filter((item) => item.questionId !== questionId);
        interviewStore.updateFavorite(questionId, false);
        interviewStore.syncFavorites(items.value.map((item) => item.questionId));
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
async function generateCheatSheet() {
    errorMessage.value = "";
    generating.value = true;
    cheatSheetMarkdown.value = "";
    try {
        const resp = await generateInterviewCheatSheet({ appId: appStore.appId, lang: lang.value });
        cheatSheetMarkdown.value = resp.markdown;
        cheatSheetSourceCount.value = resp.favoriteCount;
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
        cheatSheetSourceCount.value = null;
    }
    finally {
        generating.value = false;
    }
}
function downloadMarkdown() {
    errorMessage.value = "";
    const body = cheatSheetMarkdown.value.trim();
    if (!body) {
        errorMessage.value = "Generate a cheat sheet first.";
        return;
    }
    const safeApp = appStore.appId.replace(/[^a-zA-Z0-9\-_]+/g, "_");
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `interview-favorites-cheat-sheet-${safeApp}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
}
void load();
function extractErrorMessage(error) {
    const maybeAxios = error;
    return maybeAxios.response?.data?.message || maybeAxios.message || "Request failed";
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['split']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-head']} */ ;
/** @type {__VLS_StyleScopedClasses['fav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['fav-hints']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card favorites-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "intro" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "split" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "panel panel-left" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.load) },
    type: "button",
    ...{ class: "secondary" },
});
if (__VLS_ctx.items.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "muted" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "fav-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.items))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (item.questionId),
            ...{ class: "fav-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "fav-q" },
        });
        (item.question);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
            ...{ class: "fav-hints" },
        });
        for (const [hint, idx] of __VLS_getVForSourceType((item.answerHints))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (`${item.questionId}-h-${idx}`),
            });
            (hint);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.items.length === 0))
                        return;
                    __VLS_ctx.removeFromFavorites(item.questionId);
                } },
            type: "button",
            ...{ class: "danger small" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel panel-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.lang),
    ...{ class: "lang-select" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "en",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "zh",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.generateCheatSheet) },
    type: "button",
    disabled: (__VLS_ctx.generating || __VLS_ctx.items.length === 0),
});
(__VLS_ctx.generating ? "Generating…" : "Generate cheat sheet");
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.downloadMarkdown) },
    type: "button",
    ...{ class: "secondary" },
    disabled: (!__VLS_ctx.cheatSheetMarkdown.trim()),
});
if (__VLS_ctx.cheatMeta) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "meta" },
    });
    (__VLS_ctx.cheatMeta);
}
if (__VLS_ctx.staleHint) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "stale-hint" },
    });
    (__VLS_ctx.staleHint);
}
if (!__VLS_ctx.cheatSheetMarkdown.trim() && !__VLS_ctx.generating) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "muted preview-placeholder" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "markdown-preview" },
    });
    (__VLS_ctx.cheatSheetMarkdown);
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['favorites-page']} */ ;
/** @type {__VLS_StyleScopedClasses['intro']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['split']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-left']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-head']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['fav-list']} */ ;
/** @type {__VLS_StyleScopedClasses['fav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['fav-q']} */ ;
/** @type {__VLS_StyleScopedClasses['fav-hints']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['small']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-right']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-head']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['lang-select']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['meta']} */ ;
/** @type {__VLS_StyleScopedClasses['stale-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-preview']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            items: items,
            lang: lang,
            errorMessage: errorMessage,
            generating: generating,
            cheatSheetMarkdown: cheatSheetMarkdown,
            cheatMeta: cheatMeta,
            staleHint: staleHint,
            load: load,
            removeFromFavorites: removeFromFavorites,
            generateCheatSheet: generateCheatSheet,
            downloadMarkdown: downloadMarkdown,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
