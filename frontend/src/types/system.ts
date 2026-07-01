export type HealthResponse = {
  service: string;
  status: "ok" | "error";
  detail: string;
};
