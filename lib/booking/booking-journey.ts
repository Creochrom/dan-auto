/**
 * Book MOT or Service — guided step-by-step journey (Release 0.3.5b).
 * Client-driven chips enforce order: need → service → day → window → contact → review.
 */

import type { LeadDraft } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import { dedupeServiceLabel } from "@/lib/services/booking-handoff";

export const BOOKING_JOURNEY_CHIP_PREFIX = "book-";

export type BookingJourneyStep =
  | "need"
  | "service_type"
  | "service_guidance"
  | "appointment_day"
  | "appointment_window"
  | "contact"
  | "ready";

export type BookingJourneyProgress = {
  step: BookingJourneyStep;
  serviceSelected: boolean;
  daySelected: boolean;
  windowSelected: boolean;
};

const KNOWN_SERVICES =
  /^(mot|interim service|full service|major service|diagnostic inspection|workshop appointment)$/i;

function chip(id: string, label: string, message: string): SuggestionChip {
  return { id, label, message };
}

export const BOOKING_NEED_CHIPS: SuggestionChip[] = [
  chip("book-need-mot", "MOT", "I need an MOT."),
  chip("book-need-service", "Service", "I need a service."),
  chip("book-need-repair", "Repair", "I need a repair."),
  chip("book-need-unsure", "Not sure", "I'm not sure what I need yet."),
];

export const BOOKING_SERVICE_TYPE_CHIPS: SuggestionChip[] = [
  chip("book-svc-interim", "Interim Service", "I'd like an interim service."),
  chip("book-svc-full", "Full Service", "I'd like a full service."),
  chip("book-svc-major", "Major Service", "I'd like a major service."),
  chip("book-svc-unsure", "Not sure", "I'm not sure which service I need."),
];

export const BOOKING_GUIDANCE_CHIPS: SuggestionChip[] = [
  chip("book-guide-city", "Mostly city driving", "I mostly do city driving."),
  chip("book-guide-mileage", "High annual mileage", "I drive a high annual mileage."),
  chip("book-guide-overdue", "Service overdue", "My service is overdue."),
  chip("book-guide-lights", "Warning lights", "I have warning lights on."),
];

export const BOOKING_RECOMMENDATION_CHIPS: SuggestionChip[] = [
  chip("book-rec-mot", "MOT", "Book an MOT."),
  chip("book-rec-interim", "Interim Service", "Book an interim service."),
  chip("book-rec-full", "Full Service", "Book a full service."),
  chip("book-rec-major", "Major Service", "Book a major service."),
  chip("book-rec-diagnostic", "Diagnostic inspection", "Book a diagnostic inspection."),
];

export const BOOKING_DAY_CHIPS: SuggestionChip[] = [
  chip("book-day-today", "Today", "Today please."),
  chip("book-day-tomorrow", "Tomorrow", "Tomorrow please."),
  chip("book-day-this-week", "This week", "This week please."),
  chip("book-day-next-week", "Next week", "Next week please."),
];

export const BOOKING_WINDOW_CHIPS: SuggestionChip[] = [
  chip("book-win-morning", "Morning", "Morning please."),
  chip("book-win-afternoon", "Afternoon", "Afternoon please."),
  chip("book-win-any", "Any time", "Any time is fine."),
];

export const BOOKING_JOURNEY_CHIP_IDS = new Set([
  ...BOOKING_NEED_CHIPS,
  ...BOOKING_SERVICE_TYPE_CHIPS,
  ...BOOKING_GUIDANCE_CHIPS,
  ...BOOKING_RECOMMENDATION_CHIPS,
  ...BOOKING_DAY_CHIPS,
  ...BOOKING_WINDOW_CHIPS,
].map((c) => c.id));

export function isBookingJourneyChip(chip: SuggestionChip): boolean {
  return BOOKING_JOURNEY_CHIP_IDS.has(chip.id);
}

