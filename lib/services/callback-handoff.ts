import { validateLeadCompletion } from "@/lib/services/advisor-workflow";
import { createEmptyStructuredIntake } from "@/lib/types/structured-intake";
import type { LeadDraft } from "@/lib/types/chat";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import { isAffirmativeBookingConfirmation } from "@/lib/services/booking-handoff";

export function isAffirmativeCallbackConfirmation(text: string): boolean {
  return isAffirmativeBookingConfirmation(text);
}

export function isCallbackHandoffReady(
  mode: string | undefined,
  intake: StructuredIntake | undefined,
  leadDraft: LeadDraft,
  registrationHint?: string
): boolean {
  if (mode !== "callback") return false;
  return validateLeadCompletion(
    "callback",
    intake ?? createEmptyStructuredIntake(),
    leadDraft,
    registrationHint
  ).canSubmit;
}
