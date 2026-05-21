"use client";

import { motion } from "framer-motion";
import { Scan } from "lucide-react";
import { SCAN_STEPS } from "@/lib/vehicle-data";

export function VehicleScanLoader({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="vehicle-card relative overflow-hidden rounded-2xl p-5"
    >
      <motion.div className="scan-beam pointer-events-none absolute inset-x-0 top-0 h-24" />
      <div className="relative flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30"
        >
          <Scan className="h-5 w-5 text-amber-300" />
        </motion.div>
        <div>
          <p className="text-sm font-medium text-white">DVLA & AI vehicle scan</p>
          <p className="text-xs text-zinc-500">{SCAN_STEPS[step] ?? SCAN_STEPS[0]}</p>
        </div>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-200"
          initial={{ width: "0%" }}
          animate={{ width: `${((step + 1) / SCAN_STEPS.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
