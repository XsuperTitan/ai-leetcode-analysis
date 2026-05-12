import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { addFavorite, removeFavorite, searchInterviewQuestions } from "../api/client";
import { useAppStore } from "../stores/app";
import { useInterviewStore } from "../stores/interview";
const appStore = useAppStore();
const interviewStore = useInterviewStore();
const { keyword, category, level, result } = storeToRefs(interviewStore);
const loading = ref(false);
const errorMessage = ref("");
watch([keyword, category, level], () => {
    interviewStore.persist();
});
async function search() {
    loading.value = true;
    errorMessage.value = "";
    try {
        const resp = await searchInterviewQuestions({
            appId: appStore.appId,
            keyword: keyword.value,
            category: category.value,
            level: level.value,
            count: 8
        });
        interviewStore.setResult(resp.items);
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
    finally {
        loading.value = false;
    }
}
async function saveFavorite(questionId) {
    errorMessage.value = "";
    try {
        await addFavorite(questionId);
        interviewStore.updateFavorite(questionId, true);
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
async function cancelFavorite(questionId) {
    errorMessage.value = "";
    try {
        await removeFavorite(questionId);
        interviewStore.updateFavorite(questionId, false);
    }
    catch (error) {
        errorMessage.value = extractErrorMessage(error);
    }
}
function extractErrorMessage(error) {
    const maybeAxios = error;
    return maybeAxios.response?.data?.message || maybeAxios.message || "Request failed";
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
    placeholder: "keyword, e.g. spring transaction",
});
(__VLS_ctx.keyword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.category),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "frontend",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "backend",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "fullstack",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "behavioral",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.level),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "junior",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "middle",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "senior",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.search) },
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? "Loading..." : "Search");
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.result))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (item.questionId),
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (item.question);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    for (const [hint] of __VLS_getVForSourceType((item.answerHints))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (hint),
        });
        (hint);
    }
    if (!item.isFavorite) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!item.isFavorite))
                        return;
                    __VLS_ctx.saveFavorite(item.questionId);
                } },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!item.isFavorite))
                        return;
                    __VLS_ctx.cancelFavorite(item.questionId);
                } },
            ...{ class: "danger" },
        });
    }
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            keyword: keyword,
            category: category,
            level: level,
            result: result,
            loading: loading,
            errorMessage: errorMessage,
            search: search,
            saveFavorite: saveFavorite,
            cancelFavorite: cancelFavorite,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
