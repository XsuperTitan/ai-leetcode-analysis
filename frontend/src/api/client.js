import axios from "axios";
const client = axios.create({
    baseURL: "http://localhost:8080/api/v1"
});
export async function analyzeLeetcode(payload) {
    const resp = await client.post("/leetcode/analyze", payload);
    return unwrap(resp.data);
}
export async function listLeetcode(keyword = "") {
    const resp = await client.get("/leetcode/analyses", {
        params: { keyword, page: 0, size: 10 }
    });
    return unwrap(resp.data);
}
export async function getLeetcodeAnalysis(analysisId) {
    const resp = await client.get(`/leetcode/analyses/${analysisId}`);
    return unwrap(resp.data);
}
export async function downloadLeetcodeMarkdown(analysisId) {
    const resp = await client.get(`/leetcode/analyses/${analysisId}/markdown`, {
        responseType: "blob"
    });
    return resp.data;
}
export async function createDiagram(payload) {
    const resp = await client.post("/system-design/diagrams", payload);
    return unwrap(resp.data);
}
export async function listDiagrams(keyword = "") {
    const resp = await client.get("/system-design/diagrams", {
        params: { keyword, page: 0, size: 20 }
    });
    return unwrap(resp.data);
}
export async function searchInterviewQuestions(payload) {
    const resp = await client.post("/interview-questions/search", payload);
    return unwrap(resp.data);
}
export async function addFavorite(questionId) {
    const resp = await client.post("/interview-questions/favorites", { questionId });
    unwrap(resp.data);
}
export async function removeFavorite(questionId) {
    const resp = await client.delete(`/interview-questions/favorites/${questionId}`);
    unwrap(resp.data);
}
export async function getFavorites(appId) {
    const resp = await client.get("/interview-questions/favorites", {
        params: { appId }
    });
    return unwrap(resp.data);
}
function unwrap(response) {
    if (response.code !== 0) {
        throw new Error(response.message || "Request failed");
    }
    return response.data;
}
