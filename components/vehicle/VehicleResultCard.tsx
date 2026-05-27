"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BookVisitLink } from "@/features/booking/components/BookVisitLink";
import { formatPlate } from "@/lib/format-plate";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { VehicleResult } from "@/lib/types/vehicle";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  vehicle: VehicleResult;
};

export function VehicleResultCard({ vehicle }: Props) {
  const motColor =
    vehicle.motStatus === "urgent"
      ? "text-red-400"
      : vehicle.motStatus === "due_soon"
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="vehicle-card overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-black">
        <Image
          src={vehicle.imageUrl}
          alt={vehicle.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="scale-105 object-cover object-[center_48%] transition duration-700"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_30%,transparent_20%,rgba(0,0,0,0.55)_100%)]" />
        <span className="absolute right-3 top-3 rounded-lg bg-[#F9D71C] px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-black">
          {vehicle.reg}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <p className="eyebrow-diagnostic">Vehicle identified</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {vehicle.makeModel}
        </h3>
        <p className="mt-1 text-sm text-zinc-400">{vehicle.meta}</p>

        <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-sm">
          <li className={`flex items-center gap-2 ${motColor}`}>
            <Clock className="h-4 w-4 shrink-0" />
            {vehicle.motLine}
          </li>
          <li className="flex items-center gap-2 text-zinc-300">
            <AlertTriangle
              className={`h-4 w-4 shrink-0 ${vehicle.advisories > 0 ? "text-amber-400" : "text-emerald-400"}`}
            />
            {vehicle.advisories > 0
              ? `${vehicle.advisories} advisories detected`
              : "No advisories on record"}
          </li>
          <li className="flex items-start gap-2 text-amber-200/90">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span>{vehicle.aiInsight}</span>
          </li>
          <li className="flex items-center gap-2 font-medium text-amber-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Recommended: {vehicle.recommendation}
          </li>
        </ul>

        {vehicle.suggestedRepairs.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/8 bg-black/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Suggested attention
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {vehicle.suggestedRepairs.map((r) => (
                <li key={r} className="flex items-center gap-2">
                  <Wrench className="h-3 w-3 text-amber-500/80" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-sm text-zinc-400">
          Workshop estimate{" "}
          <span className="font-semibold text-amber-300">
            £{vehicle.estimatedFrom} – £{vehicle.estimatedTo}
          </span>
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <BookVisitLink
            prefill={{ registration: formatPlate(vehicle.reg) }}
            className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black"
          >
            Book this vehicle
            <ArrowRight className="h-4 w-4" />
          </BookVisitLink>
          <a
            href="#ai-quote"
            className="btn-ghost flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-white"
          >
            Workshop quote
          </a>
        </div>
      </div>
    </motion.article>
  );
}
