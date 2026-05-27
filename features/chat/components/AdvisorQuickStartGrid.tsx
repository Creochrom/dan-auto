"use client";

import { motion } from "framer-motion";
import type { QuickStartAction } from "@/lib/config/advisor-copy";

type Props = {
  actions: QuickStartAction[];
  selectedId?: string | null;
  onSelect: (action: QuickStartAction) => void;
  disabled?: boolean;
};

export function AdvisorQuickStartGrid({
  actions,
  selectedId,
  onSelect,
  disabled,
}: Props) {
  return (
    <div
      className="advisor-quick-start-grid"
      role="group"
      aria-label="Quick start topics"
    >
      {actions.map((action, i) => {
        const active = selectedId === action.id;
        return (
          <motion.button
            key={action.id}
            type="button"
            disabled={disabled}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            onClick={() => onSelect(action)}
            aria-pressed={active}
            className={`advisor-quick-start-btn ${active ? "advisor-quick-start-btn--active" : ""}`}
          >
            {action.label}
          </motion.button>
        );
      })}
    </div>
  );
}
