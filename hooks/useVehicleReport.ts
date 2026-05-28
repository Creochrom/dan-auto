"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchVehicleLookup } from "@/lib/vehicle-lookup-client";
import type { VehicleReport } from "@/lib/types/vehicle-report";

type UseVehicleReportResult = {
  report: VehicleReport | null;
  loading: boolean;
  error: string | null;
};

export function useVehicleReport(registration: string | null | undefined): UseVehicleReportResult {
  const reg = useMemo(() => registration?.trim() ?? "", [registration]);
  const [report, setReport] = useState<VehicleReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!reg) {
        setReport(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchVehicleLookup(reg);
        if (cancelled) return;
        setReport(result.report);
      } catch (err) {
        if (cancelled) return;
        setReport(null);
        setError(err instanceof Error ? err.message : "Vehicle intelligence unavailable.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reg]);

  return { report, loading, error };
}
