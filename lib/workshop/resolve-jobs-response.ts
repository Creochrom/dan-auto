import type { Job } from "@/lib/types/job";

type JobsApiPayload =
  | Job[]
  | { jobs?: Job[] }
  | null
  | undefined;

/** Normalise GET /api/jobs response — data may be Job[] or { jobs: Job[] }. */
export function resolveJobsFromApiData(data: JobsApiPayload): Job[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.jobs) ? data.jobs : [];
}

export function resolveJobsFromResponse(json: {
  ok?: boolean;
  data?: JobsApiPayload;
} | null): Job[] {
  if (!json?.ok) return [];
  return resolveJobsFromApiData(json.data);
}
