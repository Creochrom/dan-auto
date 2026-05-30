"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { AdminStatusBadge } from "@/components/enterprise/AdminStatusBadge";
import { WorkshopCaseBrief } from "@/components/workshop/WorkshopCaseBrief";
import { WorkshopDisclosureSection } from "@/components/workshop/WorkshopDisclosureSection";
import { WorkshopCustomerPhone } from "@/features/booking/components/WorkshopCustomerPhone";
import { phoneTelHref } from "@/lib/format-contact";
import { formatPlate } from "@/lib/format-plate";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/types/lead";
import { resolveWorkshopCaseFromLead } from "@/lib/types/workshop-case-summary";

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
    <main className="admin-content-wrap pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleLeads.map((lead) => {
            const caseSummary =
              lead.caseSummary ?? resolveWorkshopCaseFromLead(lead);
            const phoneHref = phoneTelHref(lead.phone);

            return (
            <li
              key={lead.id}
              className="premium-card rounded-2xl p-4 sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white">{lead.name}</p>
                  <WorkshopCustomerPhone phone={lead.phone} />
                  {lead.registration ? (
                    <p className="mt-1 font-mono text-xs text-[#d4a63c]">
                      {formatPlate(lead.registration)}
                    </p>
                  ) : null}
                </div>
                <AdminStatusBadge kind="lead" status={lead.status} />
              </div>

              {caseSummary ? (
                <div className="mt-3">
                  <WorkshopCaseBrief caseSummary={caseSummary} compact />
                </div>
              ) : lead.problemDescription ? (
                <p className="mt-2 text-xs text-zinc-500">{lead.problemDescription}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={phoneHref}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400/55 hover:bg-emerald-500/15 sm:flex-none sm:px-4"
                >
                  Call
                </a>
                <Link
                  href={`/admin/bookings?reg=${encodeURIComponent(lead.registration ?? "")}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-3 py-2 text-xs font-semibold text-[#e8d5a3] transition hover:border-[#d4a63c]/55 hover:bg-[#d4a63c]/15 sm:flex-none sm:px-4"
                >
                  Open workflow
                </Link>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-3.5">
                <WorkshopDisclosureSection title="Notes" subtitle="Customer and advisor context">
                  {lead.problemDescription?.trim() ? (
                    <p className="text-xs leading-relaxed text-zinc-300">{lead.problemDescription}</p>
                  ) : (
                    <p className="text-xs text-zinc-500">No freeform notes captured.</p>
                  )}
                </WorkshopDisclosureSection>

                <WorkshopDisclosureSection title="History" subtitle="Source and timestamps">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      Source: {lead.source.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      Created: {new Date(lead.createdAt).toLocaleString("en-GB")}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      Updated: {new Date(lead.updatedAt).toLocaleString("en-GB")}
                    </span>
                  </div>
                </WorkshopDisclosureSection>

                <WorkshopDisclosureSection title="Previous jobs" subtitle="Status workflow actions">
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
                </WorkshopDisclosureSection>

                <WorkshopDisclosureSection title="Vehicle history" subtitle="Linked vehicle context">
                  <p className="text-xs text-zinc-400">
                    {lead.registration
                      ? `Registration ${formatPlate(lead.registration)} is linked. Use Open workflow to follow booking and jobs.`
                      : "No registration linked yet."}
                  </p>
                </WorkshopDisclosureSection>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
