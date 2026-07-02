import type { HealthResponse } from "../types/system";
import { apiUrl, getApiBaseUrl } from "./config";

async function request<T>(path: string, baseUrl = getApiBaseUrl()): Promise<T> {
  const response = await fetch(apiUrl(path, baseUrl));

  if (!response.ok) {
    throw new Error(`${path} 요청 실패: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getBackendHealth(baseUrl?: string) {
  return request<HealthResponse>("/api/health", baseUrl);
}

export function getDatabaseHealth(baseUrl?: string) {
  return request<HealthResponse>("/api/db/health", baseUrl);
}
