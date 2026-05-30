/**
 * Unified mechanic-oriented intake — one collection strategy and one summary
 * format for all customer-facing AI modes (Repair Cost Guidance is canonical).
 */

import type { ChatMessage } from "@/lib/types/chat";
import type { LeadDraft } from "@/lib/types/chat";
import type { IntakeIntent } from "@/lib/types/ai-intake";
import type { SuggestionChip } from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";
import type { WorkshopCaseKind } from "@/lib/types/workshop-case-summary";
import { hasBookingServiceSelected } from "@/lib/booking/booking-journey";
import type { HeroConciergeMode } from "@/lib/types/hero-concierge";

export type UnifiedIntakeMode = HeroConciergeMode | "general";
import {
  buildCallbackSummary,
  extractCustomerConcernFromTranscript,
  normalizeCallbackLeadDraft,
  syncPhoneFromUserMessage,
} from "@/lib/services/callback-intake";
import {
  formatVehicleDisplay,
  vehiclePartsFromStructured,
} from "@/lib/vehicle/format-vehicle-display";
import { sanitizePlainText } from "@/lib/utils/sanitize";
import {
  detectPrimarySymptom,
  estimateBridgeReady,
  getInvestigationMissingFields,
  inferDiagnosticConfidence,
  investigationDepthMet,
  primarySymptomLabel,
} from "@/lib/diagnostic/investigation-trees";

export const DIAGNOSTIC_ACTION_CALLBACK = "diagnostic-action-callback";
export const DIAGNOSTIC_ACTION_BOOK = "diagnostic-action-book";
export const DIAGNOSTIC_ACTION_RECOVERY = "diagnostic-action-recovery";
export const DIAGNOSTIC_ACTION_ESTIMATE = "diagnostic-action-estimate";

/** Handoff chips blocked until diagnostic summary is ready. */
export const DIAGNOSTIC_HANDOFF_CHIP_IDS = new Set<string>([
  DIAGNOSTIC_ACTION_CALLBACK,
  DIAGNOSTIC_ACTION_BOOK,
  DIAGNOSTIC_ACTION_RECOVERY,
  "escalate-callback",
  "escalate-book",
]);

const ISSUE_TITLE_PATTERNS: Array<[RegExp, string]> = [
  [/\boverheat|steam/i, "Overheating"],
  [/\bbrake|squeak|squeal|grinding/i, "Brakes"],
  [/\bwarning light|engine light|eml|check engine/i, "Warning lights"],
  [/\bnoise|knock|rattle|clunk/i, "Unusual noise"],
  [/\bstart|won.?t start|crank/i, "Starting issue"],
  [/\bcoolant|leak/i, "Cooling / leak"],
  [/\bmot\b/i, "MOT"],
  [/\bservice\b/i, "Service"],
  [/\bdpf|emission/i, "Emissions / DPF"],
  [/\bbattery|electrical/i, "Electrical"],
  [/\bsteer|alignment|tracking/i, "Steering / alignment"],
  [/\bsuspension|shock|spring/i, "Suspension"],
];

const RECOVERY_HINT =
  /\b(recovery|collect(?:ion)?|tow|truck|cannot drive|can.?t drive|won.?t drive|unsafe to drive|do not drive|stranded|non.?drivable|pick.?up|pickup)\b/i;

const COLLECTION_ADDRESS_HINT =
  /\b(at|from|address|postcode|road|street|lane|drive|avenue|close|crescent|way)\b/i;

export type MechanicSummaryInput = {
  mode: UnifiedIntakeMode;
  intake: StructuredIntake;
  leadDraft?: LeadDraft;
  messages?: ChatMessage[];
  registrationHint?: string;
};

export type RecoveryContext = {
  needed: boolean;
  collectionAddress?: string;
  collectionDistance?: string;
  collectionPreferredWindow?: string;
  reason?: string;
};

