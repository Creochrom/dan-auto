import type { VehicleLookupResponse } from "@/lib/types/vehicle-report";
import { stripPlate } from "@/lib/format-plate";

const clientCache = new Map<string, VehicleLookupResponse>();

export async function fetchVehicleLookup(reg: string): Promise<VehicleLookupResponse> {
  const key = stripPlate(reg);
  const hit = clientCache.get(key);
  if (hit) return { ...hit, cached: true };

  const res = await fetch("/api/vehicle-lookup", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reg: key }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Vehicle lookup failed");
  }

  const data = (await res.json()) as VehicleLookupResponse;
  clientCache.set(key, data);
  return data;
}

/** Short MOT label for compact hero summary. */
export function compactMotLabel(report: VehicleLookupResponse["report"]): string {
  if (report.legacy.motStatus === "valid") return "MOT Valid";
  if (report.legacy.motStatus === "due_soon") return "MOT Due Soon";
  if (report.legacy.motStatus === "urgent") return "MOT Expired";
  return report.profile.motStatus;
}
