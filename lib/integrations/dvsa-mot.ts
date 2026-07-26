/**
 * DVSA MOT History API — server-side integration layer.
 *
 * Supports:
 * - **New production API** (2025+): OAuth client credentials + Bearer + X-API-Key
 *   `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/{reg}`
 * - **Legacy trade API** (x-api-key only):
 *   `https://history.mot-testing.service.gov.uk/api/trade/vehicles/registration/{reg}`
 *
 * API credentials are read from environment variables only — never sent to the browser.
 */

import { z } from "zod";
import { stripPlate } from "@/lib/format-plate";
import { vehicleMotHistoryRepository } from "@/lib/repositories/vehicle-mot-history.repository";
import type { MotHistoryFetchResult } from "@/lib/types/vehicle-mot-history";

export const DVSA_MOT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
export const DVSA_MOT_REQUEST_TIMEOUT_MS = 12_000;
export const DVSA_MOT_MAX_RETRIES = 2;

const NEW_API_BASE = "https://history.mot.api.gov.uk/v1/trade/vehicles/registration";
const LEGACY_API_BASE =
  "https://history.mot-testing.service.gov.uk/api/trade/vehicles/registration";

const FAILURE_TYPES = new Set([
  "MAJOR",
  "MINOR",
  "DANGEROUS",
  "PRS",
  "FAIL",
  "USER ENTERED",
]);

const motDefectSchema = z.object({
  text: z.string(),
  type: z.string(),
  dangerous: z.boolean().optional().default(false),
});

const odometerUnitSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.enum(["mi", "km"]).nullable().optional()
);

const motTestRecordSchema = z.object({
  completedDate: z.string(),
  testResult: z.string(),
  odometerValue: z.union([z.number(), z.string()]).nullable().optional(),
  odometerUnit: odometerUnitSchema,
  expiryDate: z.string().nullable().optional(),
  rfrAndComments: z.array(motDefectSchema).optional(),
  defects: z.array(motDefectSchema).optional(),
});

const motHistoryVehicleSchema = z.object({
  registration: z.string(),
  make: z.string().optional(),
  model: z.string().optional(),
  motTests: z.array(motTestRecordSchema).optional(),
});

export const motTestCommentSchema = z.object({
  text: z.string(),
  type: z.enum(["ADVISORY", "MAJOR", "MINOR", "DANGEROUS", "PRS"]),
  dangerous: z.boolean().optional().default(false),
});

export type MotTestComment = z.infer<typeof motTestCommentSchema>;

export type MotTestRecord = {
  completedDate: string;
  testResult: "PASSED" | "FAILED";
  odometerValue: number | null;
  odometerUnit: "mi" | "km" | null;
  expiryDate?: string;
  rfrAndComments?: MotTestComment[];
};

export type MotHistoryVehicle = {
  registration: string;
  make?: string;
  model?: string;
  motTests?: MotTestRecord[];
};

type OAuthTokenCache = {
  token: string;
  expiresAt: number;
};

let oauthTokenCache: OAuthTokenCache | null = null;