/** Shared prompt block — injected into all concierge mode prompts. */
export const UNIFIED_INTAKE_PROMPT = `
UNIFIED_INTAKE (all modes — Repair Cost Guidance quality standard):
- Ask ONE focused question per turn. No generic filler or multi-part interviews.
- Progress toward missing required information only — never repeat known facts.
- Populate structuredIntake.issue.primarySymptom, symptoms, drivingSymptoms, warningLights, startedWhen, drivable, severity as the customer answers.
- Populate structuredIntake.aiEstimate.possibleCauses, recommendedNextStep, urgencyLevel, diagnosticConfidence, estimatedPriceRange when known.
- Build structuredIntake.aiEstimate.summary as a mechanic-ready brief (Primary symptom, Timeline, Warning lights, Driving symptoms, Likely causes, Drivability, Confidence, Recommended action).
- NEVER say booking confirmed, request sent, workshop notified, or mechanic has received — unless WORKFLOW_VALIDATION.canSubmit is true AND the customer explicitly confirms send.
- Use Known vehicle / VEHICLE_PROFILE — never re-ask make, model, year, or engine on file.
`.trim();

function parseUrgency(intake: StructuredIntake, leadDraft?: LeadDraft): UrgencyLevel {
  const raw = (
    intake.aiEstimate.urgencyLevel ||
    intake.issue.severity ||
    leadDraft?.urgency ||
    ""
  ).toLowerCase();
  if (/high|urgent|emergency|asap|unsafe|critical/.test(raw)) return "high";
  if (/low|minor|routine/.test(raw)) return "low";
  return "medium";
}

function formatDrivability(intake: StructuredIntake): string {
  const next = intake.aiEstimate.recommendedNextStep ?? "";
  const symptoms = intake.issue.symptoms.join(" ");
  if (
    intake.issue.drivable === false ||
    /avoid driving|do not drive|unsafe|recovery|non.?drivable/i.test(`${next} ${symptoms}`)
  ) {
    return "Unsafe to drive";
  }
  if (intake.issue.drivable === true && /concern|caution|careful/i.test(next)) {
    return "Drivable with caution";
  }
  if (intake.issue.drivable === true) return "Drives normally";
  if (/won.?t start|will not start|stranded/i.test(`${next} ${symptoms}`)) {
    return "Will not start";
  }
  return "Not confirmed";
}

export function inferIssueTitle(intake: StructuredIntake): string {
  const blob = [
    ...intake.issue.symptoms,
    ...intake.aiEstimate.possibleCauses,
    intake.aiEstimate.recommendedNextStep,
  ].join(" ");

  for (const [pattern, title] of ISSUE_TITLE_PATTERNS) {
    if (pattern.test(blob)) return title;
  }

  const first = intake.issue.symptoms[0]?.trim();
  if (first && first.length <= 48) return sanitizePlainText(first, 48);
  return "Vehicle issue";
}

export function detectRecoveryContext(
  intake: StructuredIntake,
  messages: ChatMessage[] = [],
  leadDraft: LeadDraft = {}
): RecoveryContext {
  const drivability = formatDrivability(intake);
  const nonDrivable =
    drivability === "Unsafe to drive" ||
    drivability === "Will not start" ||
    intake.issue.drivable === false;

  if (!nonDrivable && !RECOVERY_HINT.test(extractCustomerConcernFromTranscript(messages))) {
    return { needed: false };
  }

  let collectionAddress: string | undefined;
  let collectionDistance: string | undefined;
  let collectionPreferredWindow: string | undefined;

  for (const message of messages) {
    if (message.role !== "user") continue;
    const text = (message.displayContent ?? message.content).trim();
    if (!collectionAddress && COLLECTION_ADDRESS_HINT.test(text) && text.length >= 12) {
      const postcodeMatch = text.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/i);
      if (postcodeMatch) {
        collectionAddress = sanitizePlainText(postcodeMatch[0]!, 200);
      }
    }
    const distMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:mi|miles|km))\b/i);
    if (distMatch) collectionDistance = distMatch[1]!.trim();
    const timingMatch = text.match(
      /\b(today|tomorrow)\s+(morning|afternoon|evening)\b/i
    );
    if (timingMatch && /collect|recovery|pick/i.test(text)) {
      collectionPreferredWindow = `${timingMatch[1]!} ${timingMatch[2]!}`;
    }
  }

  const slot = leadDraft.preferredDate || leadDraft.callbackWindow || intake.preferredBookingTime;
  if (!collectionPreferredWindow && slot && /collect|recovery/i.test(slot)) {
    collectionPreferredWindow = sanitizePlainText(slot, 120);
  }

  return {
    needed: nonDrivable || Boolean(collectionAddress || collectionPreferredWindow),
    collectionAddress,
    collectionDistance,
    collectionPreferredWindow,
    reason:
      intake.issue.symptoms.join("; ") ||
      extractCustomerConcernFromTranscript(messages) ||
      undefined,
  };
}

