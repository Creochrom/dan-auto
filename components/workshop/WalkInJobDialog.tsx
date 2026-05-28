"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { displayRegistration } from "@/lib/workshop/command-palette";
import type { Job } from "@/lib/types/job";

type Props = {
  open: boolean;
  initialReg?: string;
  onClose: () => void;
  onCreated: (job: Job) => void;
};

export function WalkInJobDialog({ open, initialReg, onClose, onCreated }: Props) {
  const [registration, setRegistration] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [service, setService] = useState("General repair");
  const [symptomsText, setSymptomsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && initialReg) {
      setRegistration(displayRegistration(initialReg));
    }
  }, [open, initialReg]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);
      try {
        const res = await adminFetch("/api/jobs", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration: registration.trim(),
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            service: service.trim(),
            symptomsText: symptomsText.trim() || undefined,
            status: "checked_in",
          }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          data?: { job?: Job };
          error?: string;
        } | null;
        if (!res.ok || !json?.ok || !json.data?.job) {
          throw new Error(json?.error ?? "Could not create job.");
        }
        onCreated(json.data.job);
        onClose();
        setCustomerName("");
        setCustomerPhone("");
        setSymptomsText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create job.");
      } finally {
        setSaving(false);
      }
    },
    [customerName, customerPhone, onClose, onCreated, registration, service, symptomsText]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 px-4"
      role="dialog"
      aria-modal
      aria-label="Create walk-in job"
      onClick={onClose}
    >
      <form
        className="premium-card w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => void handleSubmit(e)}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Walk-in job</h2>
            <p className="mt-1 text-xs text-zinc-500">Creates job as checked in.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs text-zinc-400">
            Registration
            <input
              required
              value={registration}
              onChange={(e) => setRegistration(e.target.value.toUpperCase())}
              className="input-premium mt-1 min-h-11 w-full rounded-xl px-3 font-mono text-sm text-white"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Customer name
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-premium mt-1 min-h-11 w-full rounded-xl px-3 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Phone
            <input
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-premium mt-1 min-h-11 w-full rounded-xl px-3 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Service
            <input
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="input-premium mt-1 min-h-11 w-full rounded-xl px-3 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Symptoms (optional)
            <textarea
              value={symptomsText}
              onChange={(e) => setSymptomsText(e.target.value)}
              rows={2}
              className="input-premium mt-1 w-full rounded-xl px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 text-xs text-amber-200/90">{error}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-white/15 text-sm text-zinc-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-glow min-h-11 flex-1 rounded-xl text-sm font-semibold text-black disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </span>
            ) : (
              "Create job"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
