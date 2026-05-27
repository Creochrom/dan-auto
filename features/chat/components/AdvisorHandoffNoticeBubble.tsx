"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/types/chat";

type Props = {
  message: ChatMessage;
  onRetry?: () => void;
};

const VARIANT_CLASS: Record<NonNullable<ChatMessage["noticeVariant"]>, string> = {
  success: "advisor-handoff-notice--success",
  error: "advisor-handoff-notice--error",
  pending: "advisor-handoff-notice--pending",
};

const VARIANT_ICON: Record<
  NonNullable<ChatMessage["noticeVariant"]>,
  typeof CheckCircle2
> = {
  success: CheckCircle2,
  error: AlertCircle,
  pending: Loader2,
};

export function AdvisorHandoffNoticeBubble({ message, onRetry }: Props) {
  const variant = message.noticeVariant ?? "success";
  const Icon = VARIANT_ICON[variant];
  const isPending = variant === "pending";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex w-full justify-start"
    >
      <div
        className={`advisor-handoff-notice ${VARIANT_CLASS[variant]}`}
        role="status"
        aria-live="polite"
      >
        <Icon
          className={`advisor-handoff-notice__icon ${isPending ? "animate-spin" : ""}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="advisor-handoff-notice__text">{message.content}</p>
          {variant === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="advisor-handoff-notice__retry"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
