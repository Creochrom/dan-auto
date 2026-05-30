import { resolveBookingServiceLabel } from "@/lib/booking/booking-journey";
import { BOOKING_CONFIRM_CHIP_ID } from "@/lib/config/booking-flow-copy";
import { validateLeadCompletion } from "@/lib/services/advisor-workflow";
import { createEmptyStructuredIntake } from "@/lib/types/structured-intake";
import type { LeadDraft } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import type { CompleteBookingIntakeInput } from "@/lib/types/service-intake";
import {
  bookingTraceStage,
  tracePayloadSummary,
  traceValidationResult,
} from "@/lib/logging/booking-trace";

const AFFIRMATIVE_BOOKING =
  /^(yes|yeah|yep|yup|yes please|please send|confirm|confirm booking|send it|go ahead|ok(?:ay)?|that(?:'s| is) correct|correct|looks good|book it)\.?!?$/i;

const DAY_TOKEN =
  /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|asap|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?)/i;

const TIME_TOKEN =
  /\b(morning|afternoon|evening|night|\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|before\s+\d|after\s+\d|any\s?time|flexible)/i;

const WINDOW_LABEL =
  /\b(morning|afternoon|evening|night|any\s?time|flexible|asap)\b/i;

const CLOCK_TIME =
  /\b(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))\b/i;

/** Prefer day-part windows over clock times for mechanic-friendly booking requests. */
export function normalizePreferredWindow(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) return "Flexible";
  if (WINDOW_LABEL.test(trimmed)) {
    const match = trimmed.match(WINDOW_LABEL);
    if (match) {
      const label = match[0].toLowerCase();
      if (label === "any time" || label === "anytime") return "Any time";
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
  }
  if (CLOCK_TIME.test(trimmed)) {
    const hourMatch = trimmed.match(/\b(\d{1,2})(?::\d{2})?\s*(am|pm)?\b/i);
    if (hourMatch) {
      let hour = parseInt(hourMatch[1], 10);
      const meridiem = hourMatch[2]?.toLowerCase();
      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;
      if (hour >= 5 && hour < 12) return "Morning";
      if (hour >= 12 && hour < 17) return "Afternoon";
      if (hour >= 17 && hour < 22) return "Evening";
    }
  }
  return trimmed;
}

export function dedupeServiceLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Workshop appointment";

  const words = trimmed.split(/\s+/);
  const half = Math.floor(words.length / 2);
  if (half > 2 && words.length % 2 === 0) {
    const first = words.slice(0, half).join(" ");
    const second = words.slice(half).join(" ");
    if (first.toLowerCase() === second.toLowerCase()) return first;
  }

  const parts = trimmed
    .split(/[;|]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const unique = [...new Set(parts.map((p) => p.toLowerCase()))];
  if (unique.length === 1 && parts.length > 1) return parts[0];

  return trimmed.replace(/\s{2,}/g, " ");
}

export const BOOKING_CONFIRM_CHIP: SuggestionChip = {
  id: BOOKING_CONFIRM_CHIP_ID,
  label: "Send booking request",
  message: "Yes, please send my booking request",
};

export function isAffirmativeBookingConfirmation(text: string): boolean {
  return AFFIRMATIVE_BOOKING.test(text.trim());
}

export function isBookingHandoffReady(
  mode: string | undefined,
  intake: StructuredIntake | undefined,
  leadDraft: LeadDraft,
  registrationHint?: string
): boolean {
  if (mode !== "booking") return false;
  return validateLeadCompletion(
    "booking",
    intake ?? createEmptyStructuredIntake(),
    leadDraft,
    registrationHint
  ).canSubmit;
}

export function inferBookingService(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): string {
  const explicit = resolveBookingServiceLabel(intake, leadDraft);
  if (explicit) return explicit;

  const symptomParts = [
    ...intake.issue.symptoms,
    leadDraft.problemDescription,
  ]
    .flatMap((s) => (s ? s.split(/[;|]/).map((p) => p.trim()) : []))
    .filter(Boolean);

  const uniqueSymptoms = [...new Set(symptomParts.map((s) => s.toLowerCase()))]
    .map((lower) => symptomParts.find((s) => s.toLowerCase() === lower)!)
    .filter(Boolean);

  const context = [
    ...uniqueSymptoms,
    intake.aiEstimate.summary,
    intake.aiEstimate.estimatedPriceRange,
  ]
    .filter(Boolean)
    .join(" ");

  let label: string;
  if (/\bmot\b/i.test(context)) label = "MOT";
  else if (/\bmajor\b|\bfull service\b/i.test(context)) label = "Major service";
  else if (/\binterim\b|\bminor service\b/i.test(context)) label = "Interim service";
  else if (/\bservice\b|\boil\b|\bspark plug\b/i.test(context)) label = "Service";
  else if (/\bbrake pad/i.test(context)) label = "Brake pads";
  else if (intake.aiEstimate.estimatedPriceRange.trim()) label = "Repair / service";
  else label = context.slice(0, 80) || "Workshop appointment";

  return dedupeServiceLabel(label);
}

