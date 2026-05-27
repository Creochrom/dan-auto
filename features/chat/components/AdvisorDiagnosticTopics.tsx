"use client";

import { motion } from "framer-motion";
import {
  DIAGNOSTIC_TOPICS_HEADLINE,
  DIAGNOSTIC_TOPICS_SUBLINE,
  DIAGNOSTIC_TOPIC_ACTIONS,
} from "@/lib/config/hero-concierge-copy";
import type { QuickStartAction } from "@/lib/config/advisor-copy";

type Props = {
  onSelect: (action: QuickStartAction) => void;
  disabled?: boolean;
  selectedId?: string | null;
};

export function AdvisorDiagnosticTopics({
  onSelect,
  disabled,
  selectedId,
}: Props) {
  return (
    <div className="advisor-diagnostic-topics">
      <h4 className="advisor-diagnostic-topics__headline">{DIAGNOSTIC_TOPICS_HEADLINE}</h4>
      <p className="advisor-diagnostic-topics__subline">{DIAGNOSTIC_TOPICS_SUBLINE}</p>
      <div className="advisor-intent-grid advisor-intent-grid--topics" role="group">
        {DIAGNOSTIC_TOPIC_ACTIONS.map((action, i) => {
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
              className={`advisor-intent-card advisor-intent-card--topic ${active ? "advisor-intent-card--active" : ""}`}
            >
              <span className="advisor-intent-card__title">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