/** Mechanic-ready multi-line summary — same format for every mode. */
export function buildMechanicCaseSummary(input: MechanicSummaryInput): string {
  const { intake, leadDraft, messages = [] } = input;
  const vehicleLine = [
    formatVehicleDisplay(vehiclePartsFromStructured(intake)),
    intake.vehicle.engine?.trim(),
  ]
    .filter(Boolean)
    .join(" ");
  const issueTitle = inferIssueTitle(intake);
  const symptoms = intake.issue.symptoms.filter(Boolean).join("; ");
  const transcriptConcern = extractCustomerConcernFromTranscript(messages);
  const symptomLine =
    symptoms ||
    leadDraft?.problemDescription?.trim() ||
    transcriptConcern ||
    "See transcript";

  const lines: string[] = [];

  if (vehicleLine) lines.push(`Vehicle: ${vehicleLine}`);
  lines.push(`Issue: ${issueTitle}`);
  lines.push(`Symptoms: ${symptomLine}`);

  if (intake.issue.startedWhen.trim()) {
    lines.push(`Timeline: ${sanitizePlainText(intake.issue.startedWhen, 120)}`);
  }

  const primarySymptom =
    intake.issue.primarySymptom?.trim() ||
    primarySymptomLabel(detectPrimarySymptom(intake, messages));
  if (primarySymptom) {
    lines.push(`Primary symptom: ${sanitizePlainText(primarySymptom, 80)}`);
  }

  if (intake.issue.warningLights.length) {
    lines.push(`Warning lights: ${intake.issue.warningLights.join(", ")}`);
  }

  const drivingSymptoms = (intake.issue.drivingSymptoms ?? []).filter(Boolean).join("; ");
  if (drivingSymptoms) {
    lines.push(`Driving symptoms: ${sanitizePlainText(drivingSymptoms, 200)}`);
  }

  lines.push(`Drivability: ${formatDrivability(intake)}`);

  const confidence = inferDiagnosticConfidence(intake);
  if (confidence !== "low" || intake.aiEstimate.diagnosticConfidence?.trim()) {
    lines.push(`Confidence: ${confidence}`);
  }
  lines.push(`Urgency: ${parseUrgency(intake, leadDraft)}`);

  if (intake.aiEstimate.estimatedPriceRange.trim()) {
    lines.push(`Estimate discussed: ${intake.aiEstimate.estimatedPriceRange.trim()}`);
  }

  if (intake.aiEstimate.possibleCauses.length) {
    lines.push(`Likely causes: ${intake.aiEstimate.possibleCauses.slice(0, 4).join("; ")}`);
  }

  const recovery = detectRecoveryContext(intake, messages, leadDraft);
  if (recovery.collectionPreferredWindow) {
    lines.push(`Collection request: ${recovery.collectionPreferredWindow}`);
  }

  const callbackWindow =
    leadDraft?.callbackWindow?.trim() ||
    (intake.preferredBookingTime && !recovery.collectionPreferredWindow
      ? intake.preferredBookingTime
      : "");
  if (callbackWindow && input.mode === "callback") {
    lines.push(`Callback requested: ${sanitizePlainText(callbackWindow, 120)}`);
  } else if (callbackWindow && input.mode === "diagnostic") {
    lines.push(`Callback requested: ${sanitizePlainText(callbackWindow, 120)}`);
  }

  if (recovery.collectionAddress) {
    lines.push(`Collection address: ${recovery.collectionAddress}`);
  }
  if (recovery.collectionDistance) {
    lines.push(`Distance: ${recovery.collectionDistance}`);
  }

  const recommended =
    intake.aiEstimate.recommendedNextStep.trim() ||
    defaultRecommendedAction(input.mode, intake, recovery);
  if (recommended) {
    lines.push(`Recommended action: ${sanitizePlainText(recommended, 300)}`);
  }

  return lines.join("\n");
}

