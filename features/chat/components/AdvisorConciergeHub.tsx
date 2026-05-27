"use client";

import { motion } from "framer-motion";
import {
  CONCIERGE_HUB_PROMPT,
  CONCIERGE_INTRO_BODY,
  CONCIERGE_INTRO_BODY_FIRST_VISIT,
  CONCIERGE_PROMPT_HINT,
  conciergeGreeting,
  HERO_INTENT_CARDS,
} from "@/lib/config/hero-concierge-copy";
import type { HeroIntentCard } from "@/lib/types/hero-concierge";

type Props = {
  onSelectIntent: (card: HeroIntentCard) => void;
  disabled?: boolean;
  customerName?: string;
  /** After reset — shorter welcome, same capabilities. */
  isReturning?: boolean;
};

export function AdvisorConciergeHub({
  onSelectIntent,
  disabled,
  customerName,
  isReturning = false,
}: Props) {
  const greeting = conciergeGreeting(customerName, isReturning);
  const introBody = isReturning ? CONCIERGE_INTRO_BODY : CONCIERGE_INTRO_BODY_FIRST_VISIT;

  return (
    <div className="advisor-concierge-hub">
      <div className="advisor-concierge-intro" role="region" aria-label="Assistant welcome">
        <p className="advisor-concierge-intro__greeting">{greeting}</p>
        <p className="advisor-concierge-intro__body">{introBody}</p>
      </div>

      <div className="advisor-concierge-prompt">
        <p className="advisor-concierge-prompt__text">{CONCIERGE_HUB_PROMPT}</p>
        <p className="advisor-concierge-prompt__hint">{CONCIERGE_PROMPT_HINT}</p>
      </div>

      <div
        className="advisor-intent-grid advisor-intent-grid--hub"
        role="group"
        aria-label="Suggested topics"
      >
        {HERO_INTENT_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              type="button"
              disabled={disabled}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.03, duration: 0.2 }}
              onClick={() => onSelectIntent(card)}
              className="advisor-intent-card advisor-intent-card--hub"
            >
              <Icon className="advisor-intent-card__icon-svg" strokeWidth={1.6} aria-hidden />
              <span className="advisor-intent-card__title">{card.title}</span>
              <span className="advisor-intent-card__desc">{card.description}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
