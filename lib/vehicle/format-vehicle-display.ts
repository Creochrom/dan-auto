/**
 * Canonical vehicle display — deduplicates make/model/year tokens before persistence and UI.
 */

export type VehicleDisplayParts = {
  make?: string;
  model?: string;
  year?: string;
  engine?: string;
};

const YEAR_RE = /^(19|20)\d{2}$/;

function tokenize(value: string): string[] {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Remove duplicate make/year tokens already present in model or repeated across fields. */
export function normalizeVehicleParts(parts: VehicleDisplayParts): VehicleDisplayParts {
  const make = parts.make?.trim() ?? "";
  const model = parts.model?.trim() ?? "";
  const year = parts.year?.trim() ?? "";
  const engine = parts.engine?.trim() ?? "";

  const makeLower = make.toLowerCase();
  const yearToken = YEAR_RE.test(year) ? year : "";

  const modelTokens = tokenize(model).filter((token) => {
    const lower = token.toLowerCase();
    if (makeLower && lower === makeLower) return false;
    if (yearToken && token === yearToken) return false;
    return true;
  });

  return {
    make: make || undefined,
    model: modelTokens.join(" ") || undefined,
    year: yearToken || (/^\d{4}$/.test(year) ? year : undefined),
    engine: engine || undefined,
  };
}

/** Display line: "2007 BMW 320D" (year · uppercase make · model). */
export function formatVehicleDisplay(parts: VehicleDisplayParts): string {
  const normalized = normalizeVehicleParts(parts);
  const make = normalized.make
    ? normalized.make.toUpperCase()
    : "";
  const segments = [normalized.year, make, normalized.model].filter(Boolean);
  return segments.join(" ").replace(/\s{2,}/g, " ").trim();
}

/** Reformat a legacy combined vehicleModel string when structured parts are unavailable. */
export function formatVehicleFromLegacyString(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  const tokens = tokenize(trimmed);
  let year: string | undefined;
  const rest: string[] = [];

  for (const token of tokens) {
    if (!year && YEAR_RE.test(token)) {
      year = token;
      continue;
    }
    rest.push(token);
  }

  if (rest.length === 0) return trimmed;

  const make = rest[0] ?? "";
  const model = rest.slice(1).join(" ");
  return formatVehicleDisplay({ year, make, model });
}

export function vehiclePartsFromStructured(structured?: {
  vehicle: { make?: string; model?: string; year?: string; engine?: string };
}): VehicleDisplayParts {
  if (!structured?.vehicle) return {};
  return normalizeVehicleParts(structured.vehicle);
}
