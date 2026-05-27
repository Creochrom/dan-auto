import type { HeroBrandId } from "@/lib/hero-content";

/** Extended brand keys for vehicle lookup cards (includes makes outside hero ribbon). */
export type VehicleBrandIconKey = HeroBrandId | "vauxhall" | "ford" | "nissan" | "honda";

/**
 * Brand icon registry — keys map to inline SVG components in VehicleBrandIcon.
 * Public SVG paths can be added later under /public/brands/ without changing callers.
 */
export const brandIconKeys: Record<VehicleBrandIconKey, string> = {
  bmw: "/brands/bmw.svg",
  audi: "/brands/audi.svg",
  mercedes: "/brands/mercedes.svg",
  volkswagen: "/brands/vw.svg",
  mini: "/brands/mini.svg",
  "land-rover": "/brands/land-rover.svg",
  porsche: "/brands/porsche.svg",
  toyota: "/brands/toyota.svg",
  vauxhall: "/brands/vauxhall.svg",
  ford: "/brands/ford.svg",
  nissan: "/brands/nissan.svg",
  honda: "/brands/honda.svg",
};

const MAKE_ALIASES: ReadonlyArray<{ match: RegExp; brand: VehicleBrandIconKey }> = [
  { match: /^bmw\b/i, brand: "bmw" },
  { match: /^audi\b/i, brand: "audi" },
  { match: /^(mercedes|mercedes-benz)\b/i, brand: "mercedes" },
  { match: /^(volkswagen|vw)\b/i, brand: "volkswagen" },
  { match: /^vauxhall\b/i, brand: "vauxhall" },
  { match: /^mini\b/i, brand: "mini" },
  { match: /^(land rover|landrover)\b/i, brand: "land-rover" },
  { match: /^porsche\b/i, brand: "porsche" },
  { match: /^toyota\b/i, brand: "toyota" },
  { match: /^ford\b/i, brand: "ford" },
  { match: /^nissan\b/i, brand: "nissan" },
  { match: /^honda\b/i, brand: "honda" },
];

export function isHeroBrandId(brand: VehicleBrandIconKey): brand is HeroBrandId {
  return brand !== "vauxhall" && brand !== "ford" && brand !== "nissan" && brand !== "honda";
}

/** Resolve manufacturer from DVLA make / makeModel string. */
export function resolveVehicleBrandIcon(manufacturer: string): VehicleBrandIconKey | null {
  const normalized = manufacturer.toLowerCase().trim();
  if (!normalized) return null;

  for (const { match, brand } of MAKE_ALIASES) {
    if (match.test(normalized)) return brand;
  }

  return null;
}