function defaultRecommendedAction(
  mode: UnifiedIntakeMode,
  intake: StructuredIntake,
  recovery: RecoveryContext
): string {
  if (recovery.needed) {
    return "Arrange recovery and workshop inspection.";
  }
  switch (mode) {
    case "pricing":
      return intake.aiEstimate.estimatedPriceRange
        ? "Confirm scope on inspection and discuss estimate with customer."
        : "Inspect to confirm repair scope and provide firm quote.";
    case "diagnostic":
      return intake.aiEstimate.possibleCauses.length
        ? "Book inspection to confirm diagnosis."
        : "Gather remaining symptoms and recommend inspection.";
    case "callback":
      return "Call customer with the information collected.";
    case "booking":
      return "Confirm booking slot and service scope.";
    default:
      return "Review case and contact customer if needed.";
  }
}

export function diagnosticSummaryReady(intake: StructuredIntake): boolean {
  const symptoms = intake.issue.symptoms.filter(Boolean);
  if (symptoms.length === 0) return false;

  const causes = intake.aiEstimate.possibleCauses.filter(Boolean);
  if (causes.length < 1) return false;

  const severity = (intake.issue.severity || intake.aiEstimate.urgencyLevel).trim();
  if (!severity) return false;

  if (intake.issue.drivable !== true && intake.issue.drivable !== false) return false;

  if (!investigationDepthMet(intake)) return false;

  const confidence = inferDiagnosticConfidence(intake);
  if (confidence === "low") return false;

  const summary = intake.aiEstimate.summary.trim();
  const hasMechanicSummary = summary.length >= 40;
  const hasRecommended = intake.aiEstimate.recommendedNextStep.trim().length >= 8;

  return hasMechanicSummary || (causes.length >= 2 && hasRecommended);
}

export function formatDiagnosticDrivability(intake: StructuredIntake): string {
  if (intake.issue.drivable === false) return "avoid driving";
  if (intake.issue.drivable === true) {
    const severity = (intake.issue.severity || intake.aiEstimate.urgencyLevel).toLowerCase();
    if (severity === "high") return "limited";
    return "safe";
  }
  return "unknown";
}

/** Customer-visible diagnostic summary before handoff chips. */
export function buildDiagnosticSummaryBlock(intake: StructuredIntake): string {
  const causes = intake.aiEstimate.possibleCauses.filter(Boolean).slice(0, 4);
  const severity = (intake.issue.severity || intake.aiEstimate.urgencyLevel || "medium").toLowerCase();
  const drivability = formatDiagnosticDrivability(intake);
  const confidence = inferDiagnosticConfidence(intake);
  const topCause = causes[0];

  const lines: string[] = ["Based on what you've told me:"];

  if (topCause && confidence !== "low") {
    lines.push(`The most likely cause is ${topCause.toLowerCase()}.`);
  }

  lines.push("");
  lines.push("Likely causes:");
  if (causes.length) {
    for (const c of causes) {
      lines.push(`• ${c}`);
    }
  } else {
    lines.push("• Further inspection needed");
  }

  lines.push("");
  lines.push(`Severity: ${severity}`);
  lines.push(`Drivability: ${drivability}`);
  lines.push(`Confidence: ${confidence}`);

  const next = intake.aiEstimate.recommendedNextStep.trim();
  if (next) {
    lines.push("");
    lines.push(`Recommended next step: ${next}`);
  }

  return lines.join("\n");
}

export function diagnosticSummaryInContent(content: string): boolean {
  return /Likely causes:/i.test(content) && /Drivability:/i.test(content);
}

export function stripPrematureDiagnosticHandoffChips(
  chips?: SuggestionChip[]
): SuggestionChip[] | undefined {
  if (!chips?.length) return chips;
  const filtered = chips.filter((c) => !DIAGNOSTIC_HANDOFF_CHIP_IDS.has(c.id));
  return filtered.length ? filtered : undefined;
}

