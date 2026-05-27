"use client";

import { CALLBACK_STATUS_SENT } from "@/lib/config/callback-flow-copy";

type Props = {
  visible: boolean;
};

/** Subtle success line above the composer — not a banner. */
export function AdvisorCallbackStatus({ visible }: Props) {
  if (!visible) return null;

  return (
    <div className="advisor-callback-status" role="status" aria-live="polite">
      <span className="advisor-callback-status__dot" aria-hidden />
      <span>{CALLBACK_STATUS_SENT}</span>
    </div>
  );
}
