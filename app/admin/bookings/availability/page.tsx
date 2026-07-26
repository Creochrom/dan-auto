"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import type { WorkshopClosure } from "@/lib/types/workshop-closure";

function formatDisplayDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type ClosureForm = {
  startDate: string;
  endDate: string;
  reason: string;
};

const EMPTY_FORM: ClosureForm = { startDate: "", endDate: "", reason: "" };

export default function AdminWorkshopAvailabilityPage() {
  const router = useRouter();
  const [closures, setClosures] = useState<WorkshopClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClosureForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/workshop-closures", {
        credentials: "include",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: { closures?: WorkshopClosure[] };
        error?: string;
      } | null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Unable to load closures.");
      }
      setClosures(json.data?.closures ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load closures.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(closure: WorkshopClosure) {
    setEditingId(closure.id);
    setForm({
      startDate: closure.startDate,
      endDate: closure.endDate,
      reason: closure.reason ?? "",
    });
    setDialogOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return;
    if (form.endDate < form.startDate) {
      setError("End date must be on or after start date.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/workshop-closures", {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason.trim() || null,
              }
            : {
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason.trim() || null,
              }
        ),
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Failed to save closure.");
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save closure.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    setPendingDeleteId(id);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/workshop-closures?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Failed to delete closure.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete closure.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <AdminQuickLinks active="bookings" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Bookings
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Workshop Availability
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Control when customers can book. Sundays are always closed. Add
            temporary closures for holidays and workshop shutdowns.
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="text-sm text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
        >
          ← Back to bookings
        </Link>
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
        >
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Permanent rules
        </h2>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2 text-sm text-zinc-200">
            <Check className="h-4 w-4 text-emerald-400" aria-hidden />
            Sunday closed
            <span className="text-xs text-zinc-500">(read-only)</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-zinc-400">
            <Check className="h-4 w-4 text-zinc-600" aria-hidden />
            Saturday closes at 13:00
            <span className="text-xs text-zinc-600">(hours config)</span>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Temporary closures
          </h2>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-3.5 py-1.5 text-xs font-semibold text-[#e8d5a3] transition hover:bg-[#d4a63c]/16"
          >
            <Plus className="h-3.5 w-3.5" />
            Add closure
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading closures…</p>
        ) : closures.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No temporary closures scheduled. Customers can book any open weekday
            or Saturday morning.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-zinc-500">
                  <th className="pb-2 pr-3 font-medium">Start</th>
                  <th className="pb-2 pr-3 font-medium">End</th>
                  <th className="pb-2 pr-3 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {closures.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/[0.06] text-zinc-300"
                  >
                    <td className="py-3 pr-3 whitespace-nowrap">
                      {formatDisplayDate(c.startDate)}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      {formatDisplayDate(c.endDate)}
                    </td>
                    <td className="py-3 pr-3">
                      {c.reason?.trim() || (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-400 hover:border-white/20 hover:text-white"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pendingDeleteId === c.id}
                          onClick={() => void onDelete(c.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1 text-xs text-red-300/80 hover:border-red-500/40 hover:text-red-200 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="closure-dialog-title"
        >
          <form
            onSubmit={onSave}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c0c] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3
                id="closure-dialog-title"
                className="text-lg font-semibold text-white"
              >
                {editingId ? "Edit closure" : "Add closure"}
              </h3>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  Start date
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white focus:border-[#d4a63c]/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  End date
                </label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white focus:border-[#d4a63c]/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer holiday"
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#d4a63c]/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full border border-[#d4a63c]/40 bg-[#d4a63c]/15 px-4 py-2 text-sm font-medium text-[#e8d5a3] hover:bg-[#d4a63c]/25 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