export function resolveBookingSlotFields(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): { preferredDate: string; preferredTime: string } {
  const date = leadDraft.preferredDate?.trim();
  const time = leadDraft.callbackWindow?.trim();
  const slot = intake.preferredBookingTime.trim();

  if (date && time) {
    return {
      preferredDate: date,
      preferredTime: normalizePreferredWindow(time),
    };
  }

  if (slot) {
    const dayMatch = slot.match(DAY_TOKEN);
    const timeMatch = slot.match(TIME_TOKEN);
    const dayPart = dayMatch?.[0]?.trim();
    const timePart = timeMatch?.[0]?.trim();

    if (date && timePart) {
      return { preferredDate: date, preferredTime: timePart };
    }
    if (time && dayPart) {
      return { preferredDate: dayPart, preferredTime: time };
    }
    if (dayPart && timePart) {
      return {
        preferredDate: dayPart,
        preferredTime: normalizePreferredWindow(timePart),
      };
    }
    if (dayPart) {
      return {
        preferredDate: dayPart,
        preferredTime: normalizePreferredWindow(time || slot),
      };
    }
    if (timePart) {
      return {
        preferredDate: date || slot,
        preferredTime: normalizePreferredWindow(timePart),
      };
    }
    return {
      preferredDate: date || slot,
      preferredTime: normalizePreferredWindow(time || slot),
    };
  }

  return {
    preferredDate: date || "Flexible",
    preferredTime: normalizePreferredWindow(time) || "Flexible",
  };
}

export function buildBookingIntakePayload(params: {
  chatSessionId: string;
  intake: StructuredIntake;
  leadDraft: LeadDraft;
  registrationHint?: string;
  uploadIds?: string[];
  customerName?: string;
  customerPhone?: string;
  traceId?: string;
}): CompleteBookingIntakeInput | null {
  const validation = validateLeadCompletion(
    "booking",
    params.intake,
    params.leadDraft,
    params.registrationHint
  );

  if (params.traceId) {
    bookingTraceStage("2_readiness_validation", params.traceId, {
      mode: "booking",
      validation: traceValidationResult(validation),
      leadDraft: {
        name: Boolean(params.leadDraft.name?.trim()),
        phone: Boolean(params.leadDraft.phone?.trim()),
        preferredDate: params.leadDraft.preferredDate ?? null,
        callbackWindow: params.leadDraft.callbackWindow ?? null,
      },
      preferredBookingTime: params.intake.preferredBookingTime || null,
    });
  }

  if (!validation.canSubmit || !params.chatSessionId.trim()) {
    if (params.traceId) {
      bookingTraceStage("2_readiness_validation", params.traceId, {
        blocked: true,
        reason: !params.chatSessionId.trim()
          ? "missing_chat_session_id"
          : "validation_canSubmit_false",
      });
    }
    return null;
  }

  const name = params.customerName?.trim() || params.leadDraft.name?.trim();
  const phone = params.customerPhone?.trim() || params.leadDraft.phone?.trim();
  if (!name || !phone) {
    if (params.traceId) {
      bookingTraceStage("2_readiness_validation", params.traceId, {
        blocked: true,
        reason: "missing_name_or_phone",
        hasName: Boolean(name),
        hasPhone: Boolean(phone),
      });
    }
    return null;
  }

  const { preferredDate, preferredTime } = resolveBookingSlotFields(
    params.intake,
    params.leadDraft
  );

  const payload: CompleteBookingIntakeInput = {
    chatSessionId: params.chatSessionId,
    service: inferBookingService(params.intake, params.leadDraft),
    preferredDate,
    preferredTime,
    uploadIds: params.uploadIds,
    registration:
      params.registrationHint?.trim() ||
      params.leadDraft.registration?.trim() ||
      undefined,
    customerName: name,
    customerPhone: phone,
    traceId: params.traceId,
  };

  if (params.traceId) {
    bookingTraceStage("2_readiness_validation", params.traceId, {
      ready: true,
      payload: tracePayloadSummary(payload),
    });
  }

  return payload;
}
