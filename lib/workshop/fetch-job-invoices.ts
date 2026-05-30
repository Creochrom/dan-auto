import { adminFetch } from "@/lib/admin/client";
import type { Invoice } from "@/lib/types/workshop-data";

type InvoiceResponse = {
  ok?: boolean;
  data?: { invoice?: Invoice | null };
};

/** Load draft invoice totals for active jobs using existing per-job API. */
export async function fetchInvoiceMapForJobs(
  jobIds: string[]
): Promise<Map<string, Invoice | null>> {
  const map = new Map<string, Invoice | null>();
  if (jobIds.length === 0) return map;

  await Promise.all(
    jobIds.map(async (jobId) => {
      try {
        const res = await adminFetch(`/api/jobs/${jobId}/invoice`, {
          credentials: "include",
        });
        if (!res.ok) {
          map.set(jobId, null);
          return;
        }
        const json = (await res.json().catch(() => null)) as InvoiceResponse | null;
        map.set(jobId, json?.ok ? (json.data?.invoice ?? null) : null);
      } catch {
        map.set(jobId, null);
      }
    })
  );

  return map;
}