function parseOdometer(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normalizeTestResult(raw: string): "PASSED" | "FAILED" {
  const upper = raw.trim().toUpperCase();
  if (upper === "PASSED" || upper === "PASS") return "PASSED";
  return "FAILED";
}

function normalizeCommentType(raw: string): MotTestComment["type"] {
  const upper = raw.trim().toUpperCase();
  if (upper === "ADVISORY") return "ADVISORY";
  if (upper === "MAJOR") return "MAJOR";
  if (upper === "MINOR") return "MINOR";
  if (upper === "DANGEROUS") return "DANGEROUS";
  if (upper === "PRS") return "PRS";
  if (FAILURE_TYPES.has(upper)) return "MAJOR";
  return "ADVISORY";
}

function normalizeComments(
  test: z.infer<typeof motTestRecordSchema>
): MotTestComment[] {
  const raw = [...(test.rfrAndComments ?? []), ...(test.defects ?? [])];
  return raw.map((item) => ({
    text: item.text,
    type: normalizeCommentType(item.type),
    dangerous: item.dangerous ?? false,
  }));
}

function normalizeTest(test: z.infer<typeof motTestRecordSchema>): MotTestRecord {
  return {
    completedDate: test.completedDate,
    testResult: normalizeTestResult(test.testResult),
    odometerValue: parseOdometer(test.odometerValue),
    odometerUnit: test.odometerUnit ?? null,
    expiryDate: test.expiryDate ?? undefined,
    rfrAndComments: normalizeComments(test),
  };
}

function sortTestsNewestFirst(tests: MotTestRecord[]): MotTestRecord[] {
  return [...tests].sort((a, b) => {
    const ta = new Date(a.completedDate.replace(" ", "T").replace(/\./g, "-")).getTime();
    const tb = new Date(b.completedDate.replace(" ", "T").replace(/\./g, "-")).getTime();
    return tb - ta;
  });
}

function normalizeVehiclePayload(
  raw: z.infer<typeof motHistoryVehicleSchema>
): MotHistoryVehicle {
  const tests = (raw.motTests ?? []).map(normalizeTest);
  return {
    registration: stripPlate(raw.registration),
    make: raw.make,
    model: raw.model,
    motTests: sortTestsNewestFirst(tests),
  };
}

function parseVehicleResponse(json: unknown): MotHistoryVehicle | null {
  const candidate =
    Array.isArray(json) && json.length > 0 ? json[0] : json;

  const parsed = motHistoryVehicleSchema.safeParse(candidate);
  if (!parsed.success) {
    console.warn(
      "[dvsa-mot] response validation failed",
      parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`)
    );
    return null;
  }
  return normalizeVehiclePayload(parsed.data);
}

function usesNewProductionApi(): boolean {
  return Boolean(
    process.env.MOT_HISTORY_API_KEY?.trim() &&
      process.env.MOT_HISTORY_CLIENT_ID?.trim() &&
      process.env.MOT_HISTORY_CLIENT_SECRET?.trim() &&
      process.env.MOT_HISTORY_TOKEN_URL?.trim()
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getOAuthAccessToken(): Promise<string | null> {
  const clientId = process.env.MOT_HISTORY_CLIENT_ID?.trim();
  const clientSecret = process.env.MOT_HISTORY_CLIENT_SECRET?.trim();
  const tokenUrl = process.env.MOT_HISTORY_TOKEN_URL?.trim();
  const scope =
    process.env.MOT_HISTORY_SCOPE?.trim() || "https://tapi.dvsa.gov.uk/.default";

  if (!clientId || !clientSecret || !tokenUrl) return null;

  if (oauthTokenCache && Date.now() < oauthTokenCache.expiresAt - 60_000) {
    return oauthTokenCache.token;
  }

  try {
    const response = await fetchWithTimeout(
      tokenUrl,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope,
        }),
        cache: "no-store",
      },
      DVSA_MOT_REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      console.warn("[dvsa-mot] OAuth token request failed", response.status);
      return null;
    }

    const body = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!body.access_token) {
      console.warn("[dvsa-mot] OAuth response missing access_token");
      return null;
    }

    const expiresInMs = (body.expires_in ?? 3600) * 1000;
    oauthTokenCache = {
      token: body.access_token,
      expiresAt: Date.now() + expiresInMs,
    };

    return body.access_token;
  } catch (err) {
    console.warn("[dvsa-mot] OAuth token network error", err);
    return null;
  }
}

async function buildRequestHeaders(): Promise<Record<string, string> | null> {
  const apiKey = process.env.MOT_HISTORY_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[dvsa-mot] MOT_HISTORY_API_KEY not configured");
    return null;
  }

  if (usesNewProductionApi()) {
    const token = await getOAuthAccessToken();
    if (!token) {
      console.warn("[dvsa-mot] OAuth token unavailable for new production API");
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "X-API-Key": apiKey,
      Accept: "application/json",
    };
  }

  return {
    "X-API-Key": apiKey,
    Accept: "application/json",
  };
}

function resolveApiUrl(canon: string): string {
  const base = usesNewProductionApi() ? NEW_API_BASE : LEGACY_API_BASE;
  return `${base}/${encodeURIComponent(canon)}`;
}

/**
 * Fetch MOT history directly from DVSA (no cache). Returns null on any failure.
 */
export async function fetchMotHistoryFromDvsa(
  registrationNumber: string
): Promise<MotHistoryVehicle | null> {
  const canon = stripPlate(registrationNumber);
  if (canon.length < 2) return null;

  const headers = await buildRequestHeaders();
  if (!headers) return null;

  const url = resolveApiUrl(canon);

  for (let attempt = 0; attempt <= DVSA_MOT_MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        url,
        { headers, cache: "no-store" },
        DVSA_MOT_REQUEST_TIMEOUT_MS
      );

      if (response.status === 404) return null;

      if (response.status === 401 || response.status === 403) {
        console.warn("[dvsa-mot] auth rejected", response.status, canon);
        oauthTokenCache = null;
        return null;
      }

      if (!response.ok) {
        console.warn(
          "[dvsa-mot] upstream error",
          response.status,
          canon,
          `attempt ${attempt + 1}`
        );
        if (attempt < DVSA_MOT_MAX_RETRIES && response.status >= 500) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        return null;
      }

      const json: unknown = await response.json();
      const vehicle = parseVehicleResponse(json);
      if (!vehicle) {
        console.warn("[dvsa-mot] response validation failed", canon);
        return null;
      }

      return vehicle;
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      console.warn(
        "[dvsa-mot] request failed",
        canon,
        isAbort ? "timeout" : err,
        `attempt ${attempt + 1}`
      );
      if (attempt < DVSA_MOT_MAX_RETRIES) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      return null;
    }
  }

  return null;
}

/** Backward-compatible alias used by health probe and legacy imports. */
export async function fetchMotHistory(
  registrationNumber: string
): Promise<MotHistoryVehicle | null> {
  const result = await getMotHistory(registrationNumber);
  return result.data;
}

/**
 * Resolve MOT history with DB cache — refresh only when stale.
 * Falls back to cached data when DVSA is temporarily unavailable.
 */
export async function getMotHistory(
  registrationNumber: string,
  options?: { forceRefresh?: boolean }
): Promise<MotHistoryFetchResult> {
  const canon = stripPlate(registrationNumber);
  if (canon.length < 2) {
    return { data: null, source: "unavailable" };
  }

  const cached = await vehicleMotHistoryRepository.findByRegistration(canon);
  const cacheFresh =
    cached &&
    Date.now() - new Date(cached.fetchedAt).getTime() < DVSA_MOT_CACHE_TTL_MS;

  if (!options?.forceRefresh && cacheFresh) {
    return {
      data: cached.payload,
      source: "cache",
      fetchedAt: cached.fetchedAt,
      cached: true,
    };
  }

  const live = await fetchMotHistoryFromDvsa(canon);
  if (live) {
    const stored = await vehicleMotHistoryRepository.upsert(canon, live).catch((err) => {
      console.warn("[dvsa-mot] cache write failed", canon, err);
      return undefined;
    });
    return {
      data: live,
      source: "dvsa",
      fetchedAt: stored?.fetchedAt ?? new Date().toISOString(),
      cached: false,
    };
  }

  if (cached) {
    console.warn("[dvsa-mot] DVSA unavailable — serving stale cache", canon);
    return {
      data: cached.payload,
      source: "cache",
      fetchedAt: cached.fetchedAt,
      cached: true,
    };
  }

  return { data: null, source: "unavailable" };
}

/** Parse raw DVSA JSON — exported for tests. */
export function parseDvsaMotJson(json: unknown): MotHistoryVehicle | null {
  return parseVehicleResponse(json);
}

/** Whether DVSA MOT History credentials are configured (any supported mode). */
export function isDvsaMotConfigured(): boolean {
  return Boolean(process.env.MOT_HISTORY_API_KEY?.trim());
}
