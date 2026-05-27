import type { JSX, SVGProps } from "react";
import { HERO_BRANDS, type HeroBrandId } from "@/lib/hero-content";

type LogoProps = SVGProps<SVGSVGElement> & {
  title: string;
};

function BmwLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M24 2v44M2 24h44M8.5 8.5l31 31M39.5 8.5l-31 31" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function AudiLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 80 24" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      {[14, 30, 46, 62].map((cx) => (
        <circle key={cx} cx={cx} cy="12" r="10" stroke="currentColor" strokeWidth="2.2" />
      ))}
    </svg>
  );
}

function MercedesLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 8l3.2 9.8h10.4L29 24.6l3.2 9.8L24 33.6l-8.2 6.8 3.2-9.8-8.6-6.8h10.4L24 8z"
        fill="currentColor"
      />
    </svg>
  );
}

function VwLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 30c2-6 5-9 8-9s6 3 8 9M14 22c3-8 7-12 10-12s7 4 10 12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 64 32" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path
        d="M8 16c0-6 6-10 14-10h20c8 0 14 4 14 10s-6 10-14 10H22c-8 0-14-4-14-10z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M22 12h20M22 20h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LandRoverLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 80 28" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <ellipse cx="40" cy="14" rx="38" ry="12" stroke="currentColor" strokeWidth="2" />
      <path
        d="M18 14h44M26 10v8M54 10v8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PorscheLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 40 48" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path
        d="M20 2l16 8v12c0 10-7 18-16 26C11 40 4 32 4 22V10l16-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M20 14v14M14 20h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ToyotaLogo({ title, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 48 32" fill="none" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <ellipse cx="24" cy="16" rx="20" ry="12" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="24" cy="16" rx="10" ry="6" stroke="currentColor" strokeWidth="2" />
      <path d="M24 4v24" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const LOGOS: Record<HeroBrandId, (props: LogoProps) => JSX.Element> = {
  bmw: BmwLogo,
  audi: AudiLogo,
  mercedes: MercedesLogo,
  volkswagen: VwLogo,
  mini: MiniLogo,
  "land-rover": LandRoverLogo,
  porsche: PorscheLogo,
  toyota: ToyotaLogo,
};

type Props = {
  brand: HeroBrandId;
  className?: string;
};

export function HeroBrandLogo({ brand, className = "hero-brand-float__svg" }: Props) {
  const label = HERO_BRANDS.find((b) => b.id === brand)?.label ?? brand.replace(/-/g, " ");
  const title = `${label} logo`;
  const Logo = LOGOS[brand];
  return <Logo className={className} title={title} />;
}
