"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import type { HeroServiceCard } from "@/lib/hero-content";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  service: HeroServiceCard;
  onClose: () => void;
  onBook: (label: string) => void;
};

export function HeroServiceInfoModal({ service, onClose, onBook }: Props) {
  const reduceMotion = useReducedMotion();
  const Icon = service.icon;

  return (
    <motion.div
      role="dialog"
      aria-label={`${service.title} details`}
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 8 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#d4a63c]/30 bg-[#080706]/96 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.7)]">
        <button
          type="button"
          onClick={onClose}
          className="hero-modal-icon-btn absolute right-4 top-4"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <div className="flex items-center gap-3 pr-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4a63c]/12 ring-1 ring-[#d4a63c]/35">
            <Icon className="h-5 w-5 text-[#d4a63c]" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-bold uppercase tracking-wide text-white">
              {service.title}
            </h3>
            <p className="text-sm font-semibold text-[#d4a63c]">{service.hint}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{service.description}</p>
        <button
          type="button"
          onClick={() => {
            onBook(service.bookLabel);
            onClose();
          }}
          className="btn-glow mt-5 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-bold text-black"
        >
          Book {service.title.toLowerCase()}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}
