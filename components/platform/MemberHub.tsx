"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Bot,
  Check,
  Copy,
  Gift,
  Link2,
  Loader2,
  Share2,
  Sparkles,
  Tag,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { BookVisitLink } from "@/features/booking/components/BookVisitLink";
import { generateGarageInsights } from "@/lib/platform/insights";
import { REFERRAL_CREDIT_GBP } from "@/lib/platform/seed";
import {
  addSimulatedReferral,
  advanceReferralStage,
  buildDefaultNotifications,
  clearPendingReferrer,
  createCustomer,
  getReferralLink,
  loadPlatformStore,
  markNotificationRead,
  redeemPromo,
  savePlatformStore,
  syncAdminFromCustomer,
} from "@/lib/platform/store";
import { CustomerQuoteApproval } from "./CustomerQuoteApproval";
import type { CustomerAccount, PlatformNotification, SavedVehicle } from "@/lib/platform/types";

const EASE = [0.22, 1, 0.36, 1] as const;

const STAGE_LABELS: Record<string, string> = {
  link_shared: "Link shared",
  registered: "Registered",
  booked: "Booked service",
  paid: "Payment complete",
};

const NOTIF_ICONS: Record<string, string> = {
  booking: "📅",
  repair: "🔧",
  mot: "✅",
  promo: "🏷️",
  news: "📢",
  maintenance: "🤖",
  seasonal: "❄️",
};

type MemberHubProps = {
  detectedVehicle?: SavedVehicle | null;
  bookDoneTick?: number;
  focusSignup?: boolean;
};

