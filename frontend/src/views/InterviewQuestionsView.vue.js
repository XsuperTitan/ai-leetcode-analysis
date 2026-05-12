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
const drafts = ref({});
function makeDraft(item) {
    return {
        question: item.question,
        detailAnswer: item.detailAnswer ?? "",
        bulletsDraft: (item.answerHints ?? []).join("\n\n")
    };
}
/** Keep existing textarea content when IDs stay the same; drop stale keys after a new search. */
function reconcileDrafts(items) {
    const idsNow = new Set(items.map((i) => i.questionId));
    const next = { ...drafts.value };
    for (const id of Object.keys(next)) {
        if (!idsNow.has(id)) {
            delete next[id];
        }
    }
    for (const item of items) {
        if (!(item.questionId in next)) {
            next[item.questionId] = makeDraft(item);
        }
    }
    drafts.value = next;
}
watch(() => result.value.map((i) => i.questionId), () => reconcileDrafts(result.value), { immediate: true });
watch([keyword, category, level], () => {
    interviewStore.persist();
});
function parseBulletsFromDraft(text) {
    const trimmed = text.trim();
    if (!trimmed)
        return [];
    const blocks = trimmed
        .split(/\n\s*\n+/)
        .map((b) => b.trim())
        .filter(Boolean);
    if (blocks.length > 1) {
        return blocks;
    }
    return trimmed
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
}
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
async function saveFavorite(item) {
    errorMessage.value = "";
    const row = drafts.value[item.questionId];
    if (!row) {
        errorMessage.value = "Draft not ready yet—try search again.";
        return;
    }
    const bullets = parseBulletsFromDraft(row.bulletsDraft);
    const q = row.question.trim();
    if (!q) {
        errorMessage.value = "Question text cannot be empty.";
        return;
    }
    if (bullets.length === 0) {
        errorMessage.value = "Add at least one non-empty talking point.";
        return;
    }
    try {
        await addFavorite({
            questionId: item.questionId,
            question: q,
            detailAnswer: row.detailAnswer.trim(),
            answerHints: bullets,
            tags: item.tags ?? []
        });
        interviewStore.patchQuestion(item.questionId, {
            question: q,
            detailAnswer: row.detailAnswer.trim(),
            answerHints: bullets,
            tags: item.tags ?? [],
            isFavorite: true
        });
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
/** @type {__VLS_StyleScopedClasses['draft-text']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "intro" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row toolbar" },
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
    type: "button",
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? "Loading..." : "Search");
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.result.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "hit-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.result))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (item.questionId),
            ...{ class: "hit" },
        });
        if (__VLS_ctx.drafts[item.questionId]) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "field-label" },
                for: (`q-${item.questionId}`),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                id: (`q-${item.questionId}`),
                ...{ class: "draft-text" },
                rows: "3",
                value: (__VLS_ctx.drafts[item.questionId].question),
                spellcheck: "true",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "field-label" },
                for: (`d-${item.questionId}`),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                id: (`d-${item.questionId}`),
                ...{ class: "draft-text narrative" },
                rows: "14",
                value: (__VLS_ctx.drafts[item.questionId].detailAnswer),
                placeholder: "Long-form spoken-style answer...",
                spellcheck: "true",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "field-label" },
                for: (`b-${item.questionId}`),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "field-hint" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                id: (`b-${item.questionId}`),
                ...{ class: "draft-text" },
                rows: "10",
                value: (__VLS_ctx.drafts[item.questionId].bulletsDraft),
                spellcheck: "true",
            });
            if (item.tags.length > 0) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "tags" },
                });
                for (const [tag] of __VLS_getVForSourceType((item.tags))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        key: (`${item.questionId}-tag-${tag}`),
                        ...{ class: "tag" },
                    });
                    (tag);
                }
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "actions" },
            });
            if (!item.isFavorite) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.result.length === 0))
                                return;
                            if (!(__VLS_ctx.drafts[item.questionId]))
                                return;
                            if (!(!item.isFavorite))
                                return;
                            __VLS_ctx.saveFavorite(item);
                        } },
                    type: "button",
                    ...{ class: "primary" },
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "fav-note" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.result.length === 0))
                                return;
                            if (!(__VLS_ctx.drafts[item.questionId]))
                                return;
                            if (!!(!item.isFavorite))
                                return;
                            __VLS_ctx.cancelFavorite(item.questionId);
                        } },
                    type: "button",
                    ...{ class: "danger" },
                });
            }
        }
    }
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['intro']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['hit-list']} */ ;
/** @type {__VLS_StyleScopedClasses['hit']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['draft-text']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['draft-text']} */ ;
/** @type {__VLS_StyleScopedClasses['narrative']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['draft-text']} */ ;
/** @type {__VLS_StyleScopedClasses['tags']} */ ;
/** @type {__VLS_StyleScopedClasses['tag']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['fav-note']} */ ;
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
            drafts: drafts,
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
