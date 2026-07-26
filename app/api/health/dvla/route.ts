/**
 * GET /api/health/dvla
 *
 * Probes DVLA Vehicle Enquiry Service (VES) API key and connectivity.
 * Uses a lightweight lookup with a probe registration — no PII stored.
 *
 * Response shapes:
 *   configured: false     — DVLA_API_KEY missing
 *   keyValid: true         — API accepted the request (404/400/200 = key OK)
 *   keyValid: false        — 401/403 = bad or revoked key
 *   reachable: false        — network / timeout failure
 *
 * Admin session required (do not expose key status publicly).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonOk } from "@/lib/api/response";
import {
  fetchMotHistoryFromDvsa,
  isDvsaMotConfigured,
} from "@/lib/integrations/dvsa-mot";

const DVLA_VEHICLE_URL =
  "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

/** Probe plate — valid format, unlikely to exist; cheap auth check. */
const PROBE_REG = "ZZ99ZZZ";

type ProbeResult = {
  reachable: boolean;
  keyValid: boolean;
  latencyMs: number;
  httpStatus?: number;
  message?: string;
};

async function probeDvlaVes(apiKey: string): Promise<ProbeResult> {
  const t0 = Date.now();
  try {
    const response = await fetch(DVLA_VEHICLE_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ registrationNumber: PROBE_REG }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const latencyMs = Date.now() - t0;

    // 200 = found; 404 = not found; 400 = invalid format — all mean key is accepted.
    const keyValid =
      response.ok ||
      response.status === 404 ||
      response.status === 400;

    let message: string | undefined;
    if (response.status === 401 || response.status === 403) {
      message = "API key rejected — check DVLA_API_KEY in .env.local / Vercel.";
    } else if (response.status === 429) {
      message = "Rate limited — try again shortly.";
    } else if (!keyValid) {
      message = `Unexpected DVLA response HTTP ${response.status}.`;
    } else if (response.status === 404) {
      message = "DVLA reachable — probe registration not found (expected).";
    }

    return {
      reachable: true,
      keyValid,
      latencyMs,
      httpStatus: response.status,
      message,
    };
  } catch {
    return {
      reachable: false,
      keyValid: false,
      latencyMs: Date.now() - t0,
      message: "Could not reach DVLA Vehicle Enquiry API.",
    };
  }
}

async function probeMotHistory(): Promise<ProbeResult & { mode?: string }> {
  if (!isDvsaMotConfigured()) {
    return {
      reachable: false,
      keyValid: false,
      latencyMs: 0,
      message:
        "Optional — set MOT_HISTORY_API_KEY (and OAuth credentials for the new production API).",
    };
  }

  const t0 = Date.now();
  try {
    const result = await fetchMotHistoryFromDvsa(PROBE_REG);
    const latencyMs = Date.now() - t0;
    const mode =
      process.env.MOT_HISTORY_CLIENT_ID?.trim() &&
      process.env.MOT_HISTORY_CLIENT_SECRET?.trim() &&
      process.env.MOT_HISTORY_TOKEN_URL?.trim()
        ? "production-oauth"
        : "legacy-api-key";

    return {
      reachable: true,
      keyValid: true,
      latencyMs,
      httpStatus: result === null ? 404 : 200,
      mode,
      message:
        result === null
          ? `MOT API reachable (${mode}) — probe registration not found (expected).`
          : `MOT API ready (${mode}).`,
    };
  } catch {
    return {
      reachable: false,
      keyValid: false,
      latencyMs: Date.now() - t0,
      message: "Could not reach DVSA MOT History API.",
    };
  }
}

export async function GET() {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const dvlaKey = process.env.DVLA_API_KEY?.trim();
  const motKey = process.env.MOT_HISTORY_API_KEY?.trim();

  if (!dvlaKey) {
    return jsonOk({
      configured: false,
      ready: false,
      message:
        "DVLA_API_KEY is not set — homepage plate lookup will return 503. Get a key at https://developer-portal.driver-vehicle-licensing.api.gov.uk/",
      motHistory: {
        configured: Boolean(motKey),
        ready: false,
        message: motKey
          ? "MOT_HISTORY_API_KEY is set but DVLA is required first."
          : "Optional — set MOT_HISTORY_API_KEY for richer MOT history.",
      },
    });
  }

  const ves = await probeDvlaVes(dvlaKey);

  const motHistory = motKey
    ? await probeMotHistory()
    : {
        configured: false,
        ready: false,
        reachable: false,
        keyValid: false,
        latencyMs: 0,
        httpStatus: undefined,
        message:
          "Optional — set MOT_HISTORY_API_KEY for full MOT test history (DVSA Trade API).",
      };

  const ready = ves.reachable && ves.keyValid;

  return jsonOk({
    configured: true,
    ready,
    reachable: ves.reachable,
    keyValid: ves.keyValid,
    latencyMs: ves.latencyMs,
    httpStatus: ves.httpStatus,
    probeRegistration: PROBE_REG,
    endpoint: "/api/vehicle-lookup",
    message:
      ves.message ??
      (ready
        ? "DVLA VES is ready — plate lookup on site and in vehicle memory should work."
        : "DVLA is not ready."),
    motHistory: {
      configured: Boolean(motKey),
      ready: motKey ? motHistory.reachable && motHistory.keyValid : false,
      reachable: motHistory.reachable,
      keyValid: motHistory.keyValid,
      latencyMs: motHistory.latencyMs,
      httpStatus: motHistory.httpStatus,
      message: motHistory.message,
    },
  });
}