export function MemberHub({
  detectedVehicle,
  bookDoneTick = 0,
  focusSignup = false,
}: MemberHubProps) {
  const [hydrated, setHydrated] = useState(false);
  const [store, setStore] = useState<ReturnType<typeof loadPlatformStore> | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"overview" | "referrals" | "alerts" | "insights">(
    "overview"
  );

  const customer = store?.customer ?? null;

  const persist = useCallback(
    (next: ReturnType<typeof loadPlatformStore>) => {
      const admin = syncAdminFromCustomer(next.admin, next.customer, next.promos);
      const merged = { ...next, admin };
      setStore(merged);
      savePlatformStore(merged);
    },
    []
  );

  useEffect(() => {
    setStore(loadPlatformStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (focusSignup) {
      document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [focusSignup]);

  useEffect(() => {
    if (!bookDoneTick || !customer || !store) return;
    const pending = customer.referrals.find((r) => r.stage === "booked");
    if (pending) {
      const updated = advanceReferralStage(customer, pending.id, "paid");
      persist({ ...store, customer: updated });
    }
  }, [bookDoneTick, customer, persist, store]);

  const referralLink = customer ? getReferralLink(customer.id) : "";

  const insights = useMemo(() => {
    const v = customer?.vehicles[0] ?? detectedVehicle;
    if (!v) return [];
    return generateGarageInsights(v.makeModel, v.meta, v.motExpiresDays);
  }, [customer, detectedVehicle]);

  const referralStats = useMemo(() => {
    if (!customer) return { total: 0, paid: 0, pending: 0, earned: 0 };
    const paid = customer.referrals.filter((r) => r.stage === "paid");
    return {
      total: customer.referrals.length,
      paid: paid.length,
      pending: customer.referrals.length - paid.length,
      earned: paid.length * REFERRAL_CREDIT_GBP,
    };
  }, [customer]);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !store) return;
    const pendingRef = store.pendingReferrerCode;
    const vehicle: SavedVehicle | undefined = detectedVehicle
      ? { ...detectedVehicle }
      : undefined;
    const newCustomer = createCustomer(name, email, vehicle, pendingRef);
    const notifications = [
      ...buildDefaultNotifications(vehicle),
      ...(pendingRef
        ? [
            {
              id: `ref-${Date.now()}`,
              type: "promo" as const,
              title: "Referral applied",
              body: `You joined via a friend&apos;s link — complete your first paid booking for £${REFERRAL_CREDIT_GBP} credit each.`,
              read: false,
              createdAt: new Date().toISOString(),
            },
          ]
        : []),
    ];
    clearPendingReferrer();
    persist({
      ...store,
      customer: newCustomer,
      notifications,
      pendingReferrerCode: null,
    });
    setName("");
    setEmail("");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handlePromo = () => {
    if (!customer || !store) {
      setPromoMsg({ type: "err", text: "Create an account to apply promo codes." });
      return;
    }
    const { store: nextStore, customer: nextCustomer, message } = redeemPromo(
      store,
      promoInput,
      customer
    );
    setPromoMsg({
      type: message.includes("not") || message.includes("already") ? "err" : "ok",
      text: message,
    });
    if (!message.includes("not") && !message.includes("already")) {
      persist({ ...nextStore, customer: nextCustomer });
    }
  };

  const handleSimulateReferral = () => {
    if (!customer || !store) return;
    persist({ ...store, customer: addSimulatedReferral(customer) });
  };

  const handleAdvanceReferral = (id: string, stage: "registered" | "booked" | "paid") => {
    if (!customer || !store) return;
    let updated = advanceReferralStage(customer, id, stage);
    if (stage === "paid") {
      updated = {
        ...updated,
        workshopCredit: updated.workshopCredit + REFERRAL_CREDIT_GBP,
      };
    }
    persist({ ...store, customer: updated });
  };

  if (!hydrated || !store) {
    return (
      <section id="platform" className="section-future relative py-24">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" aria-label="Loading member hub" />
        </div>
      </section>
    );
  }

  return (
    <section id="platform" className="section-future relative py-24 sm:py-32">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan/[0.04] via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <p className="eyebrow-diagnostic">Member hub</p>
          <h2 className="display-section mt-4 text-white">
            {customer ? `Welcome back, ${customer.name.split(" ")[0]}` : "Your driver dashboard"}
          </h2>
          <p className="mt-4 text-zinc-400">
            {customer
              ? "Referrals, credits, alerts, and Garage Intelligence — all in one place."
              : "Sign in to unlock referrals, promo codes, and personalised workshop alerts."}
          </p>
        </motion.div>

        {!customer ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSignup}
            className="premium-panel glow-cyan mx-auto mt-10 max-w-lg rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 border-b border-white/8 pb-4">
              <UserPlus className="h-5 w-5 text-cyan" />
              <p className="font-medium text-white">Create your account</p>
            </div>
            {store.pendingReferrerCode && (
              <p className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                Referral link detected — you&apos;ll both earn £{REFERRAL_CREDIT_GBP} after
                your first completed booking.
              </p>
            )}
            {detectedVehicle && (
              <p className="mt-4 text-sm text-zinc-400">
                Saving vehicle:{" "}
                <span className="font-medium text-white">{detectedVehicle.makeModel}</span> (
                {detectedVehicle.reg})
              </p>
            )}
            <div className="mt-5 space-y-3">
              <input
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="btn-glow mt-5 w-full rounded-full py-3.5 text-sm font-semibold text-black"
            >
              Create account
            </button>
          </motion.form>
        ) : (
          <>
            <CustomerQuoteApproval
              customerRegs={customer.vehicles.map((v) => v.reg)}
            />
            <motion.div className="mt-8 flex flex-wrap gap-2">
              {(
                [
                  ["overview", "Overview"],
                  ["referrals", "Referrals"],
                  ["alerts", "Notifications"],
                  ["insights", "Garage Intelligence"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`platform-tab rounded-full px-4 py-2 text-sm transition ${
                    tab === id
                      ? "bg-cyan/15 font-medium text-cyan ring-1 ring-cyan/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {label}
                  {id === "alerts" &&
                    store.notifications.filter((n) => !n.read).length > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan px-1.5 text-[10px] font-bold text-black">
                        {store.notifications.filter((n) => !n.read).length}
                      </span>
                    )}
                </button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {tab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 grid gap-4 lg:grid-cols-3"
                >
                  <div className="premium-card rounded-2xl p-6 lg:col-span-1">
                    <Wallet className="h-5 w-5 text-cyan" />
                    <p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">
                      Workshop credit
                    </p>
                    <p className="mt-1 text-3xl font-light text-white">
                      £{customer.workshopCredit.toFixed(2)}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Applied automatically on your next invoice
                    </p>
                  </div>
                  <div className="premium-card rounded-2xl p-6 lg:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Tag className="h-5 w-5 text-cyan" />
                        <p className="mt-3 font-medium text-white">Apply promo code</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Try WELCOME5, MOT2026, or BMWFREECHECK
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="PROMO CODE"
                        className="input-premium min-w-0 flex-1 rounded-xl px-4 py-2.5 font-mono text-sm uppercase text-white"
                      />
                      <button
                        type="button"
                        onClick={handlePromo}
                        className="btn-glow shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMsg && (
                      <p
                        className={`mt-3 text-sm ${promoMsg.type === "ok" ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {promoMsg.text}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {tab === "referrals" && (
                <motion.div
                  key="referrals"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 grid gap-4 lg:grid-cols-2"
                >
                  <div className="premium-card glow-cyan rounded-2xl p-6 sm:p-8">
                    <Gift className="h-6 w-6 text-cyan" />
                    <h3 className="mt-4 text-xl font-medium text-white">Refer & earn</h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Share your link. When they register, book, and pay — you both receive
                      £{REFERRAL_CREDIT_GBP} workshop credit.
                    </p>
                    <p className="mt-4 text-xs text-zinc-500">Your code</p>
                    <p className="font-mono text-lg font-semibold text-amber-300">
                      {customer.referralCode}
                    </p>
                    <p className="mt-4 break-all rounded-xl bg-black/40 px-4 py-3 font-mono text-xs text-cyan">
                      {referralLink}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy link"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulateReferral}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-white"
                      >
                        <Share2 className="h-4 w-4" />
                        Demo: add referral
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Referrals", value: referralStats.total },
                        { label: "Converted", value: referralStats.paid },
                        { label: "Earned", value: `£${referralStats.earned}` },
                      ].map((s) => (
                        <div key={s.label} className="stat-pill rounded-xl px-3 py-4 text-center">
                          <p className="text-xl font-light text-white">{s.value}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="premium-card rounded-2xl p-5">
                      <p className="text-sm font-medium text-white">Referral progress</p>
                      <ul className="mt-4 space-y-3">
                        {customer.referrals.length === 0 ? (
                          <li className="text-sm text-zinc-500">
                            No referrals yet — share your link to get started.
                          </li>
                        ) : (
                          customer.referrals.map((r) => (
                            <li
                              key={r.id}
                              className="rounded-xl border border-white/8 bg-black/30 p-4"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-white">
                                  {r.referredName}
                                </p>
                                <span className="text-xs text-cyan">
                                  {STAGE_LABELS[r.stage]}
                                </span>
                              </div>
                              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-dim to-cyan"
                                  style={{
                                    width: `${
                                      r.stage === "link_shared"
                                        ? 25
                                        : r.stage === "registered"
                                          ? 50
                                          : r.stage === "booked"
                                            ? 75
                                            : 100
                                    }%`,
                                  }}
                                />
                              </div>
                              {r.stage !== "paid" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdvanceReferral(
                                      r.id,
                                      r.stage === "link_shared"
                                        ? "registered"
                                        : r.stage === "registered"
                                          ? "booked"
                                          : "paid"
                                    )
                                  }
                                  className="mt-3 text-xs text-cyan hover:underline"
                                >
                                  Advance stage (demo)
                                </button>
                              )}
                              {r.creditEarned > 0 && (
                                <p className="mt-2 text-xs text-emerald-400">
                                  +£{r.creditEarned} credit earned
                                </p>
                              )}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "alerts" && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8"
                >
                  <NotificationsList
                    items={store.notifications}
                    onRead={(id) =>
                      persist({
                        ...store,
                        notifications: markNotificationRead(store.notifications, id),
                      })
                    }
                  />
                </motion.div>
              )}

              {tab === "insights" && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8"
                >
                  <GarageIntelligencePanel
                    insights={insights}
                    vehicle={customer.vehicles[0] ?? detectedVehicle}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
}

function NotificationsList({
  items,
  onRead,
}: {
  items: PlatformNotification[];
  onRead: (id: string) => void;
}) {
  return (
    <div className="premium-panel divide-y divide-white/8 overflow-hidden rounded-2xl">
      {items.length === 0 ? (
        <p className="p-8 text-center text-sm text-zinc-500">No notifications yet.</p>
      ) : (
        items.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => onRead(n.id)}
            className={`flex w-full gap-4 px-5 py-4 text-left transition hover:bg-white/[0.03] ${
              n.read ? "opacity-60" : ""
            }`}
          >
            <span className="text-xl">{NOTIF_ICONS[n.type] ?? "🔔"}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{n.title}</p>
                {!n.read && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-cyan" />
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-400">{n.body}</p>
              {n.vehicleReg && (
                <p className="mt-1 font-mono text-[10px] text-zinc-500">{n.vehicleReg}</p>
              )}
            </div>
            <Bell className="h-4 w-4 shrink-0 text-zinc-600" />
          </button>
        ))
      )}
    </div>
  );
}

function GarageIntelligencePanel({
  insights,
  vehicle,
}: {
  insights: ReturnType<typeof generateGarageInsights>;
  vehicle?: SavedVehicle | null;
}) {
  if (!vehicle) {
    return (
      <div className="premium-card rounded-2xl p-8 text-center">
        <Bot className="mx-auto h-10 w-10 text-cyan" />
        <p className="mt-4 text-white">Scan a vehicle or add one to your account</p>
        <p className="mt-2 text-sm text-zinc-500">
          Garage Intelligence uses your saved vehicle data for personalised maintenance
          advice.
        </p>
      </div>
    );
  }

  return (
    <div className="premium-card overflow-hidden rounded-2xl">
      <div className="border-b border-white/8 bg-gradient-to-r from-cyan/10 to-transparent p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/15 ring-1 ring-cyan/30">
            <Sparkles className="h-6 w-6 text-cyan" />
          </div>
          <div>
            <p className="eyebrow-diagnostic">Garage Intelligence</p>
            <h3 className="text-lg font-medium text-white">
              Your {vehicle.makeModel} may soon require
            </h3>
            <p className="text-sm text-zinc-500">{vehicle.reg} · {vehicle.meta}</p>
          </div>
        </div>
      </div>
      <ul className="divide-y divide-white/6">
        {insights.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-4 px-6 py-5 sm:px-8"
          >
            <TrendingUp
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                item.urgency === "soon"
                  ? "text-amber-400"
                  : item.urgency === "routine"
                    ? "text-cyan"
                    : "text-zinc-500"
              }`}
            />
            <div>
              <p className="font-medium text-white">{item.label}</p>
              <p className="mt-1 text-sm text-zinc-400">{item.reason}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  item.urgency === "soon"
                    ? "bg-amber-500/15 text-amber-300"
                    : item.urgency === "routine"
                      ? "bg-cyan/15 text-cyan"
                      : "bg-white/5 text-zinc-500"
                }`}
              >
                {item.urgency}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
      <div className="border-t border-white/8 p-6">
        <BookVisitLink className="btn-glow inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black">
          Book recommended work
          <Link2 className="h-4 w-4" />
        </BookVisitLink>
      </div>
    </div>
  );
}
