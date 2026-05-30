import type { LeadDraft } from "@/lib/types/chat";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import {
  isHandoffClaimAllowed,
  isHandoffIntakeComplete,
  validateLeadCompletion,
  type LeadCompletionValidation,
  type WorkflowMode,
} from "@/lib/services/advisor-workflow";
import { inferBookingService, resolveBookingSlotFields } from "@/lib/services/booking-handoff";
import { validateCustomerName, validateCustomerPhone } from "@/lib/validation/advisor-contact";

export type BookingValidationTrace = {
  structuredIntake: {
    preferredBookingTime: string;
    customerName: string;
    customerPhone: string;
    intent: string;
    symptoms: string[];
  };
  leadDraft: {
    name?: string;
    phone?: string;
    preferredDate?: string;
    callbackWindow?: string;
    registration?: string;
  };
  validation: LeadCompletionValidation;
  service: string;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  missingFields: string[];
  blockingRules: string[];
  canSubmit: boolean;
  handoffAllowed: boolean;
  modelMarkedComplete: boolean;
  geminiIntakeComplete?: boolean;
  intakeComplete: boolean;
  intakeCompleteReason: string;
};

function emit(label: string, lines: string[]): void {
  console.info(label);
  for (const line of lines) {
    console.info(line);
  }
}

export function listBookingMissingFields(
  validation: LeadCompletionValidation,
  intake: StructuredIntake,
  leadDraft: LeadDraft
): string[] {
  const missing: string[] = [];
  const resolvedName = leadDraft.name ?? intake.customer.name;
  const resolvedPhone = leadDraft.phone ?? intake.customer.contact;

  if (!validation.customerName) {
    const nameCheck = validateCustomerName(resolvedName);
    missing.push(
      nameCheck.valid ? "customerName" : `customerName (rejected: "${resolvedName || ""}")`
    );
  }
  if (!validation.phone) {
    const phoneCheck = validateCustomerPhone(resolvedPhone);
    missing.push(
      phoneCheck.valid ? "customerPhone" : `customerPhone (rejected: "${resolvedPhone || ""}")`
    );
  }
  if (!validation.day) {
    missing.push(
      `preferredDate/day (leadDraft.preferredDate="${leadDraft.preferredDate ?? ""}", preferredBookingTime="${intake.preferredBookingTime}")`
    );
  }
  if (!validation.time) {
    missing.push(
      `preferredTime/time (leadDraft.callbackWindow="${leadDraft.callbackWindow ?? ""}", preferredBookingTime="${intake.preferredBookingTime}")`
    );
  }
  return missing;
}

export function listBookingBlockingRules(
  validation: LeadCompletionValidation,
  mode: WorkflowMode
): string[] {
  if (mode !== "booking") return [];
  const rules: string[] = [];
  if (!validation.customerName || !validation.phone) {
    rules.push("contact.canSubmit (requires validateCustomerName AND validateCustomerPhone)");
  }
  if (!validation.day) {
    rules.push(
      "slot.day (leadDraft.preferredDate OR DAY_HINT.test(structuredIntake.preferredBookingTime))"
    );
  }
  if (!validation.time) {
    rules.push(
      "slot.time (leadDraft.callbackWindow OR TIME_HINT.test(structuredIntake.preferredBookingTime))"
    );
  }
  if (validation.canSubmit) {
    rules.push("canSubmit = contact.canSubmit && slot.day && slot.time → all true");
  } else {
    rules.push("canSubmit = contact.canSubmit && slot.day && slot.time → false");
  }
  rules.push("handoffAllowed = validation.canSubmit (Gemini intakeComplete ignored)");
  return rules;
}

export function explainIntakeComplete(
  mode: WorkflowMode,
  intake: StructuredIntake,
  leadDraft: LeadDraft,
  _modelMarkedComplete: boolean,
  registrationHint?: string
): string {
  const validation = validateLeadCompletion(mode, intake, leadDraft, registrationHint);
  const intakeComplete = isHandoffIntakeComplete(mode, validation);

  if (mode === "booking" || mode === "callback") {
    return `intakeComplete: ${intakeComplete} — derived from validation.canSubmit (Gemini intakeComplete ignored); canSubmit: ${validation.canSubmit}`;
  }

  return `intakeComplete: ${intakeComplete}`;
}

