import { DEFAULT_PROMOS, REFERRAL_CREDIT_GBP, SEED_ADMIN_ANALYTICS } from "./seed";
import type {
  CustomerAccount,
  PlatformNotification,
  PlatformStore,
  PromoCode,
  ReferralRecord,
  ReferralStage,
  SavedVehicle,
} from "./types";

const STORAGE_KEY = "dan_auto_platform_v1";
const PENDING_REF_KEY = "dan_auto_pending_ref";

function slugId(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base || "member"}${suffix}`;
}

export function buildDefaultNotifications(vehicle?: SavedVehicle): PlatformNotification[] {
  const reg = vehicle?.reg ?? "your vehicle";
  const motDays = vehicle?.motExpiresDays;
  const now = new Date().toISOString();

  const list: PlatformNotification[] = [
    {
      id: "n-welcome",
      type: "news",
      title: "Welcome to Dan Auto member hub",
      body: "Track repairs, save vehicles, and earn referral rewards on every booking.",
      read: false,
      createdAt: now,
    },
    {
      id: "n-promo",
      type: "promo",
      title: "Member offer: WELCOME5",
      body: "Apply WELCOME5 at checkout for £5 workshop credit on your next visit.",
      read: false,
      createdAt: now,
    },
  ];

  if (vehicle) {
    list.push({
      id: "n-booking",
      type: "booking",
      title: "Faster rebooking enabled",
      body: `${reg} is saved — one-tap booking for MOT and servicing.`,
      read: false,
      createdAt: now,
      vehicleReg: vehicle.reg,
    });
    if (motDays !== undefined && motDays < 45) {
      list.push({
        id: "n-mot",
        type: "mot",
        title: "MOT reminder",
        body: `${vehicle.makeModel} (${reg}) — MOT due in ${motDays} days. Book your bay online.`,
        read: false,
        createdAt: now,
        vehicleReg: vehicle.reg,
      });
    }
    list.push({
      id: "n-maint",
      type: "maintenance",
      title: "AI maintenance insight",
      body: `Garage Intelligence flagged items for your ${vehicle.makeModel}. Review recommendations below.`,
      read: false,
      createdAt: now,
      vehicleReg: vehicle.reg,
    });
    list.push({
      id: "n-season",
      type: "seasonal",
      title: "Seasonal tip: battery & tyres",
      body: `Cold mornings stress batteries. We recommend a health check for ${reg} before winter.`,
      read: false,
      createdAt: now,
      vehicleReg: vehicle.reg,
    });
  }

  return list;
}

export function getReferralLink(customerId: string) {
  if (typeof window === "undefined") {
    return `https://danauto.co.uk/ref/${customerId}`;
  }
  return `${window.location.origin}/ref/${customerId}`;
}

export function loadPlatformStore(): PlatformStore {
  if (typeof window === "undefined") {
    return {
      customer: null,
      promos: DEFAULT_PROMOS,
      notifications: [],
      pendingReferrerCode: null,
      admin: SEED_ADMIN_ANALYTICS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const pending = sessionStorage.getItem(PENDING_REF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlatformStore;
      return {
        ...parsed,
        promos: parsed.promos?.length ? parsed.promos : DEFAULT_PROMOS,
        admin: { ...SEED_ADMIN_ANALYTICS, ...parsed.admin },
        pendingReferrerCode: pending ?? parsed.pendingReferrerCode ?? null,
      };
    }
  } catch {
    /* ignore */
  }

  return {
    customer: null,
    promos: [...DEFAULT_PROMOS],
    notifications: [],
    pendingReferrerCode: sessionStorage.getItem(PENDING_REF_KEY),
    admin: { ...SEED_ADMIN_ANALYTICS },
  };
}

export function savePlatformStore(store: PlatformStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function setPendingReferrer(code: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_REF_KEY, code);
}

export function clearPendingReferrer() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_REF_KEY);
}

