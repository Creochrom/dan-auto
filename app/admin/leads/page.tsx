"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { AdminStatusBadge } from "@/components/enterprise/AdminStatusBadge";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/types/lead";

/**
 * Lead inbox — CRM-ready scaffold.
 * TODO: AI summaries, assignment, Twilio/WhatsApp threads.
 */
export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetch("/api/leads", { credentials: "include" });
      if (r.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = (await r.json().catch(() => null)) as
        | { ok?: boolean; data?: Lead[]; error?: string }
        | null;
      if (!r.ok || !json?.ok) {
        throw new Error(json?.error ?? "Unable to load leads right now.");
      }
      setLeads(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load leads right now.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  async function onChangeStatus(id: string, status: LeadStatus) {
    setPendingStatusId(id);
    try {
      const res = await adminFetch("/api/leads", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: Lead; error?: string }
        | null;
      if (!res.ok || !json?.ok || !json.data) {
        throw new Error(json?.error ?? "Could not update lead status.");
      }

      setLeads((prev) => prev.map((lead) => (lead.id === id ? json.data! : lead)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update lead status.");
    } finally {
      setPendingStatusId(null);
    }
  }

  const visibleLeads = useMemo(
    () =>
      statusFilter === "all"
        ? leads
        : leads.filter((lead) => lead.status === statusFilter),
    [leads, statusFilter]
  );

  const leadCountCopy =
    statusFilter === "all"
      ? `${leads.length} total`
      : `${visibleLeads.length} of ${leads.length} shown`;

  const isFiltering = statusFilter !== "all";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500">Leads, callbacks, and front-desk follow-up</p>
        </div>
        <Link href="/admin/today" className="text-sm text-[#d4a63c] hover:underline">
          ← Today
        </Link>
      </div>

      <AdminQuickLinks active="leads" />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            Status filter
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
            className="input-premium mt-2 h-10 min-w-44 rounded-xl px-3 text-sm text-white"
          >
            <option value="all">All statuses</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-zinc-500">{leadCountCopy}</p>
      </div>

      {loading ? (
        <div className="premium-card rounded-2xl p-8 text-center">
          <p className="text-sm text-zinc-400">Loading lead inbox...</p>
        </div>
      ) : error ? (
        <div className="premium-card rounded-2xl p-6">
          <p className="text-sm text-rose-300">{error}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Check your admin session and try refreshing this page.
          </p>
          <button
            type="button"
            onClick={() => void loadLeads()}
            className="mt-4 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : visibleLeads.length === 0 ? (
        <div className="premium-card rounded-2xl p-8 text-center">
          <p className="text-sm text-zinc-300">
            {leads.length === 0
              ? "No leads captured yet."
              : isFiltering
                ? "No leads in this status."
                : "No leads match the current view."}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {leads.length === 0
              ? "New assistant chats and contact requests will appear here automatically."
              : isFiltering
                ? "Try another filter to review the rest of the lead inbox."
                : "Check back shortly for new enquiries."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibleLeads.map((lead) => (
            <li
              key={lead.id}
              className="premium-card rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{lead.name}</p>
                  <p className="text-sm text-zinc-400">{lead.phone}</p>
                </div>
                <AdminStatusBadge kind="lead" status={lead.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                <span className="rounded-full border border-white/10 px-2 py-0.5">
                  Source: {lead.source.replaceAll("_", " ")}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5">
                  Created: {new Date(lead.createdAt).toLocaleString("en-GB")}
                </span>
                {lead.registration && (
                  <span className="rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-2 py-0.5 font-mono text-[#d4a63c]">
                    Reg: {lead.registration}
                  </span>
                )}
              </div>

              {lead.problemDescription && (
                <p className="mt-2 text-xs text-zinc-500">{lead.problemDescription}</p>
              )}
              <div className="mt-3">
                <label
                  htmlFor={`lead-status-${lead.id}`}
                  className="text-[11px] uppercase tracking-[0.12em] text-zinc-500"
                >
                  Update status
                </label>
                <select
                  id={`lead-status-${lead.id}`}
                  className="input-premium mt-2 h-11 w-full rounded-xl px-3 text-sm text-white"
                  value={lead.status}
                  disabled={pendingStatusId === lead.id}
                  onChange={(e) =>
                    void onChangeStatus(lead.id, e.target.value as LeadStatus)
                  }
                >
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
