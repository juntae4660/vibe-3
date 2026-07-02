const STORAGE_KEY = "vibe-3.apiBaseUrl";
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";

let runtimeApiBaseUrl = DEFAULT_API_BASE_URL;

if (typeof window !== "undefined") {
  const storedApiBaseUrl = window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  if (storedApiBaseUrl) {
    runtimeApiBaseUrl = storedApiBaseUrl.replace(/\/$/, "");
  }
}

function normalizeApiBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/$/, "");
}

export function getApiBaseUrl() {
  return runtimeApiBaseUrl;
}

export function setApiBaseUrl(baseUrl: string) {
  runtimeApiBaseUrl = normalizeApiBaseUrl(baseUrl);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, runtimeApiBaseUrl);
  }

  return runtimeApiBaseUrl;
}

export function resetApiBaseUrl() {
  runtimeApiBaseUrl = DEFAULT_API_BASE_URL;

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return runtimeApiBaseUrl;
}

export function apiUrl(path: string, baseUrl = runtimeApiBaseUrl) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
  return `${normalizedBaseUrl}${normalizedPath}`;
}
