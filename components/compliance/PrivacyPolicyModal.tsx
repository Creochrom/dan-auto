"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { PrivacyPolicyContent } from "@/components/compliance/PrivacyPolicyContent";
import { LAYER } from "@/lib/ui/layers";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PrivacyPolicyModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="privacy-policy-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className={`fixed inset-0 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:px-4 sm:py-8 ${LAYER.modalBackdrop}`}
          role="presentation"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="privacy-policy-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: EASE }}
            className={`premium-scrollbar relative max-h-[min(92dvh,880px)] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-[#d4a63c]/20 bg-[#070605] shadow-[0_24px_80px_rgba(0,0,0,0.75)] sm:max-w-3xl sm:rounded-2xl ${LAYER.modal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex min-h-9 min-w-9 items-center justify-center rounded-full border border-white/12 bg-black/80 text-zinc-400 transition hover:border-[#d4a63c]/40 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a63c]"
              aria-label="Close privacy policy"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <PrivacyPolicyContent onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
