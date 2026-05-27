/**
 * Lightweight vehicle image resolver — brand/model hierarchy with believable fallbacks.
 * Prioritises local demo assets, then curated vehicle photography (not workshop detail shots).
 */

export type VehicleImageMatch = {
  url: string;
  alt: string;
  matchKey: string;
};

const LOCAL_BMW_3_SERIES = "/hero-bmw.jpg";

/** Curated Unsplash vehicle exteriors — stable IDs, car-focused framing */
const REMOTE = {
  bmw_3_series: {
    url: "https://images.unsplash.com/photo-1617814076668-4e1b345c4df9?w=960&q=85&auto=format&fit=crop",
    alt: "BMW 3 Series saloon — front three-quarter, dark metallic",
  },
  bmw_5_series: {
    url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=960&q=85&auto=format&fit=crop",
    alt: "BMW 5 Series executive saloon",
  },
  bmw_generic: {
    url: LOCAL_BMW_3_SERIES,
    alt: "BMW saloon — premium executive styling",
  },
  audi_a4: {
    url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=960&q=85&auto=format&fit=crop",
    alt: "Audi A4 saloon — S line styling",
  },
  audi_generic: {
    url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=960&q=85&auto=format&fit=crop",
    alt: "Audi premium saloon",
  },
  mercedes_c_class: {
    url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d4?w=960&q=85&auto=format&fit=crop",
    alt: "Mercedes-Benz C-Class saloon",
  },
  mercedes_generic: {
    url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d4?w=960&q=85&auto=format&fit=crop",
    alt: "Mercedes-Benz saloon",
  },
  vw_golf: {
    url: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=960&q=85&auto=format&fit=crop",
    alt: "Volkswagen Golf hatchback",
  },
  vw_generic: {
    url: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=960&q=85&auto=format&fit=crop",
    alt: "Volkswagen hatchback",
  },
  ford_focus: {
    url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=960&q=85&auto=format&fit=crop",
    alt: "Ford Focus hatchback",
  },
  generic_saloon: {
    url: "https://images.unsplash.com/photo-1494976388531-d1058498cdd8?w=960&q=85&auto=format&fit=crop",
    alt: "UK registered vehicle — saloon profile",
  },
  unknown: {
    url: "https://images.unsplash.com/photo-1485291571159-772bcfc10da5?w=960&q=85&auto=format&fit=crop",
    alt: "Vehicle awaiting identification — generic saloon silhouette",
  },
} as const;

type ImageKey = keyof typeof REMOTE;

function normaliseMakeModel(makeModel: string): string {
  return makeModel
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickKey(makeModel: string, unknown?: boolean): ImageKey {
  if (unknown || makeModel.toLowerCase().includes("not recogn")) {
    return "unknown";
  }

  const m = normaliseMakeModel(makeModel);

  if (/\bBMW\b/.test(m)) {
    if (/\b(320|318|330|340|3\s*SERIES|3SERIES|G20|G21)\b/.test(m)) return "bmw_3_series";
    if (/\b(520|530|5\s*SERIES|5SERIES)\b/.test(m)) return "bmw_5_series";
    return "bmw_generic";
  }

  if (/\bAUDI\b/.test(m)) {
    if (/\b(A4|A3|S3|S4)\b/.test(m)) return "audi_a4";
    return "audi_generic";
  }

  if (/\b(MERCEDES|MERCS|AMG LINE|C220|C200|C CLASS|C-CLASS)\b/.test(m)) {
    if (/\b(C220|C200|C300|C CLASS|C-CLASS)\b/.test(m)) return "mercedes_c_class";
    return "mercedes_generic";
  }

  if (/\b(VW|VOLKSWAGEN)\b/.test(m)) {
    if (/\b(GOLF|GTD|GTI|R32)\b/.test(m)) return "vw_golf";
    return "vw_generic";
  }

  if (/\bFORD\b/.test(m) && /\b(FOCUS|FIESTA)\b/.test(m)) return "ford_focus";

  return "generic_saloon";
}

/** Resolve the best vehicle hero image for a make/model string. */
export function resolveVehicleImage(
  makeModel: string,
  options?: { unknown?: boolean }
): VehicleImageMatch {
  const key = pickKey(makeModel, options?.unknown);
  const entry = REMOTE[key];

  if (key === "bmw_3_series" || key === "bmw_generic") {
    return {
      url: LOCAL_BMW_3_SERIES,
      alt: makeModel && !options?.unknown
        ? `${makeModel} — UK specification`
        : entry.alt,
      matchKey: key,
    };
  }

  return {
    url: entry.url,
    alt:
      makeModel && !options?.unknown
        ? `${makeModel} — representative ${entry.alt.split("—")[0]?.trim() ?? "vehicle"}`
        : entry.alt,
    matchKey: key,
  };
}

/** Fallback chain when primary image fails to load (same key, then brand, then generic). */
export function vehicleImageFallbackChain(makeModel: string, unknown?: boolean): string[] {
  const primary = resolveVehicleImage(makeModel, { unknown });
  const m = normaliseMakeModel(makeModel);
  const chain = [primary.url];

  if (/\bBMW\b/.test(m) && primary.url !== LOCAL_BMW_3_SERIES) {
    chain.push(LOCAL_BMW_3_SERIES);
  }
  if (!chain.includes(REMOTE.generic_saloon.url)) {
    chain.push(REMOTE.generic_saloon.url);
  }
  if (!chain.includes(REMOTE.unknown.url)) {
    chain.push(REMOTE.unknown.url);
  }

  return [...new Set(chain)];
}
