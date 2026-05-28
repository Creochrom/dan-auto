"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  parseWorkshopJobParams,
  resolveWorkshopJobContextStub,
  type WorkshopJobContextStub,
} from "@/features/copilot/utils/workshop-job-context";

export function useWorkshopJobParams(): {
  jobId: string | null;
  reg: string | null;
  jobStub: WorkshopJobContextStub | null;
} {
  const searchParams = useSearchParams();
  return useMemo(() => {
    const { jobId, reg } = parseWorkshopJobParams(searchParams);
    const jobStub = resolveWorkshopJobContextStub({ jobId, reg });
    return { jobId, reg, jobStub };
  }, [searchParams]);
}
