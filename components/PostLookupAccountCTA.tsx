"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Crown,
  History,
  Radio,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import type { VehicleResult } from "@/lib/types/vehicle";
import { useI18n } from "@/components/providers/I18nProvider";

const EASE = [0.22, 1, 0.36, 1] as const;

const BENEFITS = [
  { icon: Sparkles, text: "Detailed AI maintenance reports" },
  { icon: Zap, text: "Workshop queue priority" },
  { icon: History, text: "Digital service history" },
  { icon: Bell, text: "MOT reminders & repair updates" },
  { icon: Users, text: "Referral rewards (£5 each)" },
  { icon: Radio, text: "Live repair progress tracking" },
  { icon: Crown, text: "VIP booking & media updates" },
] as const;

type Props = {
  vehicle: VehicleResult;
  onCreateAccount: () => void;
};

export function PostLookupAccountCTA({ vehicle, onCreateAccount }: Props) {
  const { messages } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative mt-5 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-black/40 to-amber-600/5 p-5 sm:p-6"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan/15 blur-3xl"
        aria-hidden
      />
      <p className="eyebrow-diagnostic relative">Next step</p>
      <h3 className="relative mt-2 text-lg font-semibold text-white sm:text-xl">
        {messages.accountCtaTitle}
      </h3>
      <p className="relative mt-2 text-sm text-zinc-400">{messages.accountCtaSubtitle}</p>
      <p className="relative mt-3 font-mono text-sm text-amber-300">{vehicle.reg}</p>

      <ul className="relative mt-5 grid gap-2 sm:grid-cols-2">
        {BENEFITS.map((b, i) => (
          <motion.li
            key={b.text}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.04, ease: EASE }}
            className="flex items-center gap-2 text-xs text-zinc-300 sm:text-sm"
          >
            <b.icon className="h-4 w-4 shrink-0 text-cyan" />
            {b.text}
          </motion.li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCreateAccount}
        className="btn-glow relative mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-black"
      >
        <Sparkles className="h-4 w-4" />
        {messages.createAccount}
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
