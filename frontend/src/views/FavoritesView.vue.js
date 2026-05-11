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
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.load) },
});
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.items))) {
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeFromFavorites(item.questionId);
            } },
        ...{ class: "danger" },
    });
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
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
