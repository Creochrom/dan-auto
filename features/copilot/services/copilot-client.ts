"use client";

import { adminFetch } from "@/lib/admin/client";
import type {
  CopilotAskInput,
  CopilotAskResult,
} from "@/features/copilot/types/copilot";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Browser → POST /api/copilot (admin session required).
 */
export async function askWorkshopCopilot(
  input: CopilotAskInput
): Promise<CopilotAskResult> {
  const res = await adminFetch("/api/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const json = (await res.json()) as ApiResult<CopilotAskResult>;
  if (!res.ok || !json.ok) {
    throw new Error(
      !json.ok ? json.error : `Copilot request failed (${res.status})`
    );
  }
  return json.data;
}
