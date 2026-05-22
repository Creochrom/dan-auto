import {
  Wrench,
  Gauge,
  ShieldCheck,
  Car,
  Sparkles,
  BatteryCharging,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#ai-quote", label: "AI Quote" },
  { href: "#reviews", label: "Reviews" },
  { href: "#booking", label: "Booking" },
  { href: "#contact", label: "Contact" },
] as const;

export type Service = {
  icon: LucideIcon;
  title: string;
  description: string;
  from: string;
};

export const services: Service[] = [
  {
    icon: Wrench,
    title: "Full Service & MOT",
    description:
      "Manufacturer-grade servicing with digital health reports and same-day MOT slots.",
    from: "£149",
  },
  {
    icon: Gauge,
    title: "Performance Diagnostics",
    description:
      "Advanced OBD scanning, DPF regeneration, and EV battery health analysis.",
    from: "£89",
  },
  {
    icon: ShieldCheck,
    title: "Brakes & Safety",
    description:
      "Pads, discs, fluid flushes, and ADAS calibration — road-legal confidence.",
    from: "£120",
  },
  {
    icon: Car,
    title: "Body & Alloy Repair",
    description:
      "Smart repair, alloy refurbishment, and ceramic-ready paint correction.",
    from: "£95",
  },
  {
    icon: Sparkles,
    title: "Detailing Studio",
    description:
      "Interior ozone treatment, machine polish, and long-life ceramic coatings.",
    from: "£75",
  },
  {
    icon: BatteryCharging,
    title: "Hybrid & EV Care",
    description:
      "High-voltage safe servicing, charging diagnostics, and battery conditioning.",
    from: "£110",
  },
];

export const reviews = [
  {
    name: "James Mitchell",
    vehicle: "Tesla Model 3",
    rating: 5,
    text: "Booked online at 9pm, car in by 8am. Transparent pricing, spotless workshop, and they sent a video walkthrough of every check.",
  },
  {
    name: "Sarah Okonkwo",
    vehicle: "BMW 320d",
    rating: 5,
    text: "Finally a garage that feels premium. The AI quote matched the final invoice within £12. Exceptional communication throughout.",
  },
  {
    name: "David Chen",
    vehicle: "Audi Q5",
    rating: 5,
    text: "MOT and service done while I worked remotely in their lounge. Sticky-free, honest, and genuinely fast turnaround.",
  },
  {
    name: "Emma Walsh",
    vehicle: "Mercedes C-Class",
    rating: 5,
    text: "Alloy refurb looks factory fresh. The team explained everything without jargon. Dan Auto Centre is now our family garage.",
  },
];

export const timeSlots = [
  "08:00",
  "09:30",
  "11:00",
  "13:00",
  "14:30",
  "16:00",
];