export function resolveBookingServiceLabel(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): string | null {
  const explicit = leadDraft.problemDescription?.trim();
  if (explicit && KNOWN_SERVICES.test(explicit)) {
    return dedupeServiceLabel(explicit);
  }

  const symptom = intake.issue.symptoms.join(" ").trim();
  if (/\bmot\b/i.test(symptom)) return "MOT";
  if (/\bmajor\b/i.test(symptom)) return "Major Service";
  if (/\bfull service\b/i.test(symptom)) return "Full Service";
  if (/\binterim\b/i.test(symptom)) return "Interim Service";
  if (/\bdiagnostic\b/i.test(symptom)) return "Diagnostic inspection";

  return null;
}

export function hasBookingServiceSelected(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): boolean {
  return Boolean(resolveBookingServiceLabel(intake, leadDraft));
}

export function hasBookingDaySelected(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): boolean {
  return Boolean(
    leadDraft.preferredDate?.trim() ||
      /\b(today|tomorrow|this week|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(
        intake.preferredBookingTime
      )
  );
}

export function hasBookingWindowSelected(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): boolean {
  return Boolean(
    leadDraft.callbackWindow?.trim() ||
      /\b(morning|afternoon|evening|any time|flexible)/i.test(intake.preferredBookingTime)
  );
}

export function resolveBookingJourneyProgress(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): BookingJourneyProgress {
  const serviceSelected = hasBookingServiceSelected(intake, leadDraft);
  const daySelected = hasBookingDaySelected(intake, leadDraft);
  const windowSelected = hasBookingWindowSelected(intake, leadDraft);

  if (!serviceSelected) {
    const guidance = leadDraft.urgency === "booking_guidance";
    return {
      step: guidance ? "service_guidance" : "need",
      serviceSelected,
      daySelected,
      windowSelected,
    };
  }
  if (!daySelected) {
    return { step: "appointment_day", serviceSelected, daySelected, windowSelected };
  }
  if (!windowSelected) {
    return { step: "appointment_window", serviceSelected, daySelected, windowSelected };
  }
  return { step: "ready", serviceSelected, daySelected, windowSelected };
}

export type BookingJourneyChipResult = {
  leadDraftPatch: Partial<LeadDraft>;
  structuredPatch?: Partial<StructuredIntake>;
  routeToDiagnostic?: boolean;
  assistantMessage?: string;
  nextChips?: SuggestionChip[];
};

function recommendServiceForGuidance(chipId: string): string | null {
  switch (chipId) {
    case "book-guide-overdue":
      return "Full Service";
    case "book-guide-mileage":
      return "Major Service";
    case "book-guide-lights":
      return "Diagnostic inspection";
    case "book-guide-city":
      return "Interim Service";
    default:
      return null;
  }
}

export function applyBookingJourneyChip(
  chip: SuggestionChip,
  leadDraft: LeadDraft
): BookingJourneyChipResult {
  switch (chip.id) {
    case "book-need-mot":
      return {
        leadDraftPatch: { problemDescription: "MOT" },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-need-service":
      return {
        leadDraftPatch: { urgency: "booking_service" },
        assistantMessage: "What type of service are you looking for?",
        nextChips: BOOKING_SERVICE_TYPE_CHIPS,
      };
    case "book-need-repair":
      return { leadDraftPatch: {}, routeToDiagnostic: true };
    case "book-need-unsure":
      return {
        leadDraftPatch: { urgency: "booking_guidance" },
        assistantMessage: "No problem — a couple of quick questions will help me recommend the right option.",
        nextChips: BOOKING_GUIDANCE_CHIPS,
      };
    case "book-svc-interim":
      return {
        leadDraftPatch: { problemDescription: "Interim Service" },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-svc-full":
      return {
        leadDraftPatch: { problemDescription: "Full Service" },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-svc-major":
      return {
        leadDraftPatch: { problemDescription: "Major Service" },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-svc-unsure":
      return {
        leadDraftPatch: { urgency: "booking_guidance" },
        assistantMessage: "Tell me a bit about how you use the car — I'll suggest the right service.",
        nextChips: BOOKING_GUIDANCE_CHIPS,
      };
    case "book-guide-city":
    case "book-guide-mileage":
    case "book-guide-overdue":
    case "book-guide-lights": {
      const recommended = recommendServiceForGuidance(chip.id);
      return {
        leadDraftPatch: {
          problemDescription: recommended ?? "Interim Service",
          urgency: undefined,
        },
        assistantMessage: recommended
          ? `Based on that, I'd recommend a ${recommended}. When would you like to come in?`
          : "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    }
    case "book-rec-mot":
      return {
        leadDraftPatch: { problemDescription: "MOT", urgency: undefined },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-rec-interim":
      return {
        leadDraftPatch: { problemDescription: "Interim Service", urgency: undefined },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-rec-full":
      return {
        leadDraftPatch: { problemDescription: "Full Service", urgency: undefined },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-rec-major":
      return {
        leadDraftPatch: { problemDescription: "Major Service", urgency: undefined },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-rec-diagnostic":
      return {
        leadDraftPatch: { problemDescription: "Diagnostic inspection", urgency: undefined },
        assistantMessage: "When would you like to come in?",
        nextChips: BOOKING_DAY_CHIPS,
      };
    case "book-day-today":
      return {
        leadDraftPatch: { preferredDate: "Today" },
        assistantMessage: "Preferred time window?",
        nextChips: BOOKING_WINDOW_CHIPS,
      };
    case "book-day-tomorrow":
      return {
        leadDraftPatch: { preferredDate: "Tomorrow" },
        assistantMessage: "Preferred time window?",
        nextChips: BOOKING_WINDOW_CHIPS,
      };
    case "book-day-this-week":
      return {
        leadDraftPatch: { preferredDate: "This week" },
        assistantMessage: "Preferred time window?",
        nextChips: BOOKING_WINDOW_CHIPS,
      };
    case "book-day-next-week":
      return {
        leadDraftPatch: { preferredDate: "Next week" },
        assistantMessage: "Preferred time window?",
        nextChips: BOOKING_WINDOW_CHIPS,
      };
    case "book-win-morning":
      return {
        leadDraftPatch: {
          callbackWindow: "Morning",
        },
        structuredPatch: {
          preferredBookingTime: `${leadDraft.preferredDate ?? "Flexible"} — Morning`,
        },
        assistantMessage:
          "Thanks — I'll confirm your contact details next so the workshop can reach you.",
      };
    case "book-win-afternoon":
      return {
        leadDraftPatch: { callbackWindow: "Afternoon" },
        structuredPatch: {
          preferredBookingTime: `${leadDraft.preferredDate ?? "Flexible"} — Afternoon`,
        },
        assistantMessage:
          "Thanks — I'll confirm your contact details next so the workshop can reach you.",
      };
    case "book-win-any":
      return {
        leadDraftPatch: { callbackWindow: "Any time" },
        structuredPatch: {
          preferredBookingTime: `${leadDraft.preferredDate ?? "Flexible"} — Any time`,
        },
        assistantMessage:
          "Thanks — I'll confirm your contact details next so the workshop can reach you.",
      };
    default:
      return { leadDraftPatch: {} };
  }
}

export function getBookingConversationStart(): { message: string; chips: SuggestionChip[] } {
  return {
    message: "Book MOT or service\n\nWhat do you need help with today?",
    chips: BOOKING_NEED_CHIPS,
  };
}

export function bookingJourneyBlocksContact(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): boolean {
  const progress = resolveBookingJourneyProgress(intake, leadDraft);
  return progress.step !== "ready";
}

export type ContextualBookingSource = "diagnostic_inspection" | "repair_booking";

/** Service label when entering booking from diagnostic or pricing handoff chips. */
export function resolveContextualBookingService(
  intake: StructuredIntake,
  leadDraft: LeadDraft,
  source: ContextualBookingSource
): string {
  const existing = resolveBookingServiceLabel(intake, leadDraft);
  if (existing) return existing;

  const primaryCause = intake.aiEstimate.possibleCauses.filter(Boolean)[0]?.trim();

  if (source === "repair_booking" && primaryCause) {
    let label = primaryCause.replace(/\bfailure\b/i, "repair").replace(/\bwear\b/i, "repair");
    if (!/\b(repair|inspection|service|mot)\b/i.test(label)) {
      label = `${primaryCause} repair`;
    }
    return dedupeServiceLabel(label.charAt(0).toUpperCase() + label.slice(1));
  }

  if (source === "diagnostic_inspection") {
    return "Diagnostic inspection";
  }

  const symptom = intake.issue.primarySymptom?.trim() || leadDraft.problemDescription?.trim();
  if (symptom) return dedupeServiceLabel(`${symptom} — inspection`);
  return "Diagnostic inspection";
}

/** Start guided booking at appointment preference — skips need/service when context is known. */
export function beginContextualBookingHandoff(params: {
  intake: StructuredIntake;
  leadDraft: LeadDraft;
  source: ContextualBookingSource;
}): BookingJourneyChipResult {
  const service = resolveContextualBookingService(
    params.intake,
    params.leadDraft,
    params.source
  );
  return {
    leadDraftPatch: {
      problemDescription: service,
      urgency: undefined,
    },
    assistantMessage: "When would you like to come in?",
    nextChips: BOOKING_DAY_CHIPS,
  };
}

const APPOINTMENT_DAY_PATTERNS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\btoday\b/i, value: "Today" },
  { pattern: /\btomorrow\b/i, value: "Tomorrow" },
  { pattern: /\bthis week\b/i, value: "This week" },
  { pattern: /\bnext week\b/i, value: "Next week" },
];

const APPOINTMENT_WINDOW_PATTERNS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\bmorning\b/i, value: "Morning" },
  { pattern: /\bafternoon\b/i, value: "Afternoon" },
  { pattern: /\b(?:any\s?time|flexible)\b/i, value: "Any time" },
];

/** Parse free-text day/window preferences — no exact clock times. */
export function parseAppointmentPreference(
  text: string
): { preferredDate?: string; callbackWindow?: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let preferredDate: string | undefined;
  let callbackWindow: string | undefined;

  for (const { pattern, value } of APPOINTMENT_DAY_PATTERNS) {
    if (pattern.test(trimmed)) preferredDate = value;
  }
  for (const { pattern, value } of APPOINTMENT_WINDOW_PATTERNS) {
    if (pattern.test(trimmed)) callbackWindow = value;
  }

  if (!preferredDate && !callbackWindow) return null;
  return { preferredDate, callbackWindow };
}

/** Advance contextual booking when user typed appointment preference in chat. */
export function applyParsedAppointmentPreference(
  parsed: { preferredDate?: string; callbackWindow?: string },
  leadDraft: LeadDraft
): BookingJourneyChipResult {
  const patch: Partial<LeadDraft> = {};
  if (parsed.preferredDate) patch.preferredDate = parsed.preferredDate;
  if (parsed.callbackWindow) patch.callbackWindow = parsed.callbackWindow;

  if (parsed.preferredDate && !parsed.callbackWindow) {
    return {
      leadDraftPatch: patch,
      assistantMessage: "Preferred time window?",
      nextChips: BOOKING_WINDOW_CHIPS,
    };
  }

  if (parsed.preferredDate && parsed.callbackWindow) {
    return {
      leadDraftPatch: patch,
      structuredPatch: {
        preferredBookingTime: `${parsed.preferredDate} — ${parsed.callbackWindow}`,
      },
      assistantMessage:
        "Thanks — I'll confirm your contact details next so the workshop can reach you.",
    };
  }

  if (parsed.callbackWindow && leadDraft.preferredDate?.trim()) {
    return {
      leadDraftPatch: patch,
      structuredPatch: {
        preferredBookingTime: `${leadDraft.preferredDate} — ${parsed.callbackWindow}`,
      },
      assistantMessage:
        "Thanks — I'll confirm your contact details next so the workshop can reach you.",
    };
  }

  return {
    leadDraftPatch: patch,
    assistantMessage: "When would you like to come in?",
    nextChips: BOOKING_DAY_CHIPS,
  };
}
