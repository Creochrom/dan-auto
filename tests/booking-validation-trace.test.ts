import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canCompleteHandoff,
  isHandoffClaimAllowed,
  isHandoffIntakeComplete,
  validateLeadCompletion,
} from "../lib/services/advisor-workflow.ts";
import {
  emitBookingValidationTrace,
  explainIntakeComplete,
} from "../lib/logging/booking-validation-trace.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import type { LeadDraft } from "../lib/types/chat.ts";
import type { StructuredIntake } from "../lib/types/structured-intake.ts";

const LOGGED_GEMINI_RESPONSE = {
  preferredBookingTime: "Saturday 11:00 AM",
  intakeComplete: false,
  customer: { name: "James Smith", contact: "07850964041" },
  issueSymptoms: ["MOT service"],
  leadDraft: {} as LeadDraft,
  registrationHint: "AB12 CDE",
  modelMarkedComplete: false,
};

function buildIntakeFromEvidence(
  overrides?: Partial<{
    preferredBookingTime: string;
    customer: { name: string; contact: string };
    symptoms: string[];
  }>
): StructuredIntake {
  const base = createEmptyStructuredIntake();
  return {
    ...base,
    preferredBookingTime:
      overrides?.preferredBookingTime ?? LOGGED_GEMINI_RESPONSE.preferredBookingTime,
    customer: overrides?.customer ?? LOGGED_GEMINI_RESPONSE.customer,
    issue: {
      ...base.issue,
      symptoms: overrides?.symptoms ?? LOGGED_GEMINI_RESPONSE.issueSymptoms,
    },
    intent: "book",
  };
}

describe("booking validation trace — logged evidence", () => {
  it("prints BOOKING_VALIDATION_TRACE for Saturday 11:00 AM scenario", () => {
    const intake = buildIntakeFromEvidence();
    const leadDraft = LOGGED_GEMINI_RESPONSE.leadDraft;

    const trace = emitBookingValidationTrace({
      mode: "booking",
      structuredIntake: intake,
      leadDraft,
      registrationHint: LOGGED_GEMINI_RESPONSE.registrationHint,
      modelMarkedComplete: LOGGED_GEMINI_RESPONSE.modelMarkedComplete,
      geminiIntakeComplete: LOGGED_GEMINI_RESPONSE.intakeComplete,
    });

    assert.equal(trace.validation.day, true);
    assert.equal(trace.validation.time, true);
    assert.equal(trace.validation.customerName, true);
    assert.equal(trace.validation.phone, true);
    assert.equal(trace.validation.canSubmit, true);
    assert.equal(trace.intakeComplete, true);
    assert.equal(trace.handoffAllowed, true);
    assert.deepEqual(trace.missingFields, []);
    assert.match(trace.intakeCompleteReason, /validation\.canSubmit/);
  });

  it("identifies invalid contact when phone is placeholder text only", () => {
    const intake = buildIntakeFromEvidence({
      customer: { name: "James Smith", contact: "Call me" },
    });

    const trace = emitBookingValidationTrace({
      mode: "booking",
      structuredIntake: intake,
      leadDraft: {},
      registrationHint: "AB12 CDE",
      modelMarkedComplete: false,
      geminiIntakeComplete: false,
    });

    assert.equal(trace.validation.canSubmit, false);
    assert.equal(trace.handoffAllowed, false);
    assert.ok(trace.missingFields.some((f) => f.includes("customerPhone")));
  });

  it("identifies missing slot when preferredBookingTime empty", () => {
    const intake = buildIntakeFromEvidence({
      preferredBookingTime: "",
      customer: { name: "James Smith", contact: "07850964041" },
    });

    const trace = emitBookingValidationTrace({
      mode: "booking",
      structuredIntake: intake,
      leadDraft: {},
      registrationHint: "AB12 CDE",
      modelMarkedComplete: true,
      geminiIntakeComplete: true,
    });

    assert.equal(trace.validation.canSubmit, false);
    assert.ok(trace.missingFields.some((f) => f.includes("preferredDate") || f.includes("day")));
    assert.ok(trace.missingFields.some((f) => f.includes("time")));
  });
});

describe("intakeComplete gate", () => {
  it("derives intakeComplete from validation for booking", () => {
    const intake = buildIntakeFromEvidence();
    const validation = validateLeadCompletion("booking", intake, {}, "AB12 CDE");
    assert.equal(validation.canSubmit, true);
    assert.equal(isHandoffIntakeComplete("booking", validation), true);
    assert.equal(isHandoffClaimAllowed(validation), true);
    assert.equal(canCompleteHandoff("booking", intake, {}, false, "AB12 CDE"), true);
  });
});