export function createCustomer(
  name: string,
  email: string,
  vehicle?: SavedVehicle,
  referrerId?: string | null
): CustomerAccount {
  const id = slugId(name);
  const referralCode = `DAN-${id.toUpperCase().slice(0, 8)}`;
  const referrals: ReferralRecord[] = [];

  if (referrerId) {
    referrals.push({
      id: `ref-${Date.now()}`,
      referredName: "You (referred signup)",
      code: referrerId,
      stage: "registered",
      creditEarned: 0,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    id,
    name,
    email,
    referralCode,
    workshopCredit: referrerId ? 0 : 0,
    vehicles: vehicle ? [vehicle] : [],
    referrals,
    redeemedPromos: [],
    createdAt: new Date().toISOString(),
  };
}

export function advanceReferralStage(
  customer: CustomerAccount,
  referralId: string,
  stage: ReferralStage
): CustomerAccount {
  const referrals = customer.referrals.map((r) => {
    if (r.id !== referralId) return r;
    const credit =
      stage === "paid" ? REFERRAL_CREDIT_GBP : r.creditEarned;
    return { ...r, stage, creditEarned: credit };
  });

  const paidCount = referrals.filter((r) => r.stage === "paid").length;
  const prevPaid = customer.referrals.filter((r) => r.stage === "paid").length;
  const extraCredit =
    stage === "paid" && paidCount > prevPaid ? REFERRAL_CREDIT_GBP : 0;

  return {
    ...customer,
    referrals,
    workshopCredit: customer.workshopCredit + extraCredit,
  };
}

export function addSimulatedReferral(customer: CustomerAccount): CustomerAccount {
  const stages: ReferralStage[] = ["link_shared", "registered", "booked", "paid"];
  const stage = stages[Math.floor(Math.random() * stages.length)];
  const record: ReferralRecord = {
    id: `ref-${Date.now()}`,
    referredName: `Friend ${customer.referrals.length + 1}`,
    code: customer.referralCode,
    stage,
    creditEarned: stage === "paid" ? REFERRAL_CREDIT_GBP : 0,
    createdAt: new Date().toISOString(),
  };
  let next = { ...customer, referrals: [...customer.referrals, record] };
  if (stage === "paid") {
    next = {
      ...next,
      workshopCredit: next.workshopCredit + REFERRAL_CREDIT_GBP,
    };
  }
  return next;
}

export function validatePromo(
  promos: PromoCode[],
  code: string
): { ok: true; promo: PromoCode } | { ok: false; error: string } {
  const normalized = code.trim().toUpperCase();
  const promo = promos.find((p) => p.code === normalized);
  if (!promo) return { ok: false, error: "Promo code not recognised." };
  if (!promo.active) return { ok: false, error: "This promo is no longer active." };
  if (new Date(promo.expiresAt) < new Date()) {
    return { ok: false, error: "This promo has expired." };
  }
  if (promo.usageCount >= promo.maxUses) {
    return { ok: false, error: "This promo has reached its usage limit." };
  }
  return { ok: true, promo };
}

export function redeemPromo(
  store: PlatformStore,
  code: string,
  customer: CustomerAccount
): { store: PlatformStore; customer: CustomerAccount; message: string } {
  const result = validatePromo(store.promos, code);
  if (!result.ok) return { store, customer, message: result.error };
  if (customer.redeemedPromos.includes(result.promo.code)) {
    return { store, customer, message: "You have already used this promo." };
  }

  const promos = store.promos.map((p) =>
    p.code === result.promo.code
      ? {
          ...p,
          usageCount: p.usageCount + 1,
          revenueGenerated:
            p.revenueGenerated + (p.type === "credit" ? p.value * 10 : 65),
        }
      : p
  );

  let workshopCredit = customer.workshopCredit;
  let message = `Promo ${result.promo.code} applied.`;

  if (result.promo.type === "credit") {
    workshopCredit += result.promo.value;
    message =
      result.promo.value > 0
        ? `£${result.promo.value} workshop credit added to your account.`
        : result.promo.description;
  } else if (result.promo.type === "percent") {
    message = `${result.promo.value}% discount will apply at checkout.`;
  } else {
    workshopCredit += result.promo.value;
    message = `£${result.promo.value} discount credit added.`;
  }

  const admin = {
    ...store.admin,
    promoRedemptions: store.admin.promoRedemptions + 1,
    promoRevenue:
      store.admin.promoRevenue +
      (result.promo.type === "credit" ? result.promo.value * 8 : 72),
  };

  return {
    store: { ...store, promos, admin },
    customer: {
      ...customer,
      workshopCredit,
      redeemedPromos: [...customer.redeemedPromos, result.promo.code],
    },
    message,
  };
}

export function createPromo(
  promos: PromoCode[],
  input: Omit<PromoCode, "usageCount" | "revenueGenerated">
): PromoCode[] {
  if (promos.some((p) => p.code === input.code.toUpperCase())) {
    return promos;
  }
  return [
    ...promos,
    {
      ...input,
      code: input.code.toUpperCase(),
      usageCount: 0,
      revenueGenerated: 0,
    },
  ];
}

export function markNotificationRead(
  notifications: PlatformNotification[],
  id: string
) {
  return notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
}

export function syncAdminFromCustomer(
  admin: PlatformStore["admin"],
  customer: CustomerAccount | null,
  promos: PromoCode[]
): PlatformStore["admin"] {
  const paidReferrals =
    customer?.referrals.filter((r) => r.stage === "paid").length ?? 0;
  return {
    ...admin,
    referralConversions: SEED_ADMIN_ANALYTICS.referralConversions + paidReferrals,
    referralCreditsIssued:
      SEED_ADMIN_ANALYTICS.referralCreditsIssued +
      paidReferrals * REFERRAL_CREDIT_GBP * 2,
    promoRedemptions: promos.reduce((a, p) => a + p.usageCount, 0),
    promoRevenue: promos.reduce((a, p) => a + p.revenueGenerated, 0),
    activeMembers: customer
      ? SEED_ADMIN_ANALYTICS.activeMembers + 1
      : SEED_ADMIN_ANALYTICS.activeMembers,
  };
}
