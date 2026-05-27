import type { SimpleIcon } from "simple-icons";
import {
  siAudi,
  siBmw,
  siFord,
  siHonda,
  siHyundai,
  siKia,
  siLandrover,
  siMercedes,
  siMini,
  siNissan,
  siPeugeot,
  siPorsche,
  siRenault,
  siSeat,
  siSkoda,
  siTesla,
  siToyota,
  siVauxhall,
  siVolkswagen,
  siVolvo,
} from "simple-icons/icons";
import type { VehicleBrandLogoKey } from "@/lib/vehicle-brand-logos";

/** Lexus is not in Simple Icons — minimal wordmark-style fallback only. */
const LEXUS_ICON: SimpleIcon = {
  title: "Lexus",
  slug: "lexus",
  hex: "1A1A1A",
  source: "https://www.lexus.com/",
  svg: "",
  path: "M4 18V6h3.2c2.2 0 3.6 1.2 3.6 3.1 0 1.3-.7 2.3-1.9 2.8L12.4 18H9.2l-1.6-4.4H7.2V18H4zm3.2-7.2h1.3c.9 0 1.4-.5 1.4-1.2s-.5-1.2-1.4-1.2H7.2v2.4zm8.5 7.2V6H19c2.4 0 4 1.5 4 3.6S21.4 13.2 19 13.2h-2.1V18h-3.2zm3.2-4.8H19c.8 0 1.3-.4 1.3-1s-.5-1-1.3-1h-2.1v2z",
  guidelines: undefined,
  license: undefined,
};

const BRAND_ICONS: Record<VehicleBrandLogoKey, SimpleIcon> = {
  bmw: siBmw,
  audi: siAudi,
  mercedes: siMercedes,
  volkswagen: siVolkswagen,
  vauxhall: siVauxhall,
  ford: siFord,
  toyota: siToyota,
  nissan: siNissan,
  honda: siHonda,
  peugeot: siPeugeot,
  renault: siRenault,
  kia: siKia,
  hyundai: siHyundai,
  skoda: siSkoda,
  seat: siSeat,
  mini: siMini,
  "land-rover": siLandrover,
  porsche: siPorsche,
  volvo: siVolvo,
  tesla: siTesla,
  lexus: LEXUS_ICON,
};

const WIDE_BRANDS = new Set<VehicleBrandLogoKey>([
  "audi",
  "mercedes",
  "volkswagen",
  "land-rover",
  "ford",
  "toyota",
  "vauxhall",
  "hyundai",
  "peugeot",
]);

type Props = {
  brand: VehicleBrandLogoKey;
  className?: string;
};

/** Verified manufacturer mark (Simple Icons, monochrome). */
export function BrandMark({ brand, className = "" }: Props) {
  const icon = BRAND_ICONS[brand];

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      aria-label={`${icon.title} logo`}
      className={`hero-brand-mark ${WIDE_BRANDS.has(brand) ? "hero-brand-mark--wide" : ""} ${className}`.trim()}
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  );
}
