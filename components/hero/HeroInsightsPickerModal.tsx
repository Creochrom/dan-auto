"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import {
  HERO_INSIGHT_CATEGORIES,
  type HeroInsightCategoryId,
} from "@/lib/hero-onboarding";
import { LAYER } from "@/lib/ui/layers";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  open: boolean;
  selectedCategory: HeroInsightCategoryId | null;
  /** When true, render inside hero-stage (no body portal). */
  heroScoped?: boolean;
  onSelectCategory: (id: HeroInsightCategoryId) => void;
  onBack: () => void;
  onClose: () => void;
};

export function HeroInsightsPickerModal({
  open,
  selectedCategory,
  heroScoped = false,
  onSelectCategory,
  onBack,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onBack]);

  if (!mounted) return null;

  const backdropClass = heroScoped
    ? "hero-scoped-modal-backdrop absolute inset-0 z-[56] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
    : `fixed inset-0 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm ${LAYER.modal}`;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="hero-insights-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE }}
          className={backdropClass}
          role="presentation"
          onClick={onBack}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="hero-insights-title"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-[#0e0d0b] to-[#060504] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 transition hover:text-zinc-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition hover:text-white"
                aria-label="Close all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 pb-5 pt-4">
              <h2
                id="hero-insights-title"
                className="text-lg font-semibold tracking-tight text-white"
              >
                Vehicle insights
              </h2>
              <p className="mt-1 text-[12px] text-zinc-500">
                Choose a report to open — one at a time, on your terms.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {HERO_INSIGHT_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSelectCategory(cat.id)}
                      className={`flex flex-col items-start gap-2 rounded-xl border px-3.5 py-3 text-left transition duration-200 ${
                        active
                          ? "border-amber-400/40 bg-amber-400/[0.08] shadow-[0_0_14px_-6px_rgba(212,166,60,0.35)]"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/16"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? "text-amber-200" : "text-amber-300/75"}`}
                        aria-hidden
                      />
                      <span>
                        <span
                          className={`block text-[13px] font-semibold ${active ? "text-amber-100" : "text-white"}`}
                        >
                          {cat.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                          {cat.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (heroScoped) return content;
  return createPortal(content, document.body);
}
