import type { ComponentType, ReactNode, SVGProps } from "react";

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
  | "porsche";

type LogoProps = SVGProps<SVGSVGElement> & { title: string };

function BrandSvg({
  title,
  viewBox = "0 0 48 48",
  children,
  ...props
}: LogoProps & { children: ReactNode }) {
  return (
    <svg viewBox={viewBox} fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      {children}
    </svg>
  );
}

/** BMW roundel — quadrant fill */
function BmwLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 4a20 20 0 0 1 20 20H24V4Z" fill="currentColor" />
      <path d="M24 44a20 20 0 0 1-20-20h20v20Z" fill="currentColor" />
    </BrandSvg>
  );
}

/** Audi — four rings */
function AudiLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 64 24" {...props}>
      {[10, 22, 34, 46].map((cx) => (
        <circle key={cx} cx={cx} cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      ))}
    </BrandSvg>
  );
}

/** Mercedes-Benz — three-point star in ring */
function MercedesLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M24 9l2.8 8.6h9.1L27.4 24l2.8 8.6L24 30.2l-6.2 5.1 2.8-8.6-8.7-6.4h9.1L24 9Z"
        fill="currentColor"
      />
    </BrandSvg>
  );
}

/** Volkswagen — stacked V / W in circle */
function VolkswagenLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 18V14l8-5 8 5v4l-8 4.5L16 18Zm3-2.2 5 2.8 5-2.8-5-2.7-5 2.7Z"
        fill="currentColor"
      />
      <path
        d="M17 28l7-4 7 4v-3l-7-4-7 4v3Z"
        fill="currentColor"
        opacity="0.92"
      />
    </BrandSvg>
  );
}

/** Vauxhall — griffin / lightning crest */
function VauxhallLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M24 10v22M17 16c2.5-3 4.5-4.5 7-4.5s4.5 1.5 7 4.5M17 32c2.5 3 4.5 4.5 7 4.5s4.5-1.5 7-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M20 14h8l-4 8-4-8Z" fill="currentColor" />
    </BrandSvg>
  );
}

/** Ford — oval with script band */
function FordLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 56 32" {...props}>
      <ellipse cx="28" cy="16" rx="26" ry="13.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M11 17.5c2.2-5.5 7.5-8.5 17-8.5s14.8 3 17 8.5c-2.5 4.5-7.8 7-17 7s-14.5-2.5-17-7Z"
        fill="currentColor"
      />
      <path
        d="M18 16.5c1.2 2.5 4.2 4 10 4s8.8-1.5 10-4c-1.2-2.5-4.2-4.2-10-4.2s-8.8 1.7-10 4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.35"
      />
    </BrandSvg>
  );
}

/** Toyota — three-oval emblem */
function ToyotaLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 48 32" {...props}>
      <ellipse cx="24" cy="16" rx="19" ry="11.5" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="24" cy="16" rx="9.5" ry="5.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M24 4.5v23" stroke="currentColor" strokeWidth="1.6" />
    </BrandSvg>
  );
}

/** Nissan — ring with horizontal bar */
function NissanLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
      <path d="M6 24h36" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </BrandSvg>
  );
}

/** Honda — H mark */
function HondaLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <rect x="10" y="10" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M18 14v20M30 14v20M18 24h12"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </BrandSvg>
  );
}

/** Peugeot — lion shield silhouette */
function PeugeotLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <path
        d="M24 6l14 6v12c0 8-6 14-14 18-8-4-14-10-14-18V12l14-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M20 16c0-2 2-4 4-4s4 2 4 4v6c-1 2-2 4-4 4s-3-2-4-4v-6Z"
        fill="currentColor"
      />
      <path d="M24 12v2M22 28h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </BrandSvg>
  );
}

/** Renault — diamond */
function RenaultLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <path
        d="M24 6 38 24 24 42 10 24 24 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M24 14v20M14 24h20" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    </BrandSvg>
  );
}

