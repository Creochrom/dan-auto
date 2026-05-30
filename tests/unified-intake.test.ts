import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyUnifiedIntakeQuality,
  buildMechanicCaseSummary,
  detectRecoveryContext,
  diagnosticSummaryReady,
  enforceDiagnosticModeTurn,
  getDiagnosticNextActionChips,
  getMissingIntakeFields,
  inferIssueTitle,
  resolveWorkshopCaseKind,
} from "../lib/intake/unified-intake.ts";
import {
  buildWorkshopCaseSummary,
} from "../lib/workshop/build-workshop-case-summary.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import type { ChatSession } from "../lib/types/chat.ts";

function baseIntake() {
  return {
    ...createEmptyStructuredIntake(),
    vehicle: {
      make: "BMW",
      model: "320D",
      year: "2007",
      engine: "2.0L Diesel",
      mileage: "",
    },
  };
}

function overheatingSession(): ChatSession {
  const structured = {
    ...baseIntake(),
    intent: "" as const,
    issue: {
      primarySymptom: "Overheating",
      symptoms: ["Steam visible from bonnet", "Coloured coolant leak under car"],
      drivingSymptoms: ["Temperature gauge in red zone"],
      warningLights: ["Coolant warning"],
      startedWhen: "Started yesterday on motorway",
      drivable: false,
      severity: "high",
    },
    aiEstimate: {
      possibleCauses: ["Coolant leak", "Thermostat failure", "Water pump"],
      estimatedPriceRange: "",
      urgencyLevel: "high",
      recommendedNextStep: "Arrange recovery and cooling-system inspection.",
      diagnosticConfidence: "high",
      summary:
        "Vehicle: 2007 BMW 320D 2.0L Diesel. Primary symptom: Overheating. Symptoms: steam; coolant leak. Timeline: yesterday on motorway. Drivability: Unsafe. Confidence: high.",
    },
    preferredBookingTime: "Tomorrow afternoon",
  };

  return {
    id: "sess_overheat",
    messages: [
      {
        id: "1",
        role: "user" as const,
        content: "My BMW is overheating — steam and coloured coolant leak",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        role: "user" as const,
        content: "It is not safe to drive. Can you collect tomorrow morning?",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        role: "user" as const,
        content: "Call me tomorrow afternoon please",
        createdAt: new Date().toISOString(),
      },
    ],
    leadDraft: {
      preferredDate: "Tomorrow",
      callbackWindow: "Afternoon",
    },
    structuredIntake: structured,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("unified intake — overheating diagnostic", () => {
  it("builds mechanic-ready summary matching release spec", () => {
    const session = overheatingSession();
    const intake = session.structuredIntake!;

    const quality = applyUnifiedIntakeQuality({
      mode: "diagnostic",
      intake,
      leadDraft: session.leadDraft ?? {},
      messages: session.messages,
      userMessage: "",
    });

    assert.ok(quality.intake.aiEstimate.summary.trim().length > 20);
    assert.equal(inferIssueTitle(intake), "Overheating");

    const summary = buildMechanicCaseSummary({
      mode: "diagnostic",
      intake: quality.intake,
      leadDraft: session.leadDraft,
      messages: session.messages,
    });

    assert.match(summary, /Vehicle:.*2007 BMW.*2\.0L Diesel/i);
    assert.match(summary, /Issue: Overheating/);
    assert.match(summary, /Symptoms:.*[Ss]team/);
    assert.match(summary, /Drivability: Unsafe to drive/);
    assert.match(summary, /Urgency: high/i);
    assert.match(summary, /Recommended action:.*recovery/i);
  });

  it("offers recovery chip when vehicle is non-drivable", () => {
    const intake = overheatingSession().structuredIntake!;
    const chips = getDiagnosticNextActionChips(intake);
    assert.ok(chips.some((c) => c.id === "diagnostic-action-recovery"));
  });

  it("produces WorkshopCaseSummary for diagnostic kind", () => {
    const session = overheatingSession();
    const caseSummary = buildWorkshopCaseSummary(session, {
      kind: "diagnostic",
      workflowMode: "diagnostic",
    });
    assert.equal(caseSummary.kind, "diagnostic");
    assert.equal(caseSummary.issueTitle, "Overheating");
    assert.equal(caseSummary.drivability, "avoid_driving");
    assert.match(caseSummary.symptoms, /[Ss]team/);
  });
});

describe("unified intake — mode examples", () => {
  it("pricing mode summary includes estimate", () => {
    const intake = {
      ...baseIntake(),
      intent: "quote" as const,
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Brake squeak when braking"],
      },
      aiEstimate: {
        possibleCauses: ["Worn brake pads"],
        estimatedPriceRange: "£120–£250 per axle",
        urgencyLevel: "medium",
        recommendedNextStep: "Confirm scope on inspection.",
        summary: "",
      },
    };

    const summary = buildMechanicCaseSummary({ mode: "pricing", intake });
    assert.match(summary, /Estimate discussed: £120–£250/);
    assert.equal(resolveWorkshopCaseKind("pricing", intake), "pricing");

    const caseSummary = buildWorkshopCaseSummary(
      {
        id: "p",
        messages: [],
        structuredIntake: intake,
        createdAt: "",
        updatedAt: "",
      },
      { kind: "pricing", workflowMode: "pricing" }
    );
    assert.equal(caseSummary.kind, "pricing");
    assert.match(caseSummary.estimatedRange ?? "", /£120/);
  });

  it("callback mode tracks missing contact fields", () => {
    const intake = {
      ...baseIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["DPF warning light"],
      },
    };
    const missing = getMissingIntakeFields("callback", intake, {});
    assert.ok(missing.includes("name"));
    assert.ok(missing.includes("phone"));
    assert.equal(resolveWorkshopCaseKind("callback", intake), "callback");
  });

  it("booking mode requires day and window", () => {
    const intake = baseIntake();
    const missing = getMissingIntakeFields("booking", intake, {
      name: "Alex",
      phone: "07123456789",
    });
    assert.ok(missing.includes("preferred day"));
    assert.ok(missing.includes("preferred window"));
  });

  it("recovery kind when collection context present", () => {
    const session = overheatingSession();
    const intake = session.structuredIntake!;
    const recovery = detectRecoveryContext(intake, session.messages, session.leadDraft ?? {});
    assert.ok(recovery.needed);
    assert.ok(recovery.collectionPreferredWindow || session.leadDraft?.preferredDate);

    const kind = resolveWorkshopCaseKind(
      "diagnostic",
      intake,
      session.messages,
      session.leadDraft ?? {}
    );
    assert.equal(kind, "recovery");

    const caseSummary = buildWorkshopCaseSummary(session, {
      kind: "recovery",
      workflowMode: "diagnostic",
    });
    assert.equal(caseSummary.kind, "recovery");
  });

  it("diagnostic terminal turn replaces chips when summary ready", () => {
    const intake = {
      ...baseIntake(),
      issue: {
        primarySymptom: "Brakes",
        symptoms: [
          "Grinding noise when braking",
          "Mainly when braking — front wheels",
          "No warning lights",
        ],
        drivingSymptoms: ["No pulling"],
        warningLights: [],
        startedWhen: "This week",
        drivable: true,
        severity: "medium",
      },
      aiEstimate: {
        possibleCauses: ["Worn pads or discs", "Debris caught in caliper"],
        estimatedPriceRange: "",
        urgencyLevel: "medium",
        recommendedNextStep: "Book inspection to confirm.",
        diagnosticConfidence: "medium",
        summary:
          "Primary symptom: Brakes. Symptoms: grinding when braking. Timeline: this week. Drivability: Drives normally. Likely causes: worn pads. Confidence: medium.",
      },
    };
    assert.ok(diagnosticSummaryReady(intake));
    const turn = enforceDiagnosticModeTurn({
      mode: "diagnostic",
      intake,
      content: "This often points to worn brake pads.",
      chips: [{ id: "old", label: "Old", message: "old" }],
    });
    assert.ok(turn.chips?.some((c) => c.id === "diagnostic-action-book"));
    assert.match(turn.content, /Likely causes:/);
  });

  it("blocks handoff chips when investigation incomplete", () => {
    const intake = {
      ...baseIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Engine light on"],
        drivable: null,
      },
    };
    assert.ok(!diagnosticSummaryReady(intake));
    const turn = enforceDiagnosticModeTurn({
      mode: "diagnostic",
      intake,
      content: "Which light is on?",
      chips: [
        { id: "diagnostic-action-book", label: "Book", message: "book" },
        { id: "eml", label: "Engine light", message: "Engine light" },
      ],
    });
    assert.ok(!turn.chips?.some((c) => c.id === "diagnostic-action-book"));
    assert.equal(turn.chips?.length, 1);
  });
});
