import type { VehicleBrandLogoKey } from "@/components/hero/vehicle-brand-logos";

export type { VehicleBrandLogoKey };

/**
 * Brand icon registry — SVG components live in vehicle-brand-logos.tsx.
 * Paths reserved for optional /public/brands/*.svg assets later.
 */
export const brandIconPaths: Record<VehicleBrandLogoKey, string> = {
  bmw: "/brands/bmw.svg",
  audi: "/brands/audi.svg",
  mercedes: "/brands/mercedes.svg",
  volkswagen: "/brands/vw.svg",
  vauxhall: "/brands/vauxhall.svg",
  ford: "/brands/ford.svg",
  toyota: "/brands/toyota.svg",
  nissan: "/brands/nissan.svg",
  honda: "/brands/honda.svg",
  peugeot: "/brands/peugeot.svg",
  renault: "/brands/renault.svg",
  kia: "/brands/kia.svg",
  hyundai: "/brands/hyundai.svg",
  skoda: "/brands/skoda.svg",
  seat: "/brands/seat.svg",
  mini: "/brands/mini.svg",
  "land-rover": "/brands/land-rover.svg",
  lexus: "/brands/lexus.svg",
  porsche: "/brands/porsche.svg",
};

/** Ordered rules — more specific patterns first. */
const MAKE_RULES: ReadonlyArray<{ match: RegExp; brand: VehicleBrandLogoKey }> = [
  { match: /mercedes[\s-]?benz|mercedes/i, brand: "mercedes" },
  { match: /land[\s-]?rover/i, brand: "land-rover" },
  { match: /volkswagen|\bvw\b/i, brand: "volkswagen" },
  { match: /\bmini\b/i, brand: "mini" },
  { match: /\bbmw\b/i, brand: "bmw" },
  { match: /\baudi\b/i, brand: "audi" },
  { match: /\bvauxhall\b/i, brand: "vauxhall" },
  { match: /\bpeugeot\b/i, brand: "peugeot" },
  { match: /\brenault\b/i, brand: "renault" },
  { match: /\bporsche\b/i, brand: "porsche" },
  { match: /\btoyota\b/i, brand: "toyota" },
  { match: /\bnissan\b/i, brand: "nissan" },
  { match: /\bhonda\b/i, brand: "honda" },
  { match: /\bhyundai\b/i, brand: "hyundai" },
  { match: /\bford\b/i, brand: "ford" },
  { match: /\bkia\b/i, brand: "kia" },
  { match: /\bskoda\b|škoda/i, brand: "skoda" },
  { match: /\bseat\b/i, brand: "seat" },
  { match: /\blexus\b/i, brand: "lexus" },
];

function normalizeMake(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve manufacturer from DVLA make / makeModel string. */
export function resolveVehicleBrandIcon(manufacturer: string): VehicleBrandLogoKey | null {
  const normalized = normalizeMake(manufacturer);
  if (!normalized) return null;

  for (const { match, brand } of MAKE_RULES) {
    if (match.test(normalized)) return brand;
  }

  return null;
}
