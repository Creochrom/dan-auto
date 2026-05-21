"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CreditCard, MessageSquare, X } from "lucide-react";
import {
  loadEnterprise,
  respondQuote,
  saveEnterprise,
} from "@/lib/enterprise/store";
import type { EnterpriseStore, RepairQuote } from "@/lib/enterprise/types";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  customerRegs?: string[];
};

export function CustomerQuoteApproval({ customerRegs = [] }: Props) {
  const [enterprise, setEnterprise] = useState<EnterpriseStore | null>(null);
  const [counterBudget, setCounterBudget] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setEnterprise(loadEnterprise());
  }, []);

  const persist = useCallback((next: EnterpriseStore) => {
    setEnterprise(next);
    saveEnterprise(next);
  }, []);

  if (!enterprise) return null;

  const pending = enterprise.quotes.filter((q) => {
    if (q.status !== "pending") return false;
    if (customerRegs.length === 0) return true;
    return customerRegs.some(
      (r) => r.replace(/\s/g, "").toUpperCase() === q.reg.replace(/\s/g, "").toUpperCase()
    );
  });

  if (pending.length === 0) return null;

  const handle = (quote: RepairQuote, status: RepairQuote["status"], message?: string) => {
    persist(respondQuote(enterprise, quote.id, status, message));
    setActiveId(null);
    setCounterBudget("");
  };

  return (
    <div className="mt-8 space-y-4">
      <p className="eyebrow-diagnostic">Repair quotes</p>
      <AnimatePresence mode="popLayout">
        {pending.map((quote) => (
          <motion.article
            key={quote.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ ease: EASE }}
            className="premium-card overflow-hidden rounded-2xl border border-amber-500/20"
          >
            <motion.div className="border-b border-white/8 bg-amber-500/5 px-5 py-4 sm:px-6">
              <p className="font-mono text-sm text-amber-300">{quote.reg}</p>
              <p className="mt-1 text-lg font-semibold text-white">
                Workshop quote · £{quote.total.toLocaleString("en-GB")}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Review pricing before we order parts or continue labour.
              </p>
            </motion.div>
            <div className="flex flex-wrap gap-2 p-5 sm:p-6">
              <button
                type="button"
                onClick={() => handle(quote, "accepted")}
                className="btn-glow inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-black"
              >
                <Check className="h-4 w-4" />
                Accept quote
              </button>
              <button
                type="button"
                onClick={() => handle(quote, "rejected")}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-zinc-300 hover:border-red-400/40 hover:text-red-300"
              >
                <X className="h-4 w-4" />
                Decline
              </button>
              <button
                type="button"
                onClick={() => setActiveId(activeId === quote.id ? null : quote.id)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-zinc-300 hover:text-white"
              >
                <MessageSquare className="h-4 w-4" />
                Propose budget
              </button>
              <button
                type="button"
                onClick={() => handle(quote, "installments")}
                className="inline-flex items-center gap-2 rounded-full border border-cyan/30 px-4 py-2.5 text-sm text-cyan hover:bg-cyan/10"
              >
                <CreditCard className="h-4 w-4" />
                Installment plan
              </button>
            </div>
            <AnimatePresence>
              {activeId === quote.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/8 px-5 pb-5 sm:px-6"
                >
                  <label className="mt-4 block text-xs text-zinc-500">
                    Your target budget (£)
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={counterBudget}
                      onChange={(e) => setCounterBudget(e.target.value)}
                      className="input-premium flex-1 rounded-xl px-4 py-2.5 text-sm text-white"
                      placeholder="e.g. 950"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handle(
                          quote,
                          "counter",
                          counterBudget ? `Customer budget: £${counterBudget}` : undefined
                        )
                      }
                      className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15"
                    >
                      Send
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
