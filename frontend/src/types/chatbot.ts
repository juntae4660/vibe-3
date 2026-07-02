export type ChatbotManual = {
  id: number;
  filename: string;
  originalFilename: string;
  pageCount: number;
  chunkCount: number;
  createdAt: string;
};

export type ChatbotSource = {
  page: number;
  chunk: number;
  preview: string;
};

export type ChatbotQuestionPayload = {
  question: string;
  manualId?: number | null;
};

export type ChatbotAnswer = {
  id: number;
  manualId: number | null;
  manualFilename?: string | null;
  question: string;
  answer: string;
  sources: ChatbotSource[];
  createdAt: string;
};
