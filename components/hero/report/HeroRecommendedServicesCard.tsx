"use client";

import { Wrench } from "lucide-react";
import type { VehicleReport } from "@/lib/types/vehicle-report";

type Props = {
  report: VehicleReport;
  onBookService: (title: string) => void;
  onEstimate: () => void;
};

export function HeroRecommendedServicesCard({
  report,
  onBookService,
  onEstimate,
}: Props) {
  return (
    <div className="hero-report-panel w-full">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4a63c]">
        <Wrench className="h-3.5 w-3.5" aria-hidden />
        Recommended for your vehicle
      </p>
      <ul className="mt-2.5 space-y-2">
        {report.recommendedServices.map((svc) => (
          <li
            key={svc.id}
            className="border border-white/[0.06] bg-black/40 px-2.5 py-2 transition hover:border-[#d4a63c]/25"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white">{svc.title}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{svc.description}</p>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-[#d4a63c]">{svc.priceLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => onBookService(svc.title)}
              className="mt-2 w-full rounded-lg border border-[#d4a63c]/22 py-1.5 text-[10px] font-semibold text-[#f5e6b8] transition hover:bg-[#d4a63c]/10"
            >
              Book {svc.title.toLowerCase()}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onEstimate}
        className="mt-2.5 w-full text-center text-[10px] font-semibold text-[#d4a63c]/80 transition hover:text-[#d4a63c]"
      >
        Get full repair estimate →
      </button>
    </div>
  );
}
