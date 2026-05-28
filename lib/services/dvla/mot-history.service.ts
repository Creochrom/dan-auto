/**
 * DVSA MOT History Trade API
 * Docs: https://dvsa.github.io/mot-history-api-documentation/
 * Endpoint: https://history.mot-testing.service.gov.uk/api/trade/vehicles/registration/{reg}
 *
 * Requires a separate API key from DVLA VES (Vehicle Enquiry Service).
 * Set MOT_HISTORY_API_KEY in .env.local or Vercel to enable.
 * When the key is absent or the API fails, every call returns null and the
 * caller falls back to the DVLA-derived MOT expiry stub — no errors surfaced.
 */

const MOT_HISTORY_BASE =
  "https://history.mot-testing.service.gov.uk/api/trade/vehicles/registration";

/** A single advisory / failure reason on one MOT test. */
export type MotTestComment = {
  text: string;
  /** ADVISORY | MAJOR | MINOR | DANGEROUS | PRS (pass with repair) */
  type: "ADVISORY" | "MAJOR" | "MINOR" | "DANGEROUS" | "PRS";
  dangerous: boolean;
};

/**
 * One MOT test record from the Trade API.
 * Dates arrive as "2024-03-15 00:00:00.000" (UTC, space-separated).
 */
export type MotTestRecord = {
  completedDate: string;
  testResult: "PASSED" | "FAILED";
  odometerValue: number | null;
  odometerUnit: "mi" | "km" | null;
  expiryDate?: string;
  rfrAndComments?: MotTestComment[];
};

/** Top-level vehicle object returned by the Trade API. */
export type MotHistoryVehicle = {
  registration: string;
  make?: string;
  model?: string;
  motTests?: MotTestRecord[];
};

/**
 * Fetch MOT history for a canonical (uppercase, no-space) registration.
 * Returns null when:
 *  - MOT_HISTORY_API_KEY is not configured
 *  - The registration is not found (404)
 *  - The upstream API returns any error or times out
 * All failures are logged as warnings, never thrown.
 */
export async function fetchMotHistory(
  registrationNumber: string
): Promise<MotHistoryVehicle | null> {
  const apiKey = process.env.MOT_HISTORY_API_KEY?.trim();
  if (!apiKey) return null;

  let response: Response;
  try {
    response = await fetch(
      `${MOT_HISTORY_BASE}/${encodeURIComponent(registrationNumber)}`,
      {
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
        // Don't let stale MOT history serve from any CDN cache.
        cache: "no-store",
      }
    );
  } catch (err) {
    console.warn("[mot-history] network error — falling back to DVLA stub", registrationNumber, err);
    return null;
  }

  if (response.status === 404) return null;

  if (!response.ok) {
    console.warn("[mot-history] upstream error", response.status, registrationNumber);
    return null;
  }

  try {
    return (await response.json()) as MotHistoryVehicle;
  } catch (err) {
    console.warn("[mot-history] invalid JSON", registrationNumber, err);
    return null;
  }
}
