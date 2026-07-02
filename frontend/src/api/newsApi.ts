import type { NewsArticle, NewsCollectionResponse } from "../types/news";
import { apiUrl } from "./config";

const NEWS_API = "/api/news";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(`${NEWS_API}${path}`), {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const detail = await readError(response);
    throw new Error(detail || `news API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function listNewsArticles(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("start_date", params.startDate);
  if (params?.endDate) searchParams.set("end_date", params.endDate);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return request<NewsArticle[]>(query ? `?${query}` : "");
}

export function collectNewsByDate(targetDate: string) {
  return request<NewsCollectionResponse>("/collect", {
    method: "POST",
    body: JSON.stringify({ targetDate }),
  });
}

export function collectRecentNews() {
  return request<NewsCollectionResponse>("/collect/recent", {
    method: "POST",
  });
}

async function readError(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? null;
  } catch {
    return null;
  }
}
