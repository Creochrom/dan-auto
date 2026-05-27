"use client";

import type { SVGProps } from "react";
import { Car } from "lucide-react";
import { HeroBrandLogo } from "@/components/hero/HeroBrandLogos";
import {
  isHeroBrandId,
  resolveVehicleBrandIcon,
} from "@/lib/vehicleBrandIcons";

type LogoProps = SVGProps<SVGSVGElement> & { title: string };

function VauxhallLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 10v28M14 18c3-4 7-6 10-6s7 2 10 6M14 30c3 4 7 6 10 6s7-2 10-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FordLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 48 32" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <ellipse cx="24" cy="16" rx="22" ry="13" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 16c4-6 10-9 16-9s12 3 16 9c-4 6-10 9-16 9S12 22 8 16z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function NissanLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" />
      <path d="M24 8v32M8 24h32" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function HondaLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path
        d="M24 6c10 0 18 8 18 18H6c0-10 8-18 18-18z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 24h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  makeModel: string;
  className?: string;
};

export function VehicleBrandIcon({ makeModel, className = "" }: Props) {
  const brand = resolveVehicleBrandIcon(makeModel);
  const logoClass = `hero-vehicle-info-card__brand-logo ${className}`.trim();

  if (brand && isHeroBrandId(brand)) {
    return <HeroBrandLogo brand={brand} className={logoClass} />;
  }

  if (brand === "vauxhall") {
    return <VauxhallLogo className={logoClass} title="Vauxhall logo" />;
  }
  if (brand === "ford") {
    return <FordLogo className={logoClass} title="Ford logo" />;
  }
  if (brand === "nissan") {
    return <NissanLogo className={logoClass} title="Nissan logo" />;
  }
  if (brand === "honda") {
    return <HondaLogo className={logoClass} title="Honda logo" />;
  }

  return <Car className={`hero-vehicle-info-card__icon-svg ${className}`.trim()} aria-hidden />;
}
