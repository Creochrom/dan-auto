"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Job } from "@/lib/types/job";
import {
  formatPenceForInput,
  parseGbpInputToPence,
} from "@/lib/workshop/job-revenue";

type RevenueField = "estimatedValuePence" | "approvedQuotePence" | "finalInvoicePence";

type Props = {
  job: Job;
  disabled?: boolean;
  intakeEstimateHint?: string | null;
  onSave: (
    patch: Partial<
      Pick<Job, "estimatedValuePence" | "approvedQuotePence" | "finalInvoicePence">
    >
  ) => Promise<void>;
};

const FIELDS: Array<{
  key: RevenueField;
  label: string;
  hint: string;
}> = [
  {
    key: "estimatedValuePence",
    label: "Estimated value",
    hint: "Optional · can prefill from AI intake midpoint",
  },
  {
    key: "approvedQuotePence",
    label: "Approved quote",
    hint: "Set after customer approval · counts toward confirmed revenue",
  },
  {
    key: "finalInvoicePence",
    label: "Final invoice",
    hint: "Set when work is completed · counts toward completed revenue",
  },
];

export function JobRevenuePanel({
  job,
  disabled = false,
  intakeEstimateHint,
  onSave,
}: Props) {
  const [drafts, setDrafts] = useState<Record<RevenueField, string>>({
    estimatedValuePence: formatPenceForInput(job.estimatedValuePence),
    approvedQuotePence: formatPenceForInput(job.approvedQuotePence),
    finalInvoicePence: formatPenceForInput(job.finalInvoicePence),
  });
  const [savingField, setSavingField] = useState<RevenueField | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts({
      estimatedValuePence: formatPenceForInput(job.estimatedValuePence),
      approvedQuotePence: formatPenceForInput(job.approvedQuotePence),
      finalInvoicePence: formatPenceForInput(job.finalInvoicePence),
    });
  }, [
    job.estimatedValuePence,
    job.approvedQuotePence,
    job.finalInvoicePence,
  ]);

  async function saveField(key: RevenueField) {
    const parsed = parseGbpInputToPence(drafts[key]);
    if (parsed === undefined) {
      setFieldError("Enter a valid amount in pounds, or leave blank to clear.");
      return;
    }

    const current = job[key] ?? null;
    if (parsed === current) return;

    setSavingField(key);
    setFieldError(null);
    try {
      await onSave({ [key]: parsed });
    } finally {
      setSavingField(null);
    }
  }

  return (
    <div className="space-y-4">
      {intakeEstimateHint ? (
        <p className="text-xs text-zinc-500">
          AI intake range:{" "}
          <span className="font-medium text-[#e8d5a3]">{intakeEstimateHint}</span>
        </p>
      ) : null}

      {FIELDS.map(({ key, label, hint }) => (
        <label key={key} className="block">
          <span className="text-xs font-medium text-zinc-300">{label}</span>
          <span className="mt-0.5 block text-[10px] text-zinc-600">{hint}</span>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              £
            </span>
            <input
              type="text"
              inputMode="decimal"
              disabled={disabled || savingField === key}
              value={drafts[key]}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [key]: e.target.value }))
              }
              onBlur={() => void saveField(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void saveField(key);
                }
              }}
              placeholder="—"
              className="input-premium h-11 w-full rounded-xl pl-7 pr-10 text-sm text-white"
            />
            {savingField === key ? (
              <Loader2
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500"
                aria-hidden
              />
            ) : null}
          </div>
        </label>
      ))}

      {fieldError ? (
        <p className="text-xs text-rose-300">{fieldError}</p>
      ) : (
        <p className="text-[10px] text-zinc-600">
          Workshop operations only — not accounting or payments. Blur or press Enter to save.
        </p>
      )}
    </div>
  );
}
