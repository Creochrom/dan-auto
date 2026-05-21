"use client";

import { useState, type RefObject } from "react";
import { Calendar, Wrench } from "lucide-react";
import type { VehicleResult } from "@/lib/types/vehicle";
import { HeroFloatingWindow } from "@/components/hero/HeroFloatingWindow";

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
  onConfirm: () => void;
};

export function HeroBookInspectionModal({
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
  onConfirm,
}: Props) {
  const [slot, setSlot] = useState("This week");
  const slots = ["This week", "Next week", "Flexible"];

  if (!open) return null;

  return (
    <HeroFloatingWindow
      title="Book inspection"
      windowId="inspection"
      stackDepth={stackDepth}
      entranceDelay={entranceDelay}
      focusBoost={focusBoost}
      dragConstraints={dragConstraints}
      defaultPosition={defaultPosition}
      width={360}
      minimized={minimized}
      onMinimize={onMinimize}
      onRestore={onRestore}
      onClose={onClose}
      onActivate={onActivate}
      ariaLabel="Book inspection"
    >
      <div className="hero-modal-content">
        <p className="text-[12px] text-zinc-400">
          {vehicle.unknown ? "Vehicle verification" : vehicle.makeModel} ·{" "}
          <span className="font-mono text-[#d4a63c]/85">{vehicle.reg}</span>
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-200">
          {vehicle.unknown
            ? "Reserve a workshop slot — our technicians will confirm your vehicle on arrival."
            : vehicle.recommendation}
        </p>
        <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a63c]/80">
          Preferred timing
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                slot === s
                  ? "border-[#d4a63c]/50 bg-[#d4a63c]/15 text-[#f5e6b8]"
                  : "border-white/[0.08] bg-black/40 text-zinc-400 hover:border-[#d4a63c]/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="btn-glow mt-4 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-black"
        >
          <Wrench className="h-4 w-4" aria-hidden />
          Confirm inspection
        </button>
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
          <Calendar className="h-3 w-3 text-[#d4a63c]" aria-hidden />
          We&apos;ll confirm by phone within 2 hours
        </p>
      </div>
    </HeroFloatingWindow>
  );
}
