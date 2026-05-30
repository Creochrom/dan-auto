import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type { HeroConciergeMode } from "@/lib/types/hero-concierge";
import type { LeadDraft } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";
import { stripAdvisorSemanticLabels } from "@/lib/chat/customer-facing";
import {
  applyUnifiedIntakeQuality,
  diagnosticSummaryReady,
  getMissingIntakeFields,
  stripPrematureDiagnosticHandoffChips,
} from "@/lib/intake/unified-intake";
import { BOOKING_CONFIRM_CHIP_ID } from "@/lib/config/booking-flow-copy";
import {
  CALLBACK_CONFIRM_CHIP_ID,
  CALLBACK_TIME_CHIP_IDS,
} from "@/lib/config/callback-flow-copy";
import {
  callbackConfirmationContent,
  callbackTimingPromptContent,
  isDiagnosticCallbackQuestion,
} from "@/lib/services/callback-intake";
import type { ChatMessage } from "@/lib/types/chat";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import { hasBookingServiceSelected } from "@/lib/booking/booking-journey";
import {
  validateCustomerName,
  validateCustomerPhone,
  validateLeadContact,
  isPlaceholderContactInput,
} from "@/lib/validation/advisor-contact";

export const PRICING_ACTION_BOOK = "pricing-action-book";
export const PRICING_ACTION_CALLBACK = "pricing-action-callback";
export const PRICING_ACTION_QUESTION = "pricing-action-question";

export type WorkflowMode = HeroConciergeMode | "general";

export type LeadCompletionValidation = {
  customerName: boolean;
  phone: boolean;
  vehicle: boolean;
  issue: boolean;
  day: boolean;
  time: boolean;
  canSubmit: boolean;
};

const DAY_HINT =
  /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|asap|any\s?day|\d{1,2}[\/-]\d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i;

const TIME_HINT =
  /\b(morning|afternoon|evening|night|am|pm|\d{1,2}:\d{2}|\d{1,2}\s?(?:am|pm)|before\s+\d|after\s+\d|any\s?time|asap|flexible)/i;

