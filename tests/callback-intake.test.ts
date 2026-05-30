import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCallbackSummary,
  extractCustomerConcernFromTranscript,
  resolveCallbackSlotFields,
} from "../lib/services/callback-intake.ts";
import { enforceCallbackModeTurn } from "../lib/services/advisor-workflow.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import { renderAiIntakeEmailText } from "../lib/email/templates/ai-intake.ts";
import type { AiIntakeWorkshopSummary } from "../lib/types/ai-intake.ts";

describe("resolveCallbackSlotFields", () => {
  it("splits today at 12pm into date and time", () => {
    const slot = resolveCallbackSlotFields("today at 12pm", {
      preferredDate: "today at 12pm",
    });
    assert.equal(slot.preferredDate, "today");
    assert.equal(slot.preferredTime, "12pm");
  });

  it("splits today at 3pm", () => {
    const slot = resolveCallbackSlotFields(undefined, { preferredDate: "today at 3pm" });
    assert.equal(slot.preferredDate, "today");
    assert.equal(slot.preferredTime, "3pm");
  });

  it("handles monday morning", () => {
    const slot = resolveCallbackSlotFields(undefined, { preferredDate: "monday morning" });
    assert.equal(slot.preferredDate, "monday");
    assert.equal(slot.preferredTime, "morning");
  });

  it("handles next week", () => {
    const slot = resolveCallbackSlotFields(undefined, { preferredDate: "next week" });
    assert.equal(slot.preferredDate, "next week");
    assert.match(slot.preferredTime, /any time/i);
  });

  it("preserves already-split fields", () => {
    const slot = resolveCallbackSlotFields(undefined, {
      preferredDate: "tomorrow",
      callbackWindow: "afternoon",
    });
    assert.equal(slot.preferredDate, "tomorrow");
    assert.equal(slot.preferredTime, "afternoon");
  });
});

describe("buildCallbackSummary", () => {
  it("never returns empty text", () => {
    const summary = buildCallbackSummary({
      symptoms: "",
      intent: "callback",
      urgency: "medium",
    });
    assert.ok(summary.trim().length > 0);
  });

  it("includes concern estimate and urgency", () => {
    const summary = buildCallbackSummary({
      symptoms: "Brake squeal when stopping",
      estimatedRange: "£120–£180",
      intent: "callback",
      urgency: "high",
      callbackReason: "Customer requested callback",
    });
    assert.match(summary, /Brake squeal/);
    assert.match(summary, /£120–£180/);
    assert.match(summary, /high/i);
    assert.match(summary, /Reason for callback/);
  });
});

describe("extractCustomerConcernFromTranscript", () => {
  it("pulls issue lines and skips phone-only messages", () => {
    const concern = extractCustomerConcernFromTranscript([
      { id: "1", role: "user", content: "My brakes squeal when I stop", createdAt: "" },
      { id: "2", role: "assistant", content: "When does it happen?", createdAt: "" },
      { id: "3", role: "user", content: "Call me on 07667123456", createdAt: "" },
    ]);
    assert.match(concern, /brakes squeal/i);
    assert.doesNotMatch(concern, /07667/);
  });
});

describe("enforceCallbackModeTurn", () => {
  const baseIntake = {
    ...createEmptyStructuredIntake(),
    intent: "callback" as const,
    issue: {
      ...createEmptyStructuredIntake().issue,
      symptoms: ["Brake noise"],
    },
    customer: { name: "Jane Doe", contact: "07850964041" },
  };

  it("replaces diagnostic questions with confirmation when intake is complete", () => {
    const turn = enforceCallbackModeTurn({
      mode: "callback",
      intake: baseIntake,
      leadDraft: { name: "Jane Doe", phone: "07850964041" },
      content: "What further details would you like to add?",
      validation: {
        customerName: true,
        phone: true,
        vehicle: false,
        issue: true,
        day: true,
        time: true,
        canSubmit: true,
      },
      handoffAllowed: true,
    });
    assert.match(turn.content, /Send request|check the summary/i);
    assert.equal(turn.chips?.[0]?.id, "callback-confirm-send");
  });
});

describe("callback email brief", () => {
  it("puts callback summary before transcript", () => {
    const caseSummary = {
      kind: "callback" as const,
      customerName: "Jane Doe",
      customerPhone: "07850964041",
      registration: "AB12CDE",
      vehicle: "2018 Ford Focus",
      symptoms: "Brake squeal when stopping",
      callbackReason: "Customer requested a callback regarding brake pad replacement pricing.",
      estimatedRange: "£120–£180",
      urgency: "medium" as const,
      drivability: "drives_normally" as const,
      preferredDate: "today",
      preferredTime: "12pm",
      preparedAt: new Date().toISOString(),
    };

    const summary: AiIntakeWorkshopSummary = {
      caseSummary,
      customerName: "Jane Doe",
      customerPhone: "07850964041",
      registration: "AB12CDE",
      vehicle: "2018 Ford Focus",
      serviceRequested: "Brakes",
      symptoms: "Brake squeal when stopping",
      warningLights: [],
      drivability: "drives_normally",
      possibleCauses: ["Worn pads"],
      estimatedRange: "£120–£180",
      urgency: "medium",
      aiSummary: "Likely pad wear",
      intent: "callback",
      callbackPreferredDate: "today",
      callbackPreferredTime: "12pm",
      callbackReason: caseSummary.callbackReason,
      callbackSummary:
        "Customer concern: Brake squeal when stopping\nEstimate discussed: £120–£180",
      callbackRequested: true,
      observations: [],
      clarificationNotes: [],
      uploadedFiles: [],
      transcript: [{ id: "1", role: "user", content: "Brake squeal", createdAt: "" }],
      chatSessionId: "sess_test",
      preparedAt: new Date().toISOString(),
      partial: false,
      missingFields: [],
    };

    const text = renderAiIntakeEmailText(summary);
    const briefIdx = text.indexOf("CALLBACK REQUEST — AB12CDE");
    const transcriptIdx = text.indexOf("Conversation transcript (reference only)");
    assert.ok(briefIdx >= 0);
    assert.ok(transcriptIdx > briefIdx);
    assert.match(text, /Brake squeal when stopping/);
    assert.match(text, /today at 12pm/i);
    assert.doesNotMatch(text, /Issue Description[\s\S]*Not specified/);
  });
});
