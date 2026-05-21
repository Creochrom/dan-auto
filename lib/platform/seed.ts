import type { AdminAnalytics, PromoCode } from "./types";

export const REFERRAL_CREDIT_GBP = 5;

export const DEFAULT_PROMOS: PromoCode[] = [
  {
    code: "WELCOME5",
    type: "credit",
    value: 5,
    description: "£5 workshop credit for new members",
    expiresAt: "2026-12-31",
    usageCount: 42,
    maxUses: 500,
    revenueGenerated: 2840,
    active: true,
  },
  {
    code: "MOT2026",
    type: "percent",
    value: 10,
    description: "10% off MOT when booked online",
    expiresAt: "2026-06-30",
    usageCount: 28,
    maxUses: 200,
    revenueGenerated: 1560,
    active: true,
  },
  {
    code: "BMWFREECHECK",
    type: "credit",
    value: 0,
    description: "Free BMW/MINI diagnostic health check",
    expiresAt: "2026-09-30",
    usageCount: 15,
    maxUses: 100,
    revenueGenerated: 890,
    active: true,
  },
];

export const SEED_ADMIN_ANALYTICS: AdminAnalytics = {
  referralConversions: 34,
  referralCreditsIssued: 340,
  repeatCustomers: 186,
  repeatRate: 62,
  promoRedemptions: 85,
  promoRevenue: 5290,
  avgLifetimeValue: 428,
  topServices: [
    { name: "MOT", bookings: 312, share: 28 },
    { name: "Full service", bookings: 248, share: 22 },
    { name: "Diagnostics", bookings: 176, share: 16 },
    { name: "Brakes", bookings: 134, share: 12 },
    { name: "Clutches", bookings: 89, share: 8 },
  ],
  upcomingMotCount: 47,
  activeMembers: 214,
};
