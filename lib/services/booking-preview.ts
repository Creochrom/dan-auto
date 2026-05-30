import {
  BOOKING_CHANGE_CONTACT_CHIP_ID,
  BOOKING_CHANGE_DAY_CHIP_ID,
  BOOKING_CHANGE_DETAILS_CHIP_ID,
  BOOKING_CHANGE_SERVICE_CHIP_ID,
  BOOKING_CONFIRM_CHIP_ID,
  BOOKING_NOT_NOW_CHIP_ID,
  BOOKING_USE_DIFFERENT_PHONE_CHIP_ID,
  BOOKING_USE_STORED_PHONE_CHIP_ID,
  BOOKING_REVIEW_HELPER,
  BOOKING_REVIEW_INTRO,
} from "@/lib/config/booking-flow-copy";
import type { LeadDraft } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import { validateCustomerPhone } from "@/lib/validation/advisor-contact";
import {
  dedupeServiceLabel,
  inferBookingService,
  normalizePreferredWindow,
  resolveBookingSlotFields,
} from "@/lib/services/booking-handoff";
import {
  formatVehicleDisplay,
  formatVehicleFromLegacyString,
  vehiclePartsFromStructured,
} from "@/lib/vehicle/format-vehicle-display";

export type BookingHandoffStep =
  | "idle"
  | "phone_confirm"
  | "preview"
  | "change_details"
  | "dismissed";

export function resolveStoredPhone(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): string | undefined {
  const phone = leadDraft.phone?.trim() || intake.customer.contact?.trim();
  if (!phone) return undefined;
  const check = validateCustomerPhone(phone);
  return check.valid ? check.normalized : undefined;
}

export function maskPhoneLastFour(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return `******${last4}`;
}

export function formatBookingPreferredSlot(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): string {
  const { preferredDate, preferredTime } = resolveBookingSlotFields(intake, leadDraft);
  const window = normalizePreferredWindow(preferredTime);
  const date = preferredDate.trim();
  if (date && window) {
    return `${date} — ${window}`;
  }
  return date || window || "Flexible";
}

export function formatBookingVehicleLine(
  intake: StructuredIntake,
  leadDraft: LeadDraft,
  registrationHint?: string
): string {
  const fromStructured = formatVehicleDisplay(vehiclePartsFromStructured(intake));
  if (fromStructured) return fromStructured;
  const legacy = formatVehicleFromLegacyString(leadDraft.vehicleModel);
  if (legacy) return legacy;
  return registrationHint?.trim() || "Your vehicle";
}

export function formatBookingServiceLabel(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): string {
  return dedupeServiceLabel(inferBookingService(intake, leadDraft));
}

export type BookingPreviewSummary = {
  vehicleLine: string;
  registration: string;
  service: string;
  preferred: string;
  contactMasked: string;
};

export function buildBookingPreviewSummary(params: {
  intake: StructuredIntake;
  leadDraft: LeadDraft;
  registrationHint?: string;
  phone: string;
}): BookingPreviewSummary {
  const { intake, leadDraft, registrationHint, phone } = params;
  return {
    vehicleLine: formatBookingVehicleLine(intake, leadDraft, registrationHint),
    registration: registrationHint?.trim() || leadDraft.registration?.trim() || "",
    service: formatBookingServiceLabel(intake, leadDraft),
    preferred: formatBookingPreferredSlot(intake, leadDraft),
    contactMasked: maskPhoneLastFour(phone),
  };
}

/** Short chat nudge — full review lives in the composer panel. */
export function formatBookingReviewChatNudge(): string {
  return `${BOOKING_REVIEW_INTRO}\n\n${BOOKING_REVIEW_HELPER}`;
}

export function phoneConfirmMessage(lastFour: string): string {
  return `We have a contact number ending ${lastFour}.`;
}

export const BOOKING_USE_STORED_PHONE_CHIP: SuggestionChip = {
  id: BOOKING_USE_STORED_PHONE_CHIP_ID,
  label: "Use this number",
  message: "Yes, use this number",
};

export const BOOKING_USE_DIFFERENT_PHONE_CHIP: SuggestionChip = {
  id: BOOKING_USE_DIFFERENT_PHONE_CHIP_ID,
  label: "Use a different number",
  message: "I'd like to use a different number",
};

export const BOOKING_CHANGE_APPOINTMENT_CHIP_ID = "booking-change-appointment";

export const BOOKING_CHANGE_APPOINTMENT_CHIP: SuggestionChip = {
  id: BOOKING_CHANGE_APPOINTMENT_CHIP_ID,
  label: "Change appointment",
  message: "I'd like to change my preferred appointment day or time",
};

export const BOOKING_CHANGE_DAY_CHIP: SuggestionChip = {
  id: BOOKING_CHANGE_DAY_CHIP_ID,
  label: "Change day",
  message: "I'd like to change the preferred day",
};

export const BOOKING_CHANGE_CONTACT_CHIP: SuggestionChip = {
  id: BOOKING_CHANGE_CONTACT_CHIP_ID,
  label: "Change contact number",
  message: "I'd like to change my contact number",
};

export const BOOKING_CHANGE_SERVICE_CHIP: SuggestionChip = {
  id: BOOKING_CHANGE_SERVICE_CHIP_ID,
  label: "Change service",
  message: "I'd like to change the service I need",
};

export const BOOKING_CHANGE_DETAILS_CHIP: SuggestionChip = {
  id: BOOKING_CHANGE_DETAILS_CHIP_ID,
  label: "Change details",
  message: "I'd like to change some booking details",
};

export const BOOKING_NOT_NOW_CHIP: SuggestionChip = {
  id: BOOKING_NOT_NOW_CHIP_ID,
  label: "Not now",
  message: "Not now — I'll confirm later",
};

export const BOOKING_SEND_CHIP: SuggestionChip = {
  id: BOOKING_CONFIRM_CHIP_ID,
  label: "Send booking request",
  message: "Yes, please send my booking request",
};

/** @deprecated Use composer panel actions instead of chat chips for review. */
export const BOOKING_PREVIEW_CHIPS: SuggestionChip[] = [
  BOOKING_SEND_CHIP,
  BOOKING_CHANGE_DETAILS_CHIP,
  BOOKING_NOT_NOW_CHIP,
];

export function bookingSlotFingerprint(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): string {
  const slot = resolveBookingSlotFields(intake, leadDraft);
  const service = formatBookingServiceLabel(intake, leadDraft);
  const phone = resolveStoredPhone(intake, leadDraft) ?? "";
  return [slot.preferredDate, slot.preferredTime, service, phone].join("|");
}

export function isReviewReopenRequest(text: string): boolean {
  return /\b(review booking|send booking|book(?:ing)? request|ready to send|confirm booking)\b/i.test(
    text.trim()
  );
}
