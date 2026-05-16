import axios from "axios";
import type {
  ApiResponse,
  DiagramUpsertRequest,
  CheatSheetResponse,
  InterviewQuestionItem,
  InterviewRecordingReportResponse,
  InterviewSearchRequest,
  InterviewSearchResult,
  LeetcodeAnalysisItem,
  LeetcodeAnalyzeRequest,
  LeetcodeCheatSheetRequest,
  LeetcodeCheatSheetResponse,
  SystemDesignDiagram
} from "../types/api";

const client = axios.create({
  baseURL: "http://localhost:8080/api/v1"
});

export async function analyzeLeetcode(payload: LeetcodeAnalyzeRequest): Promise<LeetcodeAnalysisItem> {
  const resp = await client.post<ApiResponse<LeetcodeAnalysisItem>>("/leetcode/analyze", payload);
  return unwrap(resp.data);
}

export async function listLeetcode(keyword = "", page = 0, size = 10): Promise<LeetcodeAnalysisItem[]> {
  const resp = await client.get<ApiResponse<LeetcodeAnalysisItem[]>>("/leetcode/analyses", {
    params: { keyword, page, size }
  });
  return unwrap(resp.data);
}

export async function getLeetcodeAnalysis(analysisId: string): Promise<LeetcodeAnalysisItem> {
  const resp = await client.get<ApiResponse<LeetcodeAnalysisItem>>(`/leetcode/analyses/${analysisId}`);
  return unwrap(resp.data);
}

export async function downloadLeetcodeMarkdown(analysisId: string): Promise<Blob> {
  const resp = await client.get(`/leetcode/analyses/${analysisId}/markdown`, {
    responseType: "blob"
  });
  return resp.data as Blob;
}

export async function deleteLeetcodeAnalysis(analysisId: string): Promise<void> {
  const resp = await client.delete<ApiResponse<{ status: string }>>(`/leetcode/analyses/${analysisId}`);
  unwrap(resp.data);
}

export async function generateLeetcodeCheatSheet(payload: LeetcodeCheatSheetRequest): Promise<LeetcodeCheatSheetResponse> {
  const resp = await client.post<ApiResponse<LeetcodeCheatSheetResponse>>("/leetcode/cheat-sheet", payload);
  return unwrap(resp.data);
}

export async function createDiagram(payload: DiagramUpsertRequest): Promise<SystemDesignDiagram> {
  const resp = await client.post<ApiResponse<SystemDesignDiagram>>("/system-design/diagrams", payload);
  return unwrap(resp.data);
}

export async function listDiagrams(keyword = ""): Promise<SystemDesignDiagram[]> {
  const resp = await client.get<ApiResponse<SystemDesignDiagram[]>>("/system-design/diagrams", {
    params: { keyword, page: 0, size: 20 }
  });
  return unwrap(resp.data);
}

export async function deleteDiagram(diagramId: string): Promise<void> {
  const resp = await client.delete<ApiResponse<{ status: string }>>(`/system-design/diagrams/${diagramId}`);
  unwrap(resp.data);
}

export async function searchInterviewQuestions(payload: InterviewSearchRequest): Promise<InterviewSearchResult> {
  const resp = await client.post<ApiResponse<InterviewSearchResult>>("/interview-questions/search", payload);
  return unwrap(resp.data);
}

export async function addFavorite(questionId: string): Promise<void> {
  const resp = await client.post<ApiResponse<{ status: string }>>("/interview-questions/favorites", { questionId });
  unwrap(resp.data);
}

export async function removeFavorite(questionId: string): Promise<void> {
  const resp = await client.delete<ApiResponse<{ status: string }>>(`/interview-questions/favorites/${questionId}`);
  unwrap(resp.data);
}

export async function getFavorites(appId: string): Promise<InterviewQuestionItem[]> {
  const resp = await client.get<ApiResponse<InterviewQuestionItem[]>>("/interview-questions/favorites", {
    params: { appId }
  });
  return unwrap(resp.data);
}

export async function generateInterviewCheatSheet(payload: { appId: string; lang?: string }): Promise<CheatSheetResponse> {
  const resp = await client.post<ApiResponse<CheatSheetResponse>>("/interview-questions/cheat-sheet", payload);
  return unwrap(resp.data);
}

export async function requestInterviewRecordingReport(file: File, appId: string): Promise<InterviewRecordingReportResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("appId", appId);
  const resp = await client.post<ApiResponse<InterviewRecordingReportResponse>>("/interview-recording/report", form);
  return unwrap(resp.data);
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (response.code !== 0) {
    throw new Error(response.message || "Request failed");
  }
  return response.data;
}
