import type { HealthResponse } from "../types/system";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`${path} 요청 실패: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getBackendHealth() {
  return request<HealthResponse>("/api/health");
}

export function getDatabaseHealth() {
  return request<HealthResponse>("/api/db/health");
}
