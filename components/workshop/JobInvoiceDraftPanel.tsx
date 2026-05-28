"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import type { Invoice } from "@/lib/types/workshop-data";

type Props = {
  jobId: string;
  disabled?: boolean;
  compact?: boolean;
  onSaved?: () => void;
};

type InvoiceResponse = {
  ok?: boolean;
  data?: { invoice?: Invoice | null };
  error?: string;
};

function formatGbp(pence?: number): string {
  if (pence == null || !Number.isFinite(pence)) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function penceToInput(pence?: number): string {
  if (pence == null || !Number.isFinite(pence)) return "";
  return (pence / 100).toFixed(2);
}

function parsePoundsInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const pounds = Number.parseFloat(trimmed);
  if (!Number.isFinite(pounds) || pounds < 0) return undefined;
  return Math.round(pounds * 100);
}

export function JobInvoiceDraftPanel({
  jobId,
  disabled,
  compact,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [vat, setVat] = useState("");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const applyInvoice = useCallback((invoice: Invoice | null | undefined) => {
    setInvoiceNumber(invoice?.invoiceNumber ?? "");
    setSubtotal(penceToInput(invoice?.subtotalPence));
    setVat(penceToInput(invoice?.vatPence));
    setTotal(penceToInput(invoice?.totalPence));
    setNotes(invoice?.notes ?? "");
    setUpdatedAt(invoice?.updatedAt ?? null);
  }, []);

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/jobs/${jobId}/invoice`, {
        credentials: "include",
      });
      const json = (await res.json().catch(() => null)) as InvoiceResponse | null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Could not load invoice draft.");
      }
      applyInvoice(json.data?.invoice ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load invoice draft.");
    } finally {
      setLoading(false);
    }
  }, [applyInvoice, jobId]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const previewTotalPence = useMemo(() => {
    const explicit = parsePoundsInput(total);
    if (explicit != null) return explicit;
    const sub = parsePoundsInput(subtotal);
    const v = parsePoundsInput(vat);
    if (sub == null && v == null) return undefined;
    return (sub ?? 0) + (v ?? 0);
  }, [subtotal, total, vat]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const subtotalPence = parsePoundsInput(subtotal);
      const vatPence = parsePoundsInput(vat);
      let totalPence = parsePoundsInput(total);
      if (totalPence == null && (subtotalPence != null || vatPence != null)) {
        totalPence = (subtotalPence ?? 0) + (vatPence ?? 0);
      }

      const res = await adminFetch(`/api/jobs/${jobId}/invoice`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber.trim() || undefined,
          subtotalPence,
          vatPence,
          totalPence,
          notes: notes.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: { invoice?: Invoice };
        error?: string;
      } | null;
      if (!res.ok || !json?.ok || !json.data?.invoice) {
        throw new Error(json?.error ?? "Could not save invoice draft.");
      }
      applyInvoice(json.data.invoice);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save invoice draft.");
    } finally {
      setSaving(false);
    }
  }, [
    applyInvoice,
    invoiceNumber,
    jobId,
    notes,
    onSaved,
    subtotal,
    total,
    vat,
  ]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading invoice draft…
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-[#d4a63c]" />
          <div>
            <p className="text-sm font-semibold text-white">
              Invoice{" "}
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                Draft only
              </span>
            </p>
            {!compact && (
              <p className="mt-0.5 text-xs text-amber-200/80">
                Internal pricing — not sent to the customer automatically.
              </p>
            )}
          </div>
        </div>
        {updatedAt && (
          <p className="text-[10px] text-zinc-600">
            Saved {new Date(updatedAt).toLocaleString("en-GB")}
          </p>
        )}
      </div>

      <div
        className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}
      >
        <label className="block sm:col-span-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            Invoice number
          </span>
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            disabled={disabled || saving}
            placeholder="e.g. INV-2026-0042"
            className="input-premium mt-1 min-h-11 w-full rounded-xl px-3 text-sm text-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            Subtotal (£)
          </span>
          <input
            inputMode="decimal"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
            disabled={disabled || saving}
            placeholder="0.00"
            className="input-premium mt-1 min-h-11 w-full rounded-xl px-3 text-sm text-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">VAT (£)</span>
          <input
            inputMode="decimal"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            disabled={disabled || saving}
            placeholder="0.00"
            className="input-premium mt-1 min-h-11 w-full rounded-xl px-3 text-sm text-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Total (£)</span>
          <input
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            disabled={disabled || saving}
            placeholder="Auto from subtotal + VAT"
            className="input-premium mt-1 min-h-11 w-full rounded-xl px-3 text-sm text-white"
          />
        </label>
      </div>

      {!compact && (
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={disabled || saving}
            rows={3}
            placeholder="Line items, adjustments, payment terms…"
            className="input-premium mt-1 w-full resize-y rounded-xl px-3 py-2 text-sm text-white"
          />
        </label>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-400">
          Preview total:{" "}
          <span className="font-semibold text-[#e8d5a3]">{formatGbp(previewTotalPence)}</span>
          <span className="text-zinc-600"> · GBP</span>
        </p>
        <button
          type="button"
          disabled={disabled || saving}
          onClick={() => void handleSave()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-4 text-xs font-semibold text-[#e8d5a3] hover:border-[#d4a63c]/55 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save draft
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </p>
      )}
    </div>
  );
}
