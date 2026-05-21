import type { LucideIcon } from "lucide-react";
import {
  Award,
  ClipboardCheck,
  CircleDot,
  Cpu,
  Disc,
  Gauge,
  Settings2,
  ShieldCheck,
  Snowflake,
  Star,
  Truck,
  Users,
  Wind,
  Wrench,
} from "lucide-react";

export type HeroServiceCard = {
  icon: LucideIcon;
  title: string;
  hint: string;
  description: string;
  bookLabel: string;
};

export const HERO_SERVICE_CARDS: readonly HeroServiceCard[] = [
  {
    icon: ClipboardCheck,
    title: "MOT Testing",
    hint: "From £45",
    description:
      "DVSA-approved MOT with pre-check guidance. Same-day slots and clear advisory reports.",
    bookLabel: "MOT",
  },
  {
    icon: Gauge,
    title: "Diagnostics",
    hint: "Dealer-level",
    description:
      "Manufacturer-grade scan tools, live data, and AI-assisted fault interpretation.",
    bookLabel: "Diagnostics",
  },
  {
    icon: Disc,
    title: "Brake Repairs",
    hint: "Same-day",
    description:
      "Pads, discs, fluid, and calipers — inspected and replaced to OE standards.",
    bookLabel: "Brakes",
  },
  {
    icon: Settings2,
    title: "Servicing",
    hint: "All makes",
    description:
      "Interim, full, and major services with genuine or premium-grade parts.",
    bookLabel: "Servicing — full",
  },
  {
    icon: Wind,
    title: "DPF Cleaning",
    hint: "Deep clean",
    description:
      "Professional DPF removal and deep clean — not a quick pressure flush.",
    bookLabel: "DPF Deep Clean",
  },
  {
    icon: Snowflake,
    title: "Air Con Service",
    hint: "Regas & leak",
    description:
      "Air conditioning regas, leak detection, and cabin filter replacement.",
    bookLabel: "Air Conditioning",
  },
  {
    icon: CircleDot,
    title: "Suspension",
    hint: "Precision",
    description:
      "Bushings, arms, shocks, and alignment — restored ride quality and safety.",
    bookLabel: "Suspension",
  },
  {
    icon: Wrench,
    title: "Full Repairs",
    hint: "Workshop",
    description:
      "From clutches to engine management — dealer-level repairs without dealer prices.",
    bookLabel: "General repair",
  },
] as const;

export type HeroTrustBadge = {
  icon: LucideIcon;
  primary: string;
  secondary: string;
};

export function buildHeroTrustBadges(opts: {
  experience: string;
  googleRating: string;
  googleReviewCount: string;
}): HeroTrustBadge[] {
  return [
    {
      icon: Award,
      primary: `${opts.experience} Years`,
      secondary: "Experience",
    },
    {
      icon: Star,
      primary: `${opts.googleRating} ★ Google`,
      secondary: "Rating",
    },
    {
      icon: Users,
      primary: `${opts.googleReviewCount}+ Happy`,
      secondary: "Customers",
    },
    {
      icon: Cpu,
      primary: "Dealer Level",
      secondary: "Equipment",
    },
    {
      icon: ShieldCheck,
      primary: "12 Months",
      secondary: "Warranty",
    },
    {
      icon: Truck,
      primary: "Collection &",
      secondary: "Delivery",
    },
  ];
}