export function getDiagnosticNextActionChips(intake: StructuredIntake): SuggestionChip[] {
  const recovery = detectRecoveryContext(intake);
  const chips: SuggestionChip[] = [];

  if (estimateBridgeReady(intake)) {
    chips.push({
      id: DIAGNOSTIC_ACTION_ESTIMATE,
      label: "Get repair estimate",
      message:
        "Based on this diagnosis, I would like a repair cost estimate for the most likely cause.",
    });
  }

  chips.push(
    {
      id: DIAGNOSTIC_ACTION_CALLBACK,
      label: "Request callback",
      message: "I would like a mechanic to call me back about this diagnosis.",
    },
    {
      id: DIAGNOSTIC_ACTION_BOOK,
      label: "Book inspection",
      message: "I would like to book an inspection for this issue.",
    }
  );

  if (recovery.needed || intake.issue.drivable === false) {
    chips.push({
      id: DIAGNOSTIC_ACTION_RECOVERY,
      label: "Arrange recovery",
      message: "My vehicle is not safe to drive — I need recovery or collection.",
    });
  }

  return chips;
}

export function enforceDiagnosticModeTurn(params: {
  mode: UnifiedIntakeMode;
  intake: StructuredIntake;
  content: string;
  chips?: SuggestionChip[];
}): { content: string; chips?: SuggestionChip[] } {
  if (params.mode !== "diagnostic") {
    return { content: params.content, chips: params.chips };
  }

  if (!diagnosticSummaryReady(params.intake)) {
    return {
      content: params.content,
      chips: stripPrematureDiagnosticHandoffChips(params.chips),
    };
  }

  let content = params.content.trim();
  if (!diagnosticSummaryInContent(content)) {
    const summaryBlock = buildDiagnosticSummaryBlock(params.intake);
    content = content ? `${content}\n\n${summaryBlock}` : summaryBlock;
  }

  if (!/choose below|next step/i.test(content)) {
    content = `${content}\n\nChoose below if you'd like to take the next step.`;
  }

  return {
    content,
    chips: getDiagnosticNextActionChips(params.intake),
  };
}

export function resolveWorkshopCaseKind(
  mode: UnifiedIntakeMode,
  intake: StructuredIntake,
  messages: ChatMessage[] = [],
  leadDraft: LeadDraft = {}
): WorkshopCaseKind {
  if (mode === "booking") return "booking";
  if (mode === "callback") return "callback";
  if (mode === "pricing" || intake.intent === "quote") return "pricing";
  const recovery = detectRecoveryContext(intake, messages, leadDraft);
  if (recovery.needed && recovery.collectionPreferredWindow) return "recovery";
  if (mode === "diagnostic") return "diagnostic";
  return "callback";
}

function modeIntent(mode: UnifiedIntakeMode, intake: StructuredIntake): StructuredIntake["intent"] {
  if (intake.intent) return intake.intent;
  switch (mode) {
    case "pricing":
      return "quote";
    case "callback":
      return "callback";
    case "booking":
      return "book";
    default:
      return "info_only";
  }
}

