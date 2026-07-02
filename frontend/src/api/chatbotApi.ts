import type { ChatbotAnswer, ChatbotManual, ChatbotQuestionPayload } from "../types/chatbot";

const CHATBOT_API = "/api/chatbot";
const OPENAI_API_KEY_HEADER = "X-OpenAI-Api-Key";

async function request<T>(
  path: string,
  options?: RequestInit,
  apiKey?: string | null,
): Promise<T> {
  const headers = new Headers(options?.headers);
  if (apiKey?.trim()) {
    headers.set(OPENAI_API_KEY_HEADER, apiKey.trim());
  }

  const response = await fetch(`${CHATBOT_API}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const detail = await readError(response);
    throw new Error(detail || `chatbot API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listComplaintManuals() {
  return request<ChatbotManual[]>("/manuals");
}

export function uploadComplaintManual(file: File, apiKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  return request<ChatbotManual>(
    "/manuals",
    {
      method: "POST",
      body: formData,
    },
    apiKey,
  );
}

export function askComplaintBot(payload: ChatbotQuestionPayload, apiKey: string) {
  return request<ChatbotAnswer>(
    "/respond",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    apiKey,
  );
}

export function listComplaintHistory() {
  return request<ChatbotAnswer[]>("/history");
}

async function readError(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? null;
  } catch {
    return null;
  }
}
