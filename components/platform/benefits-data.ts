import {
  Bell,
  Bot,
  CalendarClock,
  ClipboardList,
  FileText,
  Gauge,
  Gift,
  History,
  Percent,
  Radio,
  Users,
  type LucideIcon,
} from "lucide-react";

export type BenefitItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const MEMBER_BENEFITS: BenefitItem[] = [
  {
    id: "progress",
    title: "Live repair progress",
    description: "Follow your vehicle on the ramp with real-time workshop status updates.",
    icon: Radio,
  },
  {
    id: "history",
    title: "Service history",
    description: "Full digital record of MOTs, services, and repairs in one place.",
    icon: History,
  },
  {
    id: "mot",
    title: "MOT reminders",
    description: "Never miss an MOT — alerts before your due date with one-tap booking.",
    icon: Bell,
  },
  {
    id: "ai",
    title: "AI maintenance tips",
    description: "Personalised recommendations based on your make, mileage, and advisories.",
    icon: Bot,
  },
  {
    id: "booking",
    title: "Faster bookings",
    description: "Saved vehicles, preferred slots, and pre-filled details every visit.",
    icon: CalendarClock,
  },
  {
    id: "discounts",
    title: "Member discounts",
    description: "Exclusive promo codes and seasonal offers for registered customers.",
    icon: Percent,
  },
  {
    id: "updates",
    title: "Workshop updates",
    description: "Promotions, bay availability, and news from Dan Auto Centre.",
    icon: ClipboardList,
  },
  {
    id: "referral",
    title: "Referral rewards",
    description: "Share your link — you and your friend each earn £5 workshop credit.",
    icon: Users,
  },
  {
    id: "garage",
    title: "Garage Intelligence",
    description: "AI-powered insights for brake fluid, DPF, battery, and more.",
    icon: Gauge,
  },
  {
    id: "invoices",
    title: "Saved vehicles & invoices",
    description: "Download invoices and manage multiple cars from your dashboard.",
    icon: FileText,
  },
  {
    id: "gifts",
    title: "Loyalty credits",
    description: "Workshop credit balance grows with referrals and promotions.",
    icon: Gift,
  },
];
