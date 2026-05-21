import type { VehicleLookupResponse } from "@/lib/types/vehicle-report";

const clientCache = new Map<string, VehicleLookupResponse>();

export async function fetchVehicleLookup(reg: string): Promise<VehicleLookupResponse> {
  const key = reg.replace(/\s+/g, "").toUpperCase();
  const hit = clientCache.get(key);
  if (hit) return { ...hit, cached: true };

  const res = await fetch(`/api/vehicle-lookup?reg=${encodeURIComponent(reg)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Vehicle lookup failed");
  }

  const data = (await res.json()) as VehicleLookupResponse;
  clientCache.set(key, data);
  return data;
}
