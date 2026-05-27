"use client";

import { Car } from "lucide-react";
import { VehicleBrandLogoSvg } from "@/components/hero/vehicle-brand-logos";
import { resolveVehicleBrandIcon } from "@/lib/vehicleBrandIcons";

type Props = {
  makeModel: string;
  className?: string;
};

export function VehicleBrandIcon({ makeModel, className = "" }: Props) {
  const brand = resolveVehicleBrandIcon(makeModel);
  const logoClass = `hero-vehicle-info-card__brand-logo ${className}`.trim();

  if (brand) {
    return <VehicleBrandLogoSvg brand={brand} className={logoClass} />;
  }

  return <Car className={`hero-vehicle-info-card__icon-svg ${className}`.trim()} aria-hidden />;
}
