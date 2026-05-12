import { ref } from "vue";
import { getFavorites, removeFavorite } from "../api/client";
import { useAppStore } from "../stores/app";
import { useInterviewStore } from "../stores/interview";
const appStore = useAppStore();
const interviewStore = useInterviewStore();
const items = ref([]);
const errorMessage = ref("");
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
void load();
function extractErrorMessage(error) {
    const maybeAxios = error;
    return maybeAxios.response?.data?.message || maybeAxios.message || "Request failed";
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['hit']} */ ;
/** @type {__VLS_StyleScopedClasses['hints']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.load) },
    type: "button",
});
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "hit-list" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.items))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (item.questionId),
        ...{ class: "hit" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "hit-question" },
    });
    (item.question);
    if (item.detailAnswer && item.detailAnswer.trim()) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
            ...{ class: "subhead" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-body" },
        });
        (item.detailAnswer);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
        ...{ class: "subhead" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "hints" },
    });
    for (const [hint, idx] of __VLS_getVForSourceType((item.answerHints))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (`${item.questionId}-hint-${idx}`),
        });
        (hint);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeFromFavorites(item.questionId);
            } },
        type: "button",
        ...{ class: "danger" },
    });
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['hit-list']} */ ;
/** @type {__VLS_StyleScopedClasses['hit']} */ ;
/** @type {__VLS_StyleScopedClasses['hit-question']} */ ;
/** @type {__VLS_StyleScopedClasses['subhead']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-body']} */ ;
/** @type {__VLS_StyleScopedClasses['subhead']} */ ;
/** @type {__VLS_StyleScopedClasses['hints']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            items: items,
            errorMessage: errorMessage,
            load: load,
            removeFromFavorites: removeFromFavorites,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
