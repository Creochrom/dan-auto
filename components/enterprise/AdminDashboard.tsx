"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, LogOut, Users, Wrench } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { resolveJobsFromResponse } from "@/lib/workshop/resolve-jobs-response";
import { clearAdminDisplay, loadAdminDisplay, saveAdminDisplay, type AuthUser } from "@/lib/enterprise/auth";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import type { Booking } from "@/lib/types/booking";
import type { Lead } from "@/lib/types/lead";
import type { Job } from "@/lib/types/job";

type OpsCounts = {
  bookings: number;
  bookingsNew: number;
  leads: number;
  leadsNew: number;
  activeJobs: number;
};

const NAV_CARDS = [
  {
    href: "/admin/today",
    label: "Today",
    description: "Live queue and floor priorities",
    icon: Calendar,
    accent: "text-cyan",
  },
  {
    href: "/admin/jobs",
    label: "Jobs",
    description: "Queue → selected job → action",
    icon: Wrench,
    accent: "text-[#d4a63c]",
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    description: "Incoming booking requests",
    icon: Calendar,
    accent: "text-zinc-200",
  },
  {
    href: "/admin/leads",
    label: "Customers",
    description: "Customer and enquiry pipeline",
    icon: Users,
    accent: "text-zinc-200",
  },
  {
    href: "/admin/workshop-assistant",
    label: "Workshop Assistant",
    description: "Operational copilot for the team",
    icon: Wrench,
    accent: "text-cyan",
  },
] as const;

export function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [counts, setCounts] = useState<OpsCounts | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    setCountsError(null);
    try {
      const [bookingsRes, leadsRes, jobsRes] = await Promise.all([
        adminFetch("/api/bookings", { credentials: "include" }),
        adminFetch("/api/leads", { credentials: "include" }),
        adminFetch("/api/jobs", { credentials: "include" }),
      ]);

      if (bookingsRes.status === 401 || leadsRes.status === 401 || jobsRes.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const bookingsJson = (await bookingsRes.json().catch(() => null)) as { ok?: boolean; data?: Booking[] } | null;
      const leadsJson = (await leadsRes.json().catch(() => null)) as { ok?: boolean; data?: Lead[] } | null;
      const jobsJson = (await jobsRes.json().catch(() => null)) as { ok?: boolean; data?: Job[] } | null;

      if (!bookingsRes.ok || !bookingsJson?.ok || !leadsRes.ok || !leadsJson?.ok || !jobsRes.ok || !jobsJson?.ok) {
        throw new Error("Could not load live counts.");
      }

      const bookings = Array.isArray(bookingsJson.data) ? bookingsJson.data : [];
      const leads = Array.isArray(leadsJson.data) ? leadsJson.data : [];
      const jobs = resolveJobsFromResponse(jobsJson);
      setCounts({
        bookings: bookings.length,
        bookingsNew: bookings.filter((b) => b.status === "new" || b.status === "awaiting_callback").length,
        leads: leads.length,
        leadsNew: leads.filter((l) => l.status === "new").length,
        activeJobs: jobs.filter((j) => j.status !== "collected" && j.status !== "cancelled").length,
      });
    } catch (err) {
      setCountsError(err instanceof Error ? err.message : "Could not load live counts.");
      setCounts(null);
    }
  }, [router]);

  useEffect(() => {
    const display = loadAdminDisplay();
    if (display) {
      setUser(display);
      setHydrated(true);
      void loadCounts();
      return;
    }

    void adminFetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.ok) {
          const u = json.data as AuthUser;
          saveAdminDisplay(u);
          setUser(u);
          void loadCounts();
        } else {
          clearAdminDisplay();
          setUser(null);
          router.replace("/admin/login");
        }
      })
      .finally(() => setHydrated(true));
  }, [router, loadCounts]);

  const signOut = useCallback(async () => {
    clearAdminDisplay();
    await adminFetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }, [router]);

  const cards = useMemo(() => NAV_CARDS, []);

  if (!hydrated || !user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-sm text-zinc-500">Loading workshop admin…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4a63c]">Workshop OS</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Operations</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Signed in as {user.displayName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      <AdminQuickLinks active="today" />

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="premium-card rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Bookings</p>
          <p className="mt-2 text-3xl font-light text-white">{counts?.bookings ?? "—"}</p>
          <p className="mt-1 text-xs text-zinc-500">{counts?.bookingsNew ?? 0} waiting callback</p>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Leads</p>
          <p className="mt-2 text-3xl font-light text-white">{counts?.leads ?? "—"}</p>
          <p className="mt-1 text-xs text-zinc-500">{counts?.leadsNew ?? 0} new customers</p>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Active jobs</p>
          <p className="mt-2 text-3xl font-light text-white">{counts?.activeJobs ?? "—"}</p>
          <p className="mt-1 text-xs text-zinc-500">on floor</p>
        </div>
      </section>

      {countsError && <p className="mb-4 text-sm text-amber-300">{countsError}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="premium-card group flex items-center gap-4 rounded-2xl p-5 transition hover:border-white/15"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${card.accent}`}>
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{card.label}</p>
                <p className="text-sm text-zinc-500">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