/** Kia — wordmark in ellipse */
function KiaLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 56 32" {...props}>
      <ellipse cx="28" cy="16" rx="26" ry="13" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14 20V12h5l4 5V12h5v8h-4.5l-5-5.5V20H14Zm16.5 0V12H38c2 0 3.5 1.2 3.5 3s-1 2.8-2.5 3.2L42 20h-5l-3.5-4.2V20h-3Z"
        fill="currentColor"
      />
    </BrandSvg>
  );
}

/** Hyundai — slanted H in oval */
function HyundaiLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 56 32" {...props}>
      <ellipse cx="28" cy="16" rx="26" ry="13" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 22V10l6 12 6-12v12M34 10h5c3 0 5 2 5 5s-2 5-5 5h-5V10Zm5 7c1.2 0 2-.8 2-2s-.8-2-2-2h-2v4h2Z"
        fill="currentColor"
      />
    </BrandSvg>
  );
}

/** Skoda — winged arrow in circle */
function SkodaLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 24h18l8-6-8-6H12l6 6-6 6Z"
        fill="currentColor"
      />
      <path d="M30 18l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </BrandSvg>
  );
}

/** SEAT — stylised S */
function SeatLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} {...props}>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M30 14c-6-4-14-1-14 6 0 5 6 6 10 4 4 14 7 14 12 0 7-10 10-16 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </BrandSvg>
  );
}

/** MINI — winged badge */
function MiniLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 64 32" {...props}>
      <path
        d="M8 16c0-5 6-9 14-9h20c8 0 14 4 14 9s-6 9-14 9H22c-8 0-14-4-14-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M22 12h20M22 20h20M32 12v8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 16c3-2 6-3 8-3M60 16c-3-2-6-3-8-3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </BrandSvg>
  );
}

/** Land Rover — oval badge */
function LandRoverLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 72 28" {...props}>
      <ellipse cx="36" cy="14" rx="34" ry="12" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14 14h44M22 10v8M50 10v8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </BrandSvg>
  );
}

/** Lexus — L in oval */
function LexusLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 56 32" {...props}>
      <ellipse cx="28" cy="16" rx="26" ry="13" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 22V10h14v4H20v8H16Zm18-12h6c3 0 5 2.2 5 5.5S43 21 40 21h-6V10Z"
        fill="currentColor"
      />
    </BrandSvg>
  );
}

/** Porsche — crest shield */
function PorscheLogo({ title, ...props }: LogoProps) {
  return (
    <BrandSvg title={title} viewBox="0 0 40 48" {...props}>
      <path
        d="M20 3 36 11v11c0 9-6 17-16 23C10 38 4 30 4 22V11l16-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M20 12v16M14 20h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 18h16M12 22h16"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.55"
      />
    </BrandSvg>
  );
}

export const VEHICLE_BRAND_LOGOS: Record<
  VehicleBrandLogoKey,
  ComponentType<LogoProps>
> = {
  bmw: BmwLogo,
  audi: AudiLogo,
  mercedes: MercedesLogo,
  volkswagen: VolkswagenLogo,
  vauxhall: VauxhallLogo,
  ford: FordLogo,
  toyota: ToyotaLogo,
  nissan: NissanLogo,
  honda: HondaLogo,
  peugeot: PeugeotLogo,
  renault: RenaultLogo,
  kia: KiaLogo,
  hyundai: HyundaiLogo,
  skoda: SkodaLogo,
  seat: SeatLogo,
  mini: MiniLogo,
  "land-rover": LandRoverLogo,
  lexus: LexusLogo,
  porsche: PorscheLogo,
};

export function VehicleBrandLogoSvg({
  brand,
  className,
}: {
  brand: VehicleBrandLogoKey;
  className?: string;
}) {
  const Logo = VEHICLE_BRAND_LOGOS[brand];
  const label = brand.replace(/-/g, " ");
  return <Logo className={className} title={`${label} logo`} />;
}
