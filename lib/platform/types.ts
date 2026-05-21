import type { LucideIcon } from "lucide-react";

export type MemberBenefit = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type SavedVehicle = {
  reg: string;
  makeModel: string;
  meta: string;
  motExpiresDays?: number;
  lastService?: string;
};

export type ReferralStage = "link_shared" | "registered" | "booked" | "paid";

export type ReferralRecord = {
  id: string;
  referredName: string;
  code: string;
  stage: ReferralStage;
  creditEarned: number;
  createdAt: string;
};

export type PromoType = "percent" | "credit" | "fixed";

export type PromoCode = {
  code: string;
  type: PromoType;
  value: number;
  description: string;
  expiresAt: string;
  usageCount: number;
  maxUses: number;
  revenueGenerated: number;
  active: boolean;
};

export type NotificationType =
  | "booking"
  | "repair"
  | "mot"
  | "promo"
  | "news"
  | "maintenance"
  | "seasonal";

export type PlatformNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  vehicleReg?: string;
};

export type VehicleInsight = {
  id: string;
  label: string;
  urgency: "soon" | "routine" | "monitor";
  reason: string;
};

export type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  workshopCredit: number;
  vehicles: SavedVehicle[];
  referrals: ReferralRecord[];
  redeemedPromos: string[];
  createdAt: string;
};

export type AdminAnalytics = {
  referralConversions: number;
  referralCreditsIssued: number;
  repeatCustomers: number;
  repeatRate: number;
  promoRedemptions: number;
  promoRevenue: number;
  avgLifetimeValue: number;
  topServices: { name: string; bookings: number; share: number }[];
  upcomingMotCount: number;
  activeMembers: number;
};

export type PlatformStore = {
  customer: CustomerAccount | null;
  promos: PromoCode[];
  notifications: PlatformNotification[];
  pendingReferrerCode: string | null;
  admin: AdminAnalytics;
};
