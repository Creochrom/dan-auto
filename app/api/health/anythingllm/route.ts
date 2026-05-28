/**
 * GET /api/health/anythingllm
 *
 * Probes AnythingLLM connectivity and workspace readiness.
 *
 * Response shapes:
 *   enabled: false                         — ANYTHINGLLM_ENABLED not set; not an error.
 *   reachable: true  + workspaceReady: true  — workspace exists and has documents.
 *   reachable: true  + workspaceReady: false — workspace exists but no documents ingested.
 *   reachable: false                         — container down or bad URL/key.
 *   500                                      — env vars missing (baseUrl or apiKey).
 *
 * Admin-only (session cookie required).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getAnythingLlmConfig,
  isAnythingLlmConfigured,
} from "@/lib/copilot/config";

export async function GET(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  const config = getAnythingLlmConfig();

  if (!config.enabled) {
    return jsonOk({
      enabled: false,
      message: "ANYTHINGLLM_ENABLED is not set — copilot runs without RAG context.",
    });
  }

  if (!isAnythingLlmConfigured()) {
    return jsonError(
      "ANYTHINGLLM_ENABLED=true but ANYTHINGLLM_BASE_URL or ANYTHINGLLM_API_KEY is missing.",
      500
    );
  }

  const base = config.baseUrl.replace(/\/$/, "");

  // Probe 1: GET /api/v1/auth — lightweight auth check (no body needed).
  let reachable = false;
  let authOk = false;
  let latencyMs = 0;

  try {
    const t0 = Date.now();
    const authRes = await fetch(`${base}/api/v1/auth`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(5_000),
    });
    latencyMs = Date.now() - t0;
    reachable = true;
    authOk = authRes.ok;
  } catch {
    return jsonOk({
      enabled: true,
      reachable: false,
      workspaceReady: false,
      latencyMs,
      message: `AnythingLLM unreachable at ${base}`,
    });
  }

  if (!authOk) {
    return jsonOk({
      enabled: true,
      reachable,
      workspaceReady: false,
      latencyMs,
      message: "API key rejected — check ANYTHINGLLM_API_KEY.",
    });
  }

  // Probe 2: GET /api/v1/workspace/:slug — check workspace exists + doc count.
  let workspaceReady = false;
  let documentCount = 0;
  let workspaceMessage: string | undefined;

  try {
    const wsRes = await fetch(
      `${base}/api/v1/workspace/${config.workspaceSlug}`,
      {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(5_000),
      }
    );

    if (wsRes.ok) {
      const body = (await wsRes.json()) as {
        workspace?: { documents?: unknown[] };
      };
      documentCount = body.workspace?.documents?.length ?? 0;
      workspaceReady = documentCount > 0;
      if (!workspaceReady) {
        workspaceMessage = `Workspace "${config.workspaceSlug}" exists but has no ingested documents. See docs/ANYTHINGLLM_SETUP.md §6.`;
      }
    } else if (wsRes.status === 404) {
      workspaceMessage = `Workspace "${config.workspaceSlug}" not found. Create it in the AnythingLLM UI and set ANYTHINGLLM_WORKSPACE_SLUG.`;
    } else {
      workspaceMessage = `Workspace probe returned HTTP ${wsRes.status}.`;
    }
  } catch {
    workspaceMessage = "Workspace probe timed out.";
  }

  return jsonOk({
    enabled: true,
    reachable,
    workspaceSlug: config.workspaceSlug,
    workspaceReady,
    documentCount,
    latencyMs,
    ...(workspaceMessage ? { message: workspaceMessage } : {}),
  });
}