/** Single intake quality pass — replaces per-mode collection logic. */
export function applyUnifiedIntakeQuality(params: {
  mode: UnifiedIntakeMode;
  intake: StructuredIntake;
  leadDraft: LeadDraft;
  messages: ChatMessage[];
  userMessage: string;
}): { intake: StructuredIntake; leadDraft: LeadDraft } {
  let intake = params.intake;
  let leadDraft = params.leadDraft;

  if (params.mode === "callback" || params.mode === "booking") {
    const synced = syncPhoneFromUserMessage(params.userMessage, leadDraft, intake);
    intake = synced.structuredIntake;
    leadDraft = synced.leadDraft;
  }

  if (!intake.issue.primarySymptom?.trim() && intake.issue.symptoms.length) {
    const category = detectPrimarySymptom(intake, params.messages);
    intake = {
      ...intake,
      issue: {
        ...intake.issue,
        primarySymptom: primarySymptomLabel(category),
      },
    };
  }

  const confidence = inferDiagnosticConfidence(intake);
  if (!intake.aiEstimate.diagnosticConfidence?.trim() && confidence !== "low") {
    intake = {
      ...intake,
      aiEstimate: { ...intake.aiEstimate, diagnosticConfidence: confidence },
    };
  }

  if (!intake.issue.symptoms.length) {
    const concern = extractCustomerConcernFromTranscript(params.messages);
    if (concern) {
      intake = {
        ...intake,
        issue: { ...intake.issue, symptoms: [concern] },
      };
      leadDraft = {
        ...leadDraft,
        problemDescription: leadDraft.problemDescription ?? concern,
      };
    }
  }

  if (params.mode === "callback" || params.mode === "booking") {
    leadDraft = normalizeCallbackLeadDraft(leadDraft, intake);
  }

  if (!intake.aiEstimate.summary.trim()) {
    const mechanicSummary = buildMechanicCaseSummary({
      mode: params.mode,
      intake,
      leadDraft,
      messages: params.messages,
    });

    if (params.mode === "callback") {
      const callbackText = buildCallbackSummary({
        symptoms: intake.issue.symptoms.join("; ") || leadDraft.problemDescription || "",
        estimatedRange: intake.aiEstimate.estimatedPriceRange || undefined,
        aiSummary: mechanicSummary,
        intent: "callback",
        urgency: parseUrgency(intake, leadDraft),
        transcriptConcern: extractCustomerConcernFromTranscript(params.messages),
        possibleCauses: intake.aiEstimate.possibleCauses,
      });
      intake = {
        ...intake,
        aiEstimate: { ...intake.aiEstimate, summary: callbackText },
      };
    } else {
      intake = {
        ...intake,
        aiEstimate: { ...intake.aiEstimate, summary: mechanicSummary },
      };
    }
  }

  const intent = modeIntent(params.mode, intake);
  if (!intake.intent) {
    intake = { ...intake, intent };
  }

  if (
    params.mode === "diagnostic" &&
    !intake.aiEstimate.recommendedNextStep.trim() &&
    diagnosticSummaryReady(intake)
  ) {
    const recovery = detectRecoveryContext(intake, params.messages, leadDraft);
    intake = {
      ...intake,
      aiEstimate: {
        ...intake.aiEstimate,
        recommendedNextStep: defaultRecommendedAction("diagnostic", intake, recovery),
      },
    };
  }

  return { intake, leadDraft };
}

export function getMissingIntakeFields(
  mode: UnifiedIntakeMode,
  intake: StructuredIntake,
  leadDraft: LeadDraft,
  messages: ChatMessage[] = []
): string[] {
  const missing: string[] = [];
  const symptoms = intake.issue.symptoms.length > 0 || leadDraft.problemDescription?.trim();

  switch (mode) {
    case "pricing":
      if (!symptoms && !intake.aiEstimate.estimatedPriceRange) missing.push("repair scope");
      break;
    case "diagnostic":
      if (!symptoms) missing.push("primary symptom");
      missing.push(...getInvestigationMissingFields(intake));
      if (intake.issue.drivable === null) missing.push("drivability");
      if (!intake.aiEstimate.possibleCauses.filter(Boolean).length) missing.push("likely causes");
      if (!(intake.issue.severity.trim() || intake.aiEstimate.urgencyLevel.trim())) {
        missing.push("severity");
      }
      if (!intake.aiEstimate.recommendedNextStep.trim()) missing.push("recommended next step");
      if (!diagnosticSummaryReady(intake)) missing.push("diagnostic summary");
      break;
    case "callback":
      if (!symptoms) missing.push("callback reason");
      if (!leadDraft.name?.trim() && !intake.customer.name.trim()) missing.push("name");
      if (!leadDraft.phone?.trim() && !intake.customer.contact.trim()) missing.push("phone");
      break;
    case "booking":
      if (!hasBookingServiceSelected(intake, leadDraft)) missing.push("service type");
      if (!leadDraft.preferredDate?.trim() && !intake.preferredBookingTime.trim()) {
        missing.push("preferred day");
      }
      if (!leadDraft.callbackWindow?.trim() && !/\b(morning|afternoon|evening|any time)/i.test(intake.preferredBookingTime)) {
        missing.push("preferred window");
      }
      if (
        hasBookingServiceSelected(intake, leadDraft) &&
        (leadDraft.preferredDate?.trim() || intake.preferredBookingTime.trim()) &&
        (leadDraft.callbackWindow?.trim() || /\b(morning|afternoon|evening|any time)/i.test(intake.preferredBookingTime))
      ) {
        if (!leadDraft.name?.trim() && !intake.customer.name.trim()) missing.push("name");
        if (!leadDraft.phone?.trim() && !intake.customer.contact.trim()) missing.push("phone");
      }
      break;
    default:
      break;
  }
  return missing;
}
