import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderAiIntakeEmailText } from "../lib/email/templates/ai-intake.ts";
import { renderBookingIntakeEmailText } from "../lib/email/templates/booking-intake.ts";
import {
  buildWorkshopCaseSummary,
  resolveCaseSymptoms,
} from "../lib/workshop/build-workshop-case-summary.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import type { AiIntakeWorkshopSummary } from "../lib/types/ai-intake.ts";
import type { ChatSession } from "../lib/types/chat.ts";
import type { ServiceIntakeSummary } from "../lib/types/service-intake.ts";

function sampleSession(overrides: Partial<ChatSession> = {}): ChatSession {
  const structured = {
    ...createEmptyStructuredIntake(),
    intent: "callback" as const,
    issue: {
      ...createEmptyStructuredIntake().issue,
      symptoms: ["Brake squeak while braking"],
    },
    vehicle: {
      make: "BMW",
      model: "320D",
      year: "2015",
      engine: "2.0L Diesel",
      mileage: "",
    },
    aiEstimate: {
      ...createEmptyStructuredIntake().aiEstimate,
      estimatedPriceRange: "£120–£250 per axle",
      recommendedNextStep:
        "Call customer and confirm whether front, rear, or both axles require inspection.",
      summary:
        "Customer requested a callback regarding brake pad replacement pricing.",
    },
    customer: { name: "Ruslan", contact: "07667787786" },
    preferredBookingTime: "today at 12pm",
  };

  return {
    id: "sess_test",
    messages: [
      {
        id: "1",
        role: "user",
        content: "My brakes squeak when I stop",
        createdAt: new Date().toISOString(),
      },
    ],
    leadDraft: {
      name: "Ruslan",
      phone: "07667787786",
      registration: "MV57 HJX",
      preferredDate: "today at 12pm",
    },
    structuredIntake: structured,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildWorkshopCaseSummary", () => {
  it("prefers structuredIntake symptoms over legacy placeholders", () => {
    const session = sampleSession({
      mechanicSummary: {
        symptoms: "Not specified",
        possibleCauses: [],
        estimatedRange: "£0",
        severity: "medium",
        severityNote: "",
        callbackRequested: true,
      },
    });

    const caseSummary = buildWorkshopCaseSummary(session, { kind: "callback" });
    assert.match(caseSummary.symptoms, /Brake squeak/i);
    assert.match(caseSummary.vehicleEngine ?? "", /Diesel/i);
    assert.match(caseSummary.callbackReason ?? "", /brake pad replacement pricing/i);
    assert.equal(caseSummary.preferredDate, "today");
    assert.equal(caseSummary.preferredTime, "12pm");
  });

  it("resolveCaseSymptoms never returns placeholder text when structured symptoms exist", () => {
    const session = sampleSession();
    assert.match(resolveCaseSymptoms(session), /Brake squeak/i);
  });
});

describe("callback email brief", () => {
  it("puts mechanic case summary before transcript", () => {
    const session = sampleSession();
    const caseSummary = buildWorkshopCaseSummary(session, { kind: "callback" });

    const summary: AiIntakeWorkshopSummary = {
      caseSummary,
      customerName: "Ruslan",
      customerPhone: "07667787786",
      registration: "MV57 HJX",
      vehicle: "2015 BMW 320D",
      vehicleEngine: "2.0L Diesel",
      serviceRequested: "Brakes",
      symptoms: caseSummary.symptoms,
      warningLights: [],
      drivability: "unknown",
      possibleCauses: ["Worn pads"],
      estimatedRange: "£120–£250 per axle",
      urgency: "medium",
      aiSummary: caseSummary.callbackReason ?? "",
      intent: "callback",
      callbackPreferredDate: "today",
      callbackPreferredTime: "12pm",
      callbackReason: caseSummary.callbackReason,
      callbackSummary: "Customer concern: Brake squeak while braking",
      callbackRequested: true,
      observations: [],
      clarificationNotes: [],
      uploadedFiles: [],
      transcript: session.messages,
      chatSessionId: "sess_test",
      preparedAt: caseSummary.preparedAt,
      partial: false,
      missingFields: [],
    };

    const text = renderAiIntakeEmailText(summary);
    const briefIdx = text.indexOf("CALLBACK REQUEST — MV57HJX");
    const transcriptIdx = text.indexOf("Conversation transcript (reference only)");
    assert.ok(briefIdx >= 0);
    assert.ok(transcriptIdx > briefIdx);
    assert.match(text, /Brake squeak while braking/);
    assert.match(text, /2\.0L Diesel/);
    assert.match(text, /today at 12pm/i);
    assert.doesNotMatch(text, /Not specified/);
    assert.doesNotMatch(text, /See transcript/i);
  });
});

describe("booking intake email", () => {
  it("renders workshop case summary as primary content", () => {
    const caseSummary = buildWorkshopCaseSummary(sampleSession(), {
      kind: "booking",
      booking: {
        service: "Brakes",
        preferredDate: "2026-06-10",
        preferredTime: "09:00",
      },
    });

    const summary: ServiceIntakeSummary = {
      caseSummary,
      customerName: "Ruslan",
      customerPhone: "07667787786",
      registration: "MV57 HJX",
      vehicle: "2015 BMW 320D",
      vehicleEngine: "2.0L Diesel",
      bookingSlot: {
        service: "Brakes",
        preferredDate: "2026-06-10",
        preferredTime: "09:00",
      },
      symptoms: caseSummary.symptoms,
      possibleCauses: ["Worn pads"],
      estimatedRange: "£120–£250 per axle",
      uploadedFiles: [],
      urgency: "medium",
      preparedAt: caseSummary.preparedAt,
    };

    const text = renderBookingIntakeEmailText(summary, {
      transcript: sampleSession().messages,
    });
    assert.match(text, /BOOKING REQUEST — MV57HJX/);
    assert.match(text, /Brake squeak while braking/);
    assert.doesNotMatch(text, /Not specified/);
  });
});
