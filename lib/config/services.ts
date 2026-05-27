/**
 * Workshop services & MOT eligibility policy.
 * `siteServices` is the single source for marketing cards and booking labels.
 */

import type { LucideIcon } from "lucide-react";
import {
  Car,
  CircleDot,
  ClipboardCheck,
  Cog,
  Disc,
  Gauge,
  Settings2,
  Timer,
  Wind,
  Wrench,
} from "lucide-react";

export type SiteService = {
  icon: LucideIcon;
  title: string;
  description: string;
  from: string;
  duration: string;
  tag?: string;
  /** Value used in booking forms and deep links (e.g. hero → #booking). */
  bookLabel: string;
};

export const siteServices: SiteService[] = [
  {
    icon: ClipboardCheck,
    title: "MOT Testing",
    description:
      "Comprehensive MOT to meet safety and environmental standards. Pre-check available so you pass first time.",
    from: "£54.85",
    duration: "45–60 min",
    tag: "Book online",
    bookLabel: "MOT",
  },
  {
    icon: Gauge,
    title: "Vehicle Diagnostics",
    description:
      "Check engine light? Our diagnostics team finds faults fast with dealer-level scan tools and clear reports.",
    from: "Quote",
    duration: "1–2 hrs",
    tag: "Call team",
    bookLabel: "Diagnostics",
  },
  {
    icon: Wind,
    title: "DPF Deep Clean",
    description:
      "Full dismantle and deep-clean of diesel particulate filters — not a quick in-situ pressure blast.",
    from: "£299",
    duration: "1–2 days",
    tag: "Premium",
    bookLabel: "DPF cleaning",
  },
  {
    icon: Settings2,
    title: "Car Servicing",
    description:
      "Basic, full, and major servicing for cars and vans — routine maintenance to protect your engine.",
    from: "Quote",
    duration: "2–5 hrs",
    bookLabel: "Servicing — full",
  },
  {
    icon: Disc,
    title: "Brakes",
    description:
      "Expert brake inspections, repairs, and replacements so your car stops safely every time.",
    from: "Quote",
    duration: "2–3 hrs",
    bookLabel: "Brakes",
  },
  {
    icon: Cog,
    title: "Clutches",
    description:
      "Clutch diagnosis and replacement — smooth gear changes, same-day turnaround on many vehicles.",
    from: "Quote",
    duration: "1 day",
    bookLabel: "Clutches",
  },
  {
    icon: Timer,
    title: "Timing Belts",
    description:
      "Cambelt / timing belt replacement and inspection to prevent costly engine damage.",
    from: "Quote",
    duration: "Half–1 day",
    bookLabel: "Timing belt / cambelt",
  },
  {
    icon: CircleDot,
    title: "Tyres",
    description:
      "Tyre supply, fitting, and safety checks — keep grip and compliance on Southampton roads.",
    from: "Quote",
    duration: "30–60 min",
    bookLabel: "Tyres",
  },
  {
    icon: Wind,
    title: "Air Conditioning",
    description:
      "A/C recharge, leak testing, and repairs — stay cool and comfortable year-round.",
    from: "Quote",
    duration: "1 hr",
    bookLabel: "Air conditioning",
  },
  {
    icon: Car,
    title: "Exhaust Repairs",
    description:
      "Exhaust system repairs and replacements — reduce noise, emissions, and MOT failures.",
    from: "Quote",
    duration: "1–3 hrs",
    bookLabel: "Exhaust repair",
  },
  {
    icon: Wrench,
    title: "General Repairs",
    description:
      "From oil changes to complex faults — honest quotes, quality parts, cars and vans welcome.",
    from: "Quote",
    duration: "Varies",
    bookLabel: "General repair",
  },
];

export const bookingServiceOptions = siteServices.map((s) => s.bookLabel);

/** Extended list for the workshop estimate / quote selector. */
export const quoteServiceOptions = [
  "MOT",
  "Air conditioning",
  "Servicing — basic",
  "Servicing — full",
  "Servicing — major",
  "Brakes",
  "Clutches",
  "Timing belt / cambelt",
  "Tyres",
  "Diagnostics",
  "Exhaust repair",
  "General repair",
  "DPF cleaning",
] as const;

export const workshopServices = [
  {
    id: "mot",
    name: "MOT Testing",
    description: "Comprehensive MOT testing for eligible passenger vehicles.",
    motEligible: true,
  },
  {
    id: "diagnostics",
    name: "Diagnostics",
    description: "Dealer-grade fault finding and AI-assisted reporting.",
    motEligible: false,
  },
  {
    id: "brakes",
    name: "Brake Repairs",
    description: "Pads, discs, fluid, and safety inspections.",
    motEligible: false,
  },
  {
    id: "servicing",
    name: "Servicing",
    description: "Interim and full manufacturer-schedule servicing.",
    motEligible: false,
  },
  {
    id: "dpf",
    name: "DPF Cleaning",
    description: "Professional diesel particulate filter cleaning.",
    motEligible: false,
  },
] as const;

export const motPolicy = {
  title: "Standard passenger vehicles only",
  eligible: [
    "Standard cars and passenger vehicles",
    "Private use vehicles within standard MOT class",
  ],
  notEligible: [
    "Vans and light commercial vehicles",
    "Class 4 commercial MOT vehicles",
    "Heavy commercial or specialist fleet vehicles",
  ],
  advisory:
    "Unsure if we can MOT your vehicle? Message us on WhatsApp or use the AI assistant before booking.",
} as const;

export const bookingDurations = [
  { value: "1h", label: "Up to 1 hour" },
  { value: "2h", label: "Up to 2 hours" },
  { value: "half-day", label: "Half day" },
  { value: "full-day", label: "Full day" },
] as const;

export const bookingTimeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

/** Half-hour grid for online booking intake */
export const bookingTimeSlotsDetailed = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
] as const;
