import { ref } from "vue";
import { requestInterviewRecordingReport } from "../api/client";
import { useAppStore } from "../stores/app";
const appStore = useAppStore();
const localAppId = ref(appStore.appId);
const maxBytes = 30 * 1024 * 1024;
const selectedFile = ref(null);
const loading = ref(false);
const error = ref("");
const report = ref(null);
function saveAppId() {
    appStore.setAppId(localAppId.value);
}
function onFileSelected(ev) {
    error.value = "";
    report.value = null;
    const input = ev.target;
    const file = input.files?.[0];
    if (!file) {
        selectedFile.value = null;
        return;
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith(".mp3")) {
        error.value = "Please choose an .mp3 file.";
        selectedFile.value = null;
        input.value = "";
        return;
    }
    if (file.size > maxBytes) {
        error.value = `File is too large (max ${maxBytes} bytes).`;
        selectedFile.value = null;
        input.value = "";
        return;
    }
    selectedFile.value = file;
}
async function submitRecording() {
    const file = selectedFile.value;
    if (!file)
        return;
    loading.value = true;
    error.value = "";
    report.value = null;
    try {
        const appId = String(appStore.appId ?? "");
        report.value = await requestInterviewRecordingReport(file, appId);
    }
    catch (e) {
        error.value = e instanceof Error ? e.message : "Request failed";
    }
    finally {
        loading.value = false;
    }
}
function downloadMarkdown() {
    const md = report.value?.reportMarkdown;
    if (!md)
        return;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-report-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['recording-row']} */ ;
/** @type {__VLS_StyleScopedClasses['report-md']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row recording-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.onFileSelected) },
    type: "file",
    accept: ".mp3,audio/mpeg",
    disabled: (__VLS_ctx.loading),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.submitRecording) },
    type: "button",
    disabled: (!__VLS_ctx.selectedFile || __VLS_ctx.loading),
});
(__VLS_ctx.loading ? "Processing…" : "Upload and generate report");
__VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({
    ...{ class: "hint" },
});
((__VLS_ctx.maxBytes / (1024 * 1024)).toFixed(0));
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error" },
    });
    (__VLS_ctx.error);
}
if (__VLS_ctx.report) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.downloadMarkdown) },
        type: "button",
        ...{ class: "secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.details, __VLS_intrinsicElements.details)({
        ...{ class: "raw-details" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.summary, __VLS_intrinsicElements.summary)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "transcript-pre" },
    });
    (__VLS_ctx.report.rawTranscript);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "report-md" },
    });
    (__VLS_ctx.report.reportMarkdown);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "interview-coach-web",
});
(__VLS_ctx.localAppId);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveAppId) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
(__VLS_ctx.appStore.appId);
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['recording-row']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['raw-details']} */ ;
/** @type {__VLS_StyleScopedClasses['transcript-pre']} */ ;
/** @type {__VLS_StyleScopedClasses['report-md']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            appStore: appStore,
            localAppId: localAppId,
            maxBytes: maxBytes,
            selectedFile: selectedFile,
            loading: loading,
            error: error,
            report: report,
            saveAppId: saveAppId,
            onFileSelected: onFileSelected,
            submitRecording: submitRecording,
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