export function emitBookingValidationTrace(params: {
  mode: WorkflowMode;
  structuredIntake: StructuredIntake;
  leadDraft: LeadDraft;
  registrationHint?: string;
  modelMarkedComplete: boolean;
  geminiIntakeComplete?: boolean;
}): BookingValidationTrace {
  const { structuredIntake, leadDraft, registrationHint, modelMarkedComplete } = params;
  const validation = validateLeadCompletion(
    params.mode,
    structuredIntake,
    leadDraft,
    registrationHint
  );
  const slot = resolveBookingSlotFields(structuredIntake, leadDraft);
  const service = inferBookingService(structuredIntake, leadDraft);
  const missingFields = listBookingMissingFields(validation, structuredIntake, leadDraft);
  const blockingRules = listBookingBlockingRules(validation, params.mode);
  const intakeComplete = isHandoffIntakeComplete(params.mode, validation);
  const handoffAllowed = isHandoffClaimAllowed(validation);
  const intakeCompleteReason = explainIntakeComplete(
    params.mode,
    structuredIntake,
    leadDraft,
    modelMarkedComplete,
    registrationHint
  );

  const resolvedName = leadDraft.name ?? structuredIntake.customer.name ?? "";
  const resolvedPhone = leadDraft.phone ?? structuredIntake.customer.contact ?? "";

  const trace: BookingValidationTrace = {
    structuredIntake: {
      preferredBookingTime: structuredIntake.preferredBookingTime,
      customerName: structuredIntake.customer.name,
      customerPhone: structuredIntake.customer.contact,
      intent: structuredIntake.intent,
      symptoms: structuredIntake.issue.symptoms,
    },
    leadDraft: {
      name: leadDraft.name,
      phone: leadDraft.phone,
      preferredDate: leadDraft.preferredDate,
      callbackWindow: leadDraft.callbackWindow,
      registration: leadDraft.registration,
    },
    validation,
    service,
    preferredDate: slot.preferredDate,
    preferredTime: slot.preferredTime,
    customerName: resolvedName,
    customerPhone: resolvedPhone,
    missingFields,
    blockingRules,
    canSubmit: validation.canSubmit,
    handoffAllowed,
    modelMarkedComplete,
    geminiIntakeComplete: params.geminiIntakeComplete,
    intakeComplete,
    intakeCompleteReason,
  };

  emit("BOOKING_VALIDATION_TRACE_START", [
    `service: ${service}`,
    `customerName: ${resolvedName || "(empty)"}`,
    `customerPhone: ${resolvedPhone || "(empty)"}`,
    `preferredDate: ${slot.preferredDate}`,
    `preferredTime: ${slot.preferredTime}`,
    `structuredIntake.preferredBookingTime: ${structuredIntake.preferredBookingTime || "(empty)"}`,
    `leadDraft.preferredDate: ${leadDraft.preferredDate ?? "(empty)"}`,
    `leadDraft.callbackWindow: ${leadDraft.callbackWindow ?? "(empty)"}`,
    `validation.day: ${validation.day}`,
    `validation.time: ${validation.time}`,
    `validation.customerName: ${validation.customerName}`,
    `validation.phone: ${validation.phone}`,
    `missingFields: ${missingFields.length ? missingFields.join("; ") : "(none)"}`,
    `blockingRules: ${blockingRules.join(" | ")}`,
    `canSubmit: ${validation.canSubmit}`,
    `handoffAllowed (validation.canSubmit): ${handoffAllowed}`,
    `modelMarkedComplete (Gemini intakeComplete): ${modelMarkedComplete}`,
    `intakeComplete (computed): ${intakeComplete}`,
    `intakeCompleteReason: ${intakeCompleteReason}`,
    `sendBookingChipVisible: ${handoffAllowed}`,
    `structuredIntake: ${JSON.stringify(trace.structuredIntake)}`,
    `leadDraft: ${JSON.stringify(trace.leadDraft)}`,
  ]);
  emit("BOOKING_VALIDATION_TRACE_END", []);

  return trace;
}
