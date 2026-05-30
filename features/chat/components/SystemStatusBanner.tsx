"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { SystemBannerState } from "@/lib/config/system-status-copy";

type Props = {
  banner: SystemBannerState;
  onRetry?: () => void;
};

const VARIANT_CLASS = {
  pending: "system-status-banner--pending",
  success: "system-status-banner--success",
  warning: "system-status-banner--warning",
  error: "system-status-banner--error",
} as const;

const VARIANT_ICON = {
  pending: Loader2,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
} as const;

export function SystemStatusBanner({ banner, onRetry }: Props) {
  if (!banner) return null;

  const Icon = VARIANT_ICON[banner.variant];
  const isPending = banner.variant === "pending";

  return (
    <div
      className={`system-status-banner ${VARIANT_CLASS[banner.variant]}`}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={`system-status-banner__icon ${isPending ? "animate-spin" : ""}`}
        aria-hidden
      />
      <p className="system-status-banner__text">{banner.message}</p>
      {banner.variant === "error" && onRetry && (
        <button type="button" className="system-status-banner__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
