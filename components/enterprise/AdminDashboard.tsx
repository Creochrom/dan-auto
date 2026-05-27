"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Bug,
  Calendar,
  LogOut,
  Send,
  Users,
  Wrench,
} from "lucide-react";
import { loadPlatformStore, savePlatformStore, createPromo } from "@/lib/platform/store";
import { DEFAULT_PROMOS } from "@/lib/platform/seed";
import type { PromoCode, PromoType } from "@/lib/platform/types";
import { adminFetch } from "@/lib/admin/client";
import {
  canManageStaff,
  clearAdminDisplay,
  loadAdminDisplay,
  saveAdminDisplay,
  type AuthUser,
} from "@/lib/enterprise/auth";
import {
  addBug,
  loadEnterprise,
  respondQuote,
  saveEnterprise,
  updateJob,
} from "@/lib/enterprise/store";
import type { EnterpriseStore, QuoteStatus } from "@/lib/enterprise/types";

const EASE = [0.22, 1, 0.36, 1] as const;

type Tab = "crm" | "jobs" | "quotes" | "promos" | "staff" | "bugs" | "ai";

export function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>("crm");
  const [platform, setPlatform] = useState(loadPlatformStore);
  const [enterprise, setEnterprise] = useState<EnterpriseStore>(() => ({
    jobs: [],
    quotes: [],
    staff: [],
    bugs: [],
  }));
  const [hydrated, setHydrated] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [bugTitle, setBugTitle] = useState("");
  const [bugBody, setBugBody] = useState("");

  useEffect(() => {
    const display = loadAdminDisplay();
    if (display) {
      setUser(display);
      setPlatform(loadPlatformStore());
      setEnterprise(loadEnterprise());
      setHydrated(true);
      return;
    }

    void adminFetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.ok) {
          const u = json.data as AuthUser;
          saveAdminDisplay(u);
          setUser(u);
        } else {
          setUser({
            login: "admin",
            displayName: "Workshop Admin",
            role: "admin",
          });
        }
      })
      .finally(() => {
        setPlatform(loadPlatformStore());
        setEnterprise(loadEnterprise());
        setHydrated(true);
      });
  }, [router]);

  const persistPlatform = useCallback((next: ReturnType<typeof loadPlatformStore>) => {
    setPlatform(next);
    savePlatformStore(next);
  }, []);

  const persistEnterprise = useCallback((next: EnterpriseStore) => {
    setEnterprise(next);
    saveEnterprise(next);
  }, []);

  const analytics = platform.admin;

  const platformLinks = (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link
        href="/admin/bookings"
        className="rounded-lg border border-[#d4a63c]/30 px-3 py-1.5 text-xs font-semibold text-[#d4a63c] hover:bg-[#d4a63c]/10"
      >
        Bookings API →
      </Link>
      <Link
        href="/admin/leads"
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20"
      >
        Leads inbox →
      </Link>
    </div>
  );

  const handleAi = () => {
    const q = aiPrompt.toLowerCase();
    let reply =
      "Based on current workshop load, prioritise MOT bay throughput this afternoon and assign diagnostics jobs to available technicians.";
    if (q.includes("price") || q.includes("pricing")) {
      reply =
        "Suggested labour rate £85/hr diagnostics, MOT at max fee £54.85. Offer WELCOME5 for first-time members.";
    } else if (q.includes("schedule")) {
      reply = "Saturday fills by 14:00 — open 08:00 and 11:00 slots for MOT only to reduce overruns.";
    }
    setAiReply(reply);
  };

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-zinc-500">Loading workshop OS…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-sm font-semibold text-white">Dan Auto Workshop OS</p>
              <p className="text-xs text-zinc-500">
                {user.displayName} · {user.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              clearAdminDisplay();
              await adminFetch("/api/admin/logout", { method: "POST" });
              router.replace("/admin/login");
            }}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {platformLinks}
        <nav className="flex flex-wrap gap-2">
          {(
            [
              ["crm", "CRM"],
              ["jobs", "Jobs"],
              ["quotes", "Quotes"],
              ["promos", "Promos"],
              ["staff", "Staff"],
              ["bugs", "Bugs"],
              ["ai", "AI Assistant"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-sm ${
                tab === id
                  ? "bg-cyan/15 font-medium text-cyan ring-1 ring-cyan/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "crm" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { label: "Referral conversions", value: analytics.referralConversions },
              { label: "Repeat rate", value: `${analytics.repeatRate}%` },
              { label: "Promo revenue", value: `£${analytics.promoRevenue}` },
              { label: "Upcoming MOTs", value: analytics.upcomingMotCount },
              { label: "Active members", value: analytics.activeMembers },
              { label: "Avg LTV", value: `£${analytics.avgLifetimeValue}` },
            ].map((m) => (
              <div key={m.label} className="premium-card rounded-2xl p-5">
                <p className="text-2xl font-light text-white">{m.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{m.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {tab === "jobs" && (
          <div className="mt-8 space-y-4">
            {enterprise.jobs.map((job) => (
              <div key={job.id} className="premium-card rounded-2xl p-5">
                <motion.div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-amber-300">{job.reg}</p>
                    <p className="font-medium text-white">{job.service}</p>
                    <p className="text-sm text-zinc-500">{job.customerName}</p>
                  </div>
                  <select
                    value={job.status}
                    onChange={(e) =>
                      persistEnterprise(
                        updateJob(enterprise, job.id, {
                          status: e.target.value as typeof job.status,
                        })
                      )
                    }
                    className="input-premium rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {[
                      "queued",
                      "claimed",
                      "in_progress",
                      "awaiting_parts",
                      "awaiting_approval",
                      "completed",
                    ].map((s) => (
                      <option key={s} value={s} className="bg-zinc-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </motion.div>
                <p className="mt-3 text-sm text-zinc-400">{job.notes}</p>
                {job.vip && (
                  <span className="mt-2 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                    VIP
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "quotes" && (
          <div className="mt-8 space-y-4">
            {enterprise.quotes.map((q) => (
              <div key={q.id} className="premium-card rounded-2xl p-5">
                <p className="font-mono text-amber-300">{q.reg}</p>
                <p className="text-xl text-white">£{q.total}</p>
                <p className="text-sm text-zinc-500">Status: {q.status}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["accepted", "rejected", "counter", "installments"] as QuoteStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          persistEnterprise(respondQuote(enterprise, q.id, s))
                        }
                        className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-zinc-400 hover:text-cyan"
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "promos" && (
          <PromoAdmin
            promos={platform.promos}
            onSave={(promos) => persistPlatform({ ...platform, promos })}
          />
        )}

        {tab === "staff" && canManageStaff(user.role) && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {enterprise.staff.map((s) => (
              <div key={s.id} className="premium-card flex items-center gap-3 rounded-2xl p-5">
                <Users className="h-5 w-5 text-cyan" />
                <div>
                  <p className="font-medium text-white">{s.name}</p>
                  <p className="text-xs capitalize text-zinc-500">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "bugs" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!bugTitle || !bugBody) return;
                persistEnterprise(
                  addBug(enterprise, {
                    from: user.displayName,
                    title: bugTitle,
                    body: bugBody,
                    status: "open",
                  })
                );
                setBugTitle("");
                setBugBody("");
              }}
              className="premium-panel space-y-3 rounded-2xl p-6"
            >
              <h2 className="flex items-center gap-2 font-medium text-white">
                <Bug className="h-5 w-5 text-cyan" />
                Report to developer
              </h2>
              <input
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
                placeholder="Title"
                className="input-premium w-full rounded-xl px-4 py-3 text-white"
              />
              <textarea
                value={bugBody}
                onChange={(e) => setBugBody(e.target.value)}
                placeholder="Describe the issue"
                rows={4}
                className="input-premium w-full resize-none rounded-xl px-4 py-3 text-white"
              />
              <button type="submit" className="btn-glow rounded-full py-2.5 text-sm font-semibold text-black">
                Submit bug
              </button>
            </form>
            <ul className="space-y-3">
              {enterprise.bugs.map((b) => (
                <li key={b.id} className="premium-card rounded-xl p-4 text-sm">
                  <p className="font-medium text-white">{b.title}</p>
                  <p className="mt-1 text-zinc-400">{b.body}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {b.from} · {b.status}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "ai" && (
          <div className="premium-panel mt-8 max-w-2xl rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-lg font-medium text-white">
              <Bot className="h-5 w-5 text-cyan" />
              Workshop AI assistant
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Scheduling, pricing, customer responses, and operational insights.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask about pricing, scheduling, or workload…"
              rows={3}
              className="input-premium mt-4 w-full resize-none rounded-xl px-4 py-3 text-white"
            />
            <button
              type="button"
              onClick={handleAi}
              className="btn-glow mt-3 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-black"
            >
              <Send className="h-4 w-4" />
              Ask assistant
            </button>
            {aiReply && (
              <p className="mt-4 rounded-xl bg-black/40 p-4 text-sm text-zinc-300">{aiReply}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PromoAdmin({
  promos,
  onSave,
}: {
  promos: PromoCode[];
  onSave: (p: PromoCode[]) => void;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<PromoType>("credit");
  const [value, setValue] = useState("5");

  return (
    <div className="mt-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(
            createPromo(promos, {
              code,
              type,
              value: Number(value),
              description: code,
              expiresAt: "2026-12-31",
              maxUses: 200,
              active: true,
            })
          );
          setCode("");
        }}
        className="premium-panel mb-6 flex flex-wrap gap-3 rounded-2xl p-4"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE"
          className="input-premium rounded-xl px-4 py-2 font-mono uppercase text-white"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PromoType)}
          className="input-premium rounded-xl px-3 py-2 text-white"
        >
          <option value="credit">Credit</option>
          <option value="percent">Percent</option>
        </select>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input-premium w-24 rounded-xl px-3 py-2 text-white"
        />
        <button type="submit" className="btn-glow rounded-full px-5 py-2 text-sm font-semibold text-black">
          Add
        </button>
      </form>
      <div className="space-y-2">
        {promos.map((p) => (
          <motion.div key={p.code} className="premium-card flex justify-between rounded-xl p-4 text-sm">
            <span className="font-mono text-cyan">{p.code}</span>
            <span className="text-zinc-500">
              {p.usageCount} uses · £{p.revenueGenerated}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