const FORBIDDEN_COMPLETION =
  /\b(booking\s+confirmed|appointment\s+booked|appointment\s+is\s+booked|has\s+been\s+booked|we(?:'ve|\s+have)\s+booked|is\s+scheduled|been\s+scheduled|scheduled\s+for|reserved|availability\s+confirmed|we\s+will\s+contact\s+you\s+shortly|sent\s+(?:this\s+)?to\s+the\s+workshop|request\s+(?:has\s+been\s+)?submitted|mechanic\s+has\s+received|already\s+sent|confirmed\s+for\s+\w+|your\s+slot\s+is\s+confirmed|visit\s+is\s+confirmed)/i;

export function resolveWorkflowMode(route?: AdvisorRouteContext): WorkflowMode {
  return route?.concierge_mode ?? "general";
}

export function hasVehicleContext(
  intake: StructuredIntake,
  registrationHint?: string
): boolean {
  return Boolean(
    registrationHint?.trim() ||
      intake.vehicle.make.trim() ||
      intake.vehicle.model.trim() ||
      intake.vehicle.year.trim()
  );
}

export function hasIssueContext(intake: StructuredIntake, leadDraft?: LeadDraft): boolean {
  return Boolean(
    intake.issue.symptoms.length > 0 ||
      intake.aiEstimate.estimatedPriceRange.trim() ||
      intake.aiEstimate.summary.trim() ||
      leadDraft?.problemDescription?.trim()
  );
}

export function pricingEstimateReady(intake: StructuredIntake): boolean {
  return Boolean(intake.aiEstimate.estimatedPriceRange.trim());
}

function bookingSlotHints(
  intake: StructuredIntake,
  leadDraft: LeadDraft
): { day: boolean; time: boolean } {
  const slot = intake.preferredBookingTime.trim();
  return {
    day: Boolean(leadDraft.preferredDate?.trim()) || DAY_HINT.test(slot),
    time: Boolean(leadDraft.callbackWindow?.trim()) || TIME_HINT.test(slot),
  };
}

export function sanitizeStructuredIntakeContact(
  intake: StructuredIntake
): StructuredIntake {
  const name = validateCustomerName(intake.customer.name);
  const phone = validateCustomerPhone(intake.customer.contact);
  return {
    ...intake,
    customer: {
      name: name.valid ? name.normalized : "",
      contact: phone.valid ? phone.normalized : "",
    },
  };
}

export function sanitizeLeadDraftContact(leadDraft: LeadDraft): LeadDraft {
  const name = validateCustomerName(leadDraft.name);
  const phone = validateCustomerPhone(leadDraft.phone);
  return {
    ...leadDraft,
    name: name.valid ? name.normalized : undefined,
    phone: phone.valid ? phone.normalized : undefined,
  };
}

export function validateLeadCompletion(
  mode: WorkflowMode,
  intake: StructuredIntake,
  leadDraft: LeadDraft = {},
  registrationHint?: string
): LeadCompletionValidation {
  const contact = validateLeadContact(
    leadDraft.name ?? intake.customer.name,
    leadDraft.phone ?? intake.customer.contact
  );
  const vehicle = hasVehicleContext(intake, registrationHint);
  const issue = hasIssueContext(intake, leadDraft);
  const slot = bookingSlotHints(intake, leadDraft);

  switch (mode) {
    case "callback":
      return {
        customerName: contact.customerName,
        phone: contact.phone,
        vehicle,
        issue,
        day: true,
        time: true,
        canSubmit: contact.canSubmit && issue,
      };
    case "booking":
      return {
        customerName: contact.customerName,
        phone: contact.phone,
        vehicle,
        issue: hasBookingServiceSelected(intake, leadDraft),
        day: slot.day,
        time: slot.time,
        canSubmit:
          contact.canSubmit &&
          slot.day &&
          slot.time &&
          hasBookingServiceSelected(intake, leadDraft),
      };
    case "pricing":
    case "diagnostic":
    case "quick_question":
    case "hub":
    case "general":
    default:
      return {
        customerName: contact.customerName,
        phone: contact.phone,
        vehicle,
        issue,
        day: slot.day,
        time: slot.time,
        canSubmit: false,
      };
  }
}

/** @deprecated Gemini intakeComplete is ignored — use validateLeadCompletion().canSubmit */
export function canCompleteHandoff(
  mode: WorkflowMode,
  intake: StructuredIntake,
  leadDraft: LeadDraft,
  _modelMarkedComplete?: boolean,
  registrationHint?: string
): boolean {
  return validateLeadCompletion(mode, intake, leadDraft, registrationHint).canSubmit;
}

/** Handoff chips and submission eligibility — validation only, not Gemini state. */
export function isHandoffClaimAllowed(
  validation: LeadCompletionValidation
): boolean {
  return validation.canSubmit;
}

/** Intake complete flag for booking/callback — derived from validation, not Gemini. */
export function isHandoffIntakeComplete(
  mode: WorkflowMode,
  validation: LeadCompletionValidation
): boolean {
  if (mode === "booking" || mode === "callback") {
    return validation.canSubmit;
  }
  return false;
}

export function shouldBlockPrematureCompletionMessage(
  message: string,
  handoffAllowed: boolean
): boolean {
  if (handoffAllowed) return false;
  return FORBIDDEN_COMPLETION.test(message);
}

export function softenPrematureCompletionMessage(message: string): string {
  const softened = message
    .replace(FORBIDDEN_COMPLETION, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (softened.length >= 12) return softened;
  return "I still need a few details before I can send this to the workshop.";
}

const BRACKET_CONTACT_PLACEHOLDER =
  /\[(?:your\s+)?(?:name|full\s+name|mobile(?:\s+number)?|phone(?:\s+number)?|contact(?:\s+details)?|number)\]/gi;

const HANDOFF_CONFIRM_CHIP_IDS = new Set([
  CALLBACK_CONFIRM_CHIP_ID,
  BOOKING_CONFIRM_CHIP_ID,
]);

function isPlaceholderChip(chip: SuggestionChip): boolean {
  return (
    isPlaceholderContactInput(chip.message) || isPlaceholderContactInput(chip.label)
  );
}

/** Remove bracket placeholders unless validated contact values exist to substitute. */
export function sanitizeAssistantContactPlaceholders(
  message: string,
  validation: LeadCompletionValidation,
  contact?: { name?: string; phone?: string }
): string {
  const hadBracketPlaceholders = BRACKET_CONTACT_PLACEHOLDER.test(message);
  BRACKET_CONTACT_PLACEHOLDER.lastIndex = 0;
  if (!hadBracketPlaceholders) return message;

  if (validation.canSubmit && contact?.name?.trim() && contact?.phone?.trim()) {
    const phone = validateCustomerPhone(contact.phone);
    const displayPhone = phone.valid ? phone.display : contact.phone.trim();
    return message
      .replace(/\[(?:your\s+)?(?:name|full\s+name)\]/gi, contact.name.trim())
      .replace(
        /\[(?:your\s+)?(?:mobile(?:\s+number)?|phone(?:\s+number)?|number)\]/gi,
        displayPhone
      );
  }

  if (!validation.customerName && !validation.phone) {
    return "I still need your full name and a valid UK mobile number before I can send this to the workshop.";
  }
  if (!validation.customerName) {
    return "I still need your full name before I can send this to the workshop.";
  }
  if (!validation.phone) {
    return "I still need a valid UK mobile number before I can send this to the workshop.";
  }

  let text = message.replace(BRACKET_CONTACT_PLACEHOLDER, "").replace(/\s{2,}/g, " ").trim();
  return text.length >= 12
    ? text
    : "I still need a few contact details before I can send this to the workshop.";
}

/**
 * Gate handoff chips until WORKFLOW_VALIDATION.canSubmit is true.
 * Prevents premature "Send request" / timing chips when contact is placeholder or missing.
 */
export function enforceHandoffWorkflowChips(params: {
  mode: WorkflowMode;
  chips?: SuggestionChip[];
  validation: LeadCompletionValidation;
  handoffAllowed: boolean;
  intake?: StructuredIntake;
}): SuggestionChip[] | undefined {
  if (!params.chips?.length) return params.chips;

  let chips = params.chips.filter((chip) => !isPlaceholderChip(chip));

  if (params.mode === "callback") {
    if (!params.validation.customerName || !params.validation.phone) {
      const blocked = new Set<string>([
        CALLBACK_CONFIRM_CHIP_ID,
        ...CALLBACK_TIME_CHIP_IDS,
      ]);
      chips = chips.filter((chip) => !blocked.has(chip.id));
    }
  }

  if (params.mode === "diagnostic" && params.intake && !diagnosticSummaryReady(params.intake)) {
    chips = stripPrematureDiagnosticHandoffChips(chips) ?? [];
  }

  if (!params.handoffAllowed) {
    chips = chips.filter((chip) => !HANDOFF_CONFIRM_CHIP_IDS.has(chip.id));
  }

  return chips?.length ? chips : undefined;
}

export function getPricingNextActionChips(): SuggestionChip[] {
  return [
    {
      id: PRICING_ACTION_BOOK,
      label: "Book appointment",
      message: "I would like to book an appointment for this repair.",
    },
    {
      id: PRICING_ACTION_CALLBACK,
      label: "Request callback",
      message: "I would like a mechanic to call me back about this estimate.",
    },
    {
      id: PRICING_ACTION_QUESTION,
      label: "Ask another question",
      message: "I have another question about this repair estimate.",
    },
  ];
}

export function formatPricingTerminalContent(content: string): string {
  let text = content.trim();
  if (shouldBlockPrematureCompletionMessage(text, false)) {
    text = softenPrematureCompletionMessage(text);
  }

  text = stripAdvisorSemanticLabels(text);
  text = text.replace(/\n\nChoose below[^\n]*/gi, "").trim();
  return text;
}

/** Lock pricing mode to quote intent once an estimate range exists. */
export function applyPricingTerminalIntent(intake: StructuredIntake): StructuredIntake {
  if (!pricingEstimateReady(intake)) return intake;
  if (intake.intent === "book" || intake.intent === "callback") return intake;
  return { ...intake, intent: "quote" };
}

export function enforcePricingModeTurn(params: {
  mode: WorkflowMode;
  intake: StructuredIntake;
  content: string;
  chips?: SuggestionChip[];
  handoffAllowed: boolean;
}): { content: string; chips?: SuggestionChip[] } {
  if (params.mode !== "pricing" || !pricingEstimateReady(params.intake)) {
    return { content: params.content, chips: params.chips };
  }

  const content = formatPricingTerminalContent(params.content);

  return {
    content,
    chips: getPricingNextActionChips(),
  };
}

const CALLBACK_TIME_CHIPS: SuggestionChip[] = [
  { id: "callback-time-asap", label: "ASAP", message: "ASAP — call me as soon as possible" },
  { id: "callback-time-morning", label: "Morning", message: "Morning please" },
  { id: "callback-time-afternoon", label: "Afternoon", message: "Afternoon please" },
  { id: "callback-time-evening", label: "Evening", message: "Evening please" },
  { id: "callback-time-any", label: "Any time", message: "Any time is fine" },
];

/** Stop diagnostic questioning once callback intake has issue + contact. */
export function enforceCallbackModeTurn(params: {
  mode: WorkflowMode;
  intake: StructuredIntake;
  leadDraft: LeadDraft;
  content: string;
  chips?: SuggestionChip[];
  validation: LeadCompletionValidation;
  handoffAllowed: boolean;
  messages?: ChatMessage[];
}): { content: string; chips?: SuggestionChip[] } {
  if (params.mode !== "callback") {
    return { content: params.content, chips: params.chips };
  }

  const hasIssue = params.validation.issue;
  const hasContact = params.validation.customerName && params.validation.phone;

  if (!hasIssue || !hasContact) {
    return { content: params.content, chips: params.chips };
  }

  const name = params.leadDraft.name ?? params.intake.customer.name;

  if (params.handoffAllowed && params.validation.canSubmit) {
    const needsConfirmation =
      isDiagnosticCallbackQuestion(params.content) ||
      /\?\s*$/.test(params.content.trim());
    return {
      content: needsConfirmation ? callbackConfirmationContent(name) : params.content,
      chips: [
        {
          id: CALLBACK_CONFIRM_CHIP_ID,
          label: "Send request",
          message: "Yes, please send my callback request",
        },
      ],
    };
  }

  if (isDiagnosticCallbackQuestion(params.content)) {
    const hasTiming = Boolean(
      params.leadDraft.callbackWindow?.trim() ||
        params.intake.preferredBookingTime.trim()
    );
    return {
      content: hasTiming ? callbackConfirmationContent(name) : callbackTimingPromptContent(),
      chips: hasTiming
        ? [
            {
              id: CALLBACK_CONFIRM_CHIP_ID,
              label: "Send request",
              message: "Yes, please send my callback request",
            },
          ]
        : CALLBACK_TIME_CHIPS,
    };
  }

  return { content: params.content, chips: params.chips };
}

export function applyCallbackIntakeQuality(params: {
  mode: WorkflowMode;
  intake: StructuredIntake;
  leadDraft: LeadDraft;
  messages: ChatMessage[];
  userMessage: string;
}): { intake: StructuredIntake; leadDraft: LeadDraft } {
  return applyUnifiedIntakeQuality(params);
}

export function workflowValidationBlock(
  mode: WorkflowMode,
  validation: LeadCompletionValidation,
  intake?: StructuredIntake,
  leadDraft?: LeadDraft
): string {
  const missing =
    intake && leadDraft ? getMissingIntakeFields(mode, intake, leadDraft) : [];
  return `WORKFLOW_VALIDATION: ${JSON.stringify({
    mode,
    customerName: validation.customerName,
    phone: validation.phone,
    vehicle: validation.vehicle,
    issue: validation.issue,
    day: validation.day,
    time: validation.time,
    canSubmit: validation.canSubmit,
    missingFields: missing,
  })}`;
}
