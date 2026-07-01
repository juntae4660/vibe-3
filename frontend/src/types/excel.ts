export type ExcelJob = {
  id: number;
  jobType: "split" | "merge";
  status: "pending" | "running" | "completed" | "failed";
};
