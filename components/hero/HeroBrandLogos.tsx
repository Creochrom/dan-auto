import type { HeroBrandId } from "@/lib/hero-content";
import {
  VehicleBrandLogoSvg,
  type VehicleBrandLogoKey,
} from "@/components/hero/vehicle-brand-logos";

type Props = {
  brand: HeroBrandId;
  className?: string;
};

/** Ribbon / marketing brand marks — shared SVG set with vehicle lookup cards. */
export function HeroBrandLogo({ brand, className = "hero-brand-float__svg" }: Props) {
  return (
    <VehicleBrandLogoSvg brand={brand as VehicleBrandLogoKey} className={className} />
  );
}
