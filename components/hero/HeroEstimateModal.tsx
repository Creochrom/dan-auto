"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { Calculator, Clock, Upload } from "lucide-react";
import type { VehicleResult } from "@/lib/types/vehicle";
import { HeroFloatingWindow } from "@/components/hero/HeroFloatingWindow";

const SERVICES = [
  "Diagnostics",
  "Brakes",
  "Suspension",
  "Air Conditioning",
  "ECU Coding",
  "MOT",
  "Full Service",
] as const;

const ISSUES: Record<(typeof SERVICES)[number], string[]> = {
  Diagnostics: ["Warning lights", "Engine noise", "Performance loss", "Electrical fault"],
  Brakes: ["Squealing brakes", "Soft pedal", "Vibration when braking", "MOT advisory"],
  Suspension: ["Knocking over bumps", "Uneven tyre wear", "Pulling to one side"],
  "Air Conditioning": ["Weak cooling", "Bad odour", "Not blowing cold"],
  "ECU Coding": ["Feature activation", "Fault codes", "Module programming"],
  MOT: ["Pre-MOT check", "Advisory rectification", "Retest preparation"],
  "Full Service": ["Annual service", "Major service", "Oil & filters"],
};

const URGENCIES = ["Standard", "Soon", "Urgent"] as const;

type EstimateResult = {
  cost: string;
  duration: string;
  timeframe: string;
};

function estimateFor(
  vehicle: VehicleResult,
  service: string,
  issue: string,
  urgency: string
): EstimateResult {
  const base =
    service.length * 18 +
    issue.length * 6 +
    (urgency === "Urgent" ? 80 : urgency === "Soon" ? 40 : 0);
  const low = (vehicle.estimatedFrom ?? 95) + base * 0.4;
  const high = (vehicle.estimatedTo ?? 280) + base * 0.6;
  const hours =
    urgency === "Urgent" ? "2–4 hours" : urgency === "Soon" ? "1–3 hours" : "1–2 hours";
  const timeframe =
    urgency === "Urgent"
      ? "Book within 48 hours"
      : urgency === "Soon"
        ? "Recommended within 7 days"
        : "Flexible — book when convenient";
  return {
    cost: `£${Math.round(low)}–£${Math.round(high)}`,
    duration: `Estimated repair duration: ${hours}`,
    timeframe,
  };
}

type Props = {
  vehicle: VehicleResult;
  open: boolean;
  minimized: boolean;
  stackDepth: number;
  entranceDelay?: number;
  focusBoost?: number;
  dragConstraints?: RefObject<HTMLElement | null>;
  defaultPosition?: { x: number; y: number };
  onMinimize: () => void;
  onRestore: () => void;
  onClose: () => void;
  onActivate?: () => void;
};

export function HeroEstimateModal({
  vehicle,
  open,
  minimized,
  stackDepth,
  entranceDelay = 0,
  focusBoost = 0,
  dragConstraints,
  defaultPosition,
  onMinimize,
  onRestore,
  onClose,
  onActivate,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [service, setService] = useState<string>(SERVICES[0]);
  const [issue, setIssue] = useState(ISSUES[SERVICES[0]][0]!);
  const [urgency, setUrgency] = useState<(typeof URGENCIES)[number]>("Standard");
  const [notes, setNotes] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);

  const issuesForService = ISSUES[service as keyof typeof ISSUES] ?? ISSUES.Diagnostics;

  const handleServiceChange = useCallback((next: string) => {
    setService(next);
    const list = ISSUES[next as keyof typeof ISSUES] ?? ISSUES.Diagnostics;
    setIssue(list[0]!);
    setResult(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setResult(null);
    window.setTimeout(() => {
      setResult(estimateFor(vehicle, service, issue, urgency));
      setIsSubmitting(false);
    }, 1000);
  }, [service, issue, urgency, isSubmitting, vehicle]);

  if (!open) return null;

  return (
    <HeroFloatingWindow
      title="Repair cost estimate"
      windowId="estimate"
      stackDepth={stackDepth}
      entranceDelay={entranceDelay}
      focusBoost={focusBoost}
      dragConstraints={dragConstraints}
      defaultPosition={defaultPosition}
      width={400}
      minimized={minimized}
      onMinimize={onMinimize}
      onRestore={onRestore}
      onClose={onClose}
      onActivate={onActivate}
      ariaLabel="Repair cost estimate"
    >
      <div className="hero-modal-content">
        <p className="text-[11px] text-zinc-400">
          {vehicle.makeModel} ·{" "}
          <span className="font-mono text-[#d4a63c]/75">{vehicle.reg}</span>
        </p>

        <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a63c]/80">
          Service category
        </label>
        <select
          value={service}
          onChange={(e) => handleServiceChange(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/55 px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#d4a63c]/40"
        >
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a63c]/80">
          Issue / problem
        </label>
        <select
          value={issue}
          onChange={(e) => {
            setIssue(e.target.value);
            setResult(null);
          }}
          className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/55 px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#d4a63c]/40"
        >
          {issuesForService.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a63c]/80">
          Urgency
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {URGENCIES.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                setUrgency(u);
                setResult(null);
              }}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                urgency === u
                  ? "border-[#d4a63c]/50 bg-[#d4a63c]/15 text-[#f5e6b8]"
                  : "border-white/[0.08] bg-black/40 text-zinc-400 hover:border-[#d4a63c]/30"
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a63c]/80">
          Optional notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any extra details…"
          className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.08] bg-black/55 px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#d4a63c]/40"
        />

        <div className="mt-4 rounded-xl border border-dashed border-[#d4a63c]/25 bg-black/35 p-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#d4a63c]"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden />
            Upload optional photos or video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              setFileCount(e.target.files?.length ?? 0);
              e.target.value = "";
            }}
          />
          {fileCount > 0 && (
            <p className="mt-1 text-[10px] text-zinc-500">{fileCount} file(s) attached</p>
          )}
        </div>

        {result && (
          <div className="mt-4 rounded-xl border border-[#d4a63c]/28 bg-[#d4a63c]/8 p-3">
            <p className="text-[14px] font-bold text-[#d4a63c]">
              Estimated service cost: {result.cost}
            </p>
            <p className="mt-2 flex items-center gap-2 text-[12px] text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-[#d4a63c]" aria-hidden />
              {result.duration}
            </p>
            <p className="mt-1 text-[12px] text-zinc-400">{result.timeframe}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-glow mt-4 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-black disabled:opacity-50"
        >
          <Calculator className="h-4 w-4" aria-hidden />
          {isSubmitting ? "Calculating…" : "Generate estimate"}
        </button>
      </div>
    </HeroFloatingWindow>
  );
}
