import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectPrimarySymptom,
  investigationDepthMet,
  inferDiagnosticConfidence,
} from "../lib/diagnostic/investigation-trees.ts";
import {
  buildDiagnosticSummaryBlock,
  diagnosticSummaryReady,
  enforceDiagnosticModeTurn,
  stripPrematureDiagnosticHandoffChips,
  DIAGNOSTIC_ACTION_ESTIMATE,
} from "../lib/intake/unified-intake.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";

function brakeIntakeReady() {
  return {
    ...createEmptyStructuredIntake(),
    issue: {
      primarySymptom: "Brakes",
      symptoms: [
        "Grinding noise when braking at low speed",
        "Mainly when braking — not at steady speed",
        "Front wheels — pedal feels normal",
      ],
      drivingSymptoms: ["No pulling to either side"],
      warningLights: ["No ABS or brake warning light"],
      startedWhen: "Started this week",
      drivable: true,
      severity: "medium",
    },
    aiEstimate: {
      possibleCauses: ["Worn brake pads", "Glazed or worn brake discs"],
      estimatedPriceRange: "",
      urgencyLevel: "medium",
      recommendedNextStep: "Book inspection to confirm pad and disc condition.",
      diagnosticConfidence: "medium",
      summary:
        "Vehicle: 2015 Ford Focus. Primary symptom: Brakes. Symptoms: grinding when braking. Drivability: Drives normally. Likely causes: worn pads; worn discs. Confidence: medium. Recommended action: inspection.",
    },
    intent: "" as const,
    preferredBookingTime: "",
  };
}

describe("diagnostic investigation trees", () => {
  it("detects overheating from symptoms", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Steam from bonnet", "Coolant leak under car"],
      },
    };
    assert.equal(detectPrimarySymptom(intake), "overheating");
  });

  it("requires investigation depth before summary ready", () => {
    const shallow = {
      ...createEmptyStructuredIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Engine light on"],
        drivable: true,
        severity: "medium",
      },
      aiEstimate: {
        ...createEmptyStructuredIntake().aiEstimate,
        possibleCauses: ["Sensor fault"],
        recommendedNextStep: "Diagnostic scan",
        diagnosticConfidence: "medium",
        summary: "Engine light — needs scan.",
      },
    };
    assert.ok(!investigationDepthMet(shallow));
    assert.ok(!diagnosticSummaryReady(shallow));
  });

  it("marks brake case ready after full investigation", () => {
    const intake = brakeIntakeReady();
    assert.ok(investigationDepthMet(intake));
    assert.equal(inferDiagnosticConfidence(intake), "medium");
    assert.ok(diagnosticSummaryReady(intake));
  });
});

describe("diagnostic summary stage", () => {
  it("strips premature handoff chips", () => {
    const stripped = stripPrematureDiagnosticHandoffChips([
      { id: "diagnostic-action-book", label: "Book", message: "book" },
      { id: "when-braking", label: "When braking", message: "When braking" },
    ]);
    assert.equal(stripped?.length, 1);
    assert.equal(stripped?.[0]?.id, "when-braking");
  });

  it("appends diagnostic summary block at terminal turn", () => {
    const intake = brakeIntakeReady();
    const turn = enforceDiagnosticModeTurn({
      mode: "diagnostic",
      intake,
      content: "This often points to worn brake pads.",
      chips: [{ id: "old", label: "Old", message: "old" }],
    });
    assert.match(turn.content, /Likely causes:/);
    assert.match(turn.content, /Drivability: safe/);
    assert.match(turn.content, /Confidence: medium/);
    assert.ok(turn.chips?.some((c) => c.id === "diagnostic-action-book"));
    assert.ok(turn.chips?.some((c) => c.id === DIAGNOSTIC_ACTION_ESTIMATE));
  });

  it("builds customer-facing summary with top cause", () => {
    const block = buildDiagnosticSummaryBlock(brakeIntakeReady());
    assert.match(block, /most likely cause is worn brake pads/i);
    assert.match(block, /Severity: medium/);
  });
});
