import type { HeroConciergeMode } from "@/lib/types/hero-concierge";

export type SystemBannerVariant = "pending" | "success" | "warning" | "error";

export type IntakeSubmitState = "idle" | "sending" | "sent" | "error";

export type SystemBannerState = {
  variant: SystemBannerVariant;
  message: string;
} | null;

export type HandoffDeliveryMeta = {
  leadId?: string;
  bookingId?: string;
  submittedAt?: string;
  emailSent?: boolean;
  notificationSent?: boolean;
  bookingCreated?: boolean;
};

function formatHandoffTime(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function resolveSystemBanner(params: {
  intakeSubmitState: IntakeSubmitState;
  conciergeMode: HeroConciergeMode;
  uploadsInProgress: boolean;
  isTyping: boolean;
  typingLabel?: string | null;
  handoffMeta?: HandoffDeliveryMeta | null;
}): SystemBannerState {
  const { intakeSubmitState, conciergeMode, uploadsInProgress, handoffMeta } = params;

  if (uploadsInProgress) {
    return { variant: "pending", message: "Analysing uploaded photo…" };
  }

  if (intakeSubmitState === "sending") {
    if (conciergeMode === "booking") {
      return { variant: "pending", message: "Sending booking request…" };
    }
    if (conciergeMode === "callback") {
      return { variant: "pending", message: "Sending callback request…" };
    }
    return { variant: "pending", message: "Preparing workshop request…" };
  }

  if (intakeSubmitState === "sent") {
    if (conciergeMode === "booking") {
      if (!handoffMeta?.bookingId) {
        return {
          variant: "error",
          message: "We couldn't confirm your booking request was saved. Please try again or contact the workshop.",
        };
      }
      const ref = ` Reference: ${handoffMeta.bookingId}.`;
      const notificationSent =
        handoffMeta?.notificationSent ?? handoffMeta?.emailSent ?? true;
      if (notificationSent === false) {
        return {
          variant: "warning",
          message: `Booking request received.${ref} The booking has been saved successfully. Workshop notification could not be delivered automatically. Please contact the workshop if you do not hear back shortly.`,
        };
      }
      return {
        variant: "success",
        message: `Booking request received.${ref} The workshop has received your request and will contact you shortly to confirm availability.`,
      };
    }
    if (conciergeMode === "callback") {
      const ref = handoffMeta?.leadId ? ` Reference: ${handoffMeta.leadId}.` : "";
      const at = formatHandoffTime(handoffMeta?.submittedAt);
      const timeSuffix = at ? ` Received ${at}.` : "";
      return {
        variant: "success",
        message: `Callback request received.${ref} The workshop has been notified and will contact you shortly.${timeSuffix}`,
      };
    }
    return { variant: "success", message: "Workshop received your information" };
  }

  if (intakeSubmitState === "error") {
    if (conciergeMode === "booking") {
      return {
        variant: "error",
        message: "Request not sent — workshop could not be reached. Please try again.",
      };
    }
    if (conciergeMode === "callback") {
      return {
        variant: "error",
        message: "Request not sent — workshop could not be reached. Please try again.",
      };
    }
    return {
      variant: "error",
      message: "Request not sent — please try again.",
    };
  }

  return null;
}
