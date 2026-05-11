import { reactive, ref } from "vue";
import { analyzeLeetcode, downloadLeetcodeMarkdown, getLeetcodeAnalysis, listLeetcode } from "../api/client";
import { useAppStore } from "../stores/app";
const appStore = useAppStore();
const loading = ref(false);
const result = ref(null);
const history = ref([]);
const constraintsInput = ref("");
const validationMessage = ref("");
const errorMessage = ref("");
const form = reactive({
    title: "",
    description: "",
    language: "java",
    difficulty: "easy"
});
async function submit() {
    validationMessage.value = "";
    errorMessage.value = "";
    if (!form.title.trim()) {
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
            title: form.title,
            description: form.description,
            constraints,
            language: form.language,
            difficulty: form.difficulty
        });
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
    history.value = await listLeetcode();
}
async function openHistory(analysisId) {
    errorMessage.value = "";
    try {
        result.value = await getLeetcodeAnalysis(analysisId);
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
async function downloadMarkdown(analysisId) {
    errorMessage.value = "";
    try {
        const item = result.value && result.value.analysisId === analysisId
            ? result.value
            : await getLeetcodeAnalysis(analysisId);
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
void loadHistory();
function extractErrorMessage(error) {
    const maybeAxios = error;
    return maybeAxios.response?.data?.message || maybeAxios.message || "Analyze failed";
}
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
    placeholder: "Title",
});
(__VLS_ctx.form.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.language),
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
    value: (__VLS_ctx.form.difficulty),
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
    value: (__VLS_ctx.form.description),
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
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? "Analyzing..." : "Analyze");
if (__VLS_ctx.validationMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    (__VLS_ctx.validationMessage);
}
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
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
        ...{ class: "secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.result.analysisId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ style: {} },
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
        ...{ style: {} },
    });
    (__VLS_ctx.result.markdownContent);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loadHistory) },
    ...{ class: "secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.history))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (item.analysisId),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openHistory(item.analysisId);
            } },
        ...{ class: "secondary" },
    });
    (item.title);
    (item.language);
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loading: loading,
            result: result,
            history: history,
            constraintsInput: constraintsInput,
            validationMessage: validationMessage,
            errorMessage: errorMessage,
            form: form,
            submit: submit,
            loadHistory: loadHistory,
            openHistory: openHistory,
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
