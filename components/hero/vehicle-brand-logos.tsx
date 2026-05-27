import { Car } from "lucide-react";
import { BrandMark } from "@/components/hero/BrandMark";

export type VehicleBrandLogoKey =
  | "bmw"
  | "audi"
  | "mercedes"
  | "volkswagen"
  | "vauxhall"
  | "ford"
  | "toyota"
  | "nissan"
  | "honda"
  | "peugeot"
  | "renault"
  | "kia"
  | "hyundai"
  | "skoda"
  | "seat"
  | "mini"
  | "land-rover"
  | "lexus"
  | "porsche"
  | "volvo"
  | "tesla";

export function VehicleBrandLogoSvg({
  brand,
  className,
}: {
  brand: VehicleBrandLogoKey;
  className?: string;
}) {
  return <BrandMark brand={brand} className={className} />;
}

/** Neutral fallback when make cannot be matched — never show a wrong brand mark. */
export function VehicleBrandFallbackIcon({ className }: { className?: string }) {
  return <Car className={className} aria-hidden />;
}
