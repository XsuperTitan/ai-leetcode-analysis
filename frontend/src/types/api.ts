export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LeetcodeAnalyzeRequest {
  appId: string;
  title: string;
  description: string;
  constraints: string[];
  language: string;
  difficulty: string;
  lang?: string;
}

export interface LeetcodeAnalysisItem {
  analysisId: string;
  appId: string;
  title: string;
  description: string;
  constraints: string[];
  language: string;
  difficulty: string;
  thinking: string;
  solutionCode: string;
  timeComplexity: string;
  spaceComplexity: string;
  keyPoints: string[];
  alternativeSolutions: LeetcodeAlternativeSolution[];
  markdownContent: string;
  createdAt: string;
}

export interface LeetcodeAlternativeSolution {
  approachName: string;
  thinking: string;
  solutionCode: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export interface LeetcodeCheatSheetRequest {
  appId: string;
  analysisIds: string[];
  lang?: string;
}

export interface LeetcodeCheatSheetResponse {
  markdown: string;
  analysisCount: number;
}

export interface DiagramNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface DiagramUpsertRequest {
  appId: string;
  title: string;
  description: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  canvasMeta: Record<string, unknown>;
}

export interface SystemDesignDiagram {
  diagramId: string;
  appId: string;
  title: string;
  description: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  canvasMeta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSearchRequest {
  appId: string;
  keyword: string;
  category: string;
  level: string;
  count: number;
  lang?: string;
}

export interface InterviewQuestionItem {
  questionId: string;
  queryId: string;
  appId: string;
  question: string;
  answerHints: string[];
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export interface InterviewSearchResult {
  queryId: string;
  items: InterviewQuestionItem[];
}

export interface CheatSheetResponse {
  markdown: string;
  favoriteCount: number;
}
