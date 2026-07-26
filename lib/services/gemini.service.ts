import { GoogleGenerativeAI } from "@google/generative-ai";
import { isGeminiConfigured } from "@/lib/config/advisor";
import { buildSystemPrompt } from "@/ai/prompts/systemPrompt";
import { advisorIntro } from "@/lib/config/brand";
import { formatAdvisorRouteForPrompt } from "@/lib/services/advisor-routing-prompt";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import {
  bookingContextLine,
  mergeStructuredIntake,
  resolveDvlaVehicleFacts,
  structuredIntakeToIntakeState,
  structuredIntakeToLeadDraft,
  structuredIntakeToMechanicSummary,
} from "@/lib/services/intake-mapper";
import {
  applyPricingTerminalIntent,
  enforceCallbackModeTurn,
  enforceHandoffWorkflowChips,
  enforcePricingModeTurn,
  isHandoffClaimAllowed,
  isHandoffIntakeComplete,
  pricingEstimateReady,
  resolveWorkflowMode,
  sanitizeAssistantContactPlaceholders,
  sanitizeLeadDraftContact,
  sanitizeStructuredIntakeContact,
  shouldBlockPrematureCompletionMessage,
  softenPrematureCompletionMessage,
  validateLeadCompletion,
  workflowValidationBlock,
} from "@/lib/services/advisor-workflow";
import {
  applyUnifiedIntakeQuality,
  enforceDiagnosticModeTurn,
} from "@/lib/intake/unified-intake";
import { emitBookingValidationTrace } from "@/lib/logging/booking-validation-trace";
import { finalizeAssistantContent } from "@/lib/chat/assistant-output";
import { capPricingBubbles, stripPricingFiller } from "@/lib/chat/pricing-output";
import { CALLBACK_CONFIRM_CHIP } from "@/lib/config/callback-flow-copy";
import { BOOKING_CONFIRM_CHIP } from "@/lib/services/booking-handoff";
import {
  parseGeminiResponse,
  type GeminiParseFailure,
} from "@/lib/services/gemini-json-parse";
import type { AdvisorTurnResult } from "@/lib/services/service-advisor.engine";
import type { BookingChatContext, ChatMessage, LeadDraft } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";
import {
  createEmptyStructuredIntake,
  type StructuredIntake,
} from "@/lib/types/structured-intake";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";
import {
  formatAvailabilityPromptBlock,
  formatUkDate,
  resolveClosedDateRequest,
} from "@/lib/workshop/availability";

/**
 * Default chat model.
 *
 * `gemini-2.0-flash` is deprecated (no longer available to new API keys,
 * shutting down 2026-06-01). Google recommends `gemini-2.5-flash` as the
 * direct replacement — same `generateContent` API, same SDK call shape,
 * larger context window, and the lowest-latency current Flash tier.
 *
 * Override via `GEMINI_MODEL` env var if you need to pin a specific
 * version (e.g. `gemini-2.5-flash-lite` for cheaper short turns).
 *
 * Refs:
 *   https://ai.google.dev/gemini-api/docs/deprecations
 */
const DEFAULT_MODEL = "gemini-2.5-flash";

function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

const JSON_INSTRUCTION = `
You must respond with a single JSON object (no markdown fences) matching this shape:
{
  "assistantMessage": "string — concise customer reply (max 1 short sentence), one focused question or step",
  "suggestionChips": [{"id":"unique","label":"short button text","message":"natural reply sent if tapped"}],
  "structuredIntake": {
    "customer": { "name": "", "contact": "" },
    "vehicle": { "make": "", "model": "", "year": "", "engine": "", "mileage": "" },
    "issue": {
      "primarySymptom": "Warning light|Noise|Overheating|…",
      "symptoms": [],
      "drivingSymptoms": [],
      "warningLights": [],
      "startedWhen": "",
      "drivable": null,
      "severity": ""
    },
    "media": [],
    "aiEstimate": {
      "possibleCauses": [],
      "estimatedPriceRange": "",
      "urgencyLevel": "low|medium|high",
      "recommendedNextStep": "",
      "diagnosticConfidence": "low|medium|high|",
      "summary": ""
    },
    "intent": "book|callback|quote|info_only|",
    "preferredBookingTime": ""
  },
  "intakeComplete": false,
  "typingLabel": "optional short status e.g. Reviewing symptoms"
}

Rules for structuredIntake (this is the workshop's handoff record — populate diligently, never invent data):
- Merge with CURRENT_INTAKE provided in the user turn — never clear fields that are already filled unless the customer corrects them.
- Extract every detail the customer gives — primary symptom category, symptoms, driving symptoms (power loss, pulling, vibration), dashboard warning lights (e.g. "Engine", "ABS", "Battery", "Oil pressure"), when it started, whether the car is drivable, vehicle make/model/year/engine/mileage, name, phone/email.
- "issue.drivable": true if customer confirms it drives safely, false if they say they're avoiding driving / it's unsafe / won't start, null if unknown.
- "issue.severity": "low" | "medium" | "high" based on safety risk (flashing engine light, brake failure, overheating = high).
- "aiEstimate.estimatedPriceRange": a rough non-binding UK GBP range ("£80–£350 indicative") when you have enough context, else empty.
- "aiEstimate.possibleCauses": cautious language only ("may indicate", "could point to"), never definitive diagnosis.
- "aiEstimate.diagnosticConfidence": "low" | "medium" | "high" — how much context supports the likely causes (diagnostic mode only).
- "aiEstimate.recommendedNextStep": short action ("Bring in for diagnostic scan", "Avoid driving — request recovery", "Routine service check").
- "aiEstimate.summary": concise mechanic-friendly handoff (max ~4 short lines worth): customer concern, symptoms, urgency, warning lights, likely area, media noted, estimate discussed, intent. NOT a transcript.
- "media": array of short notes when customer attached or described uploads (e.g. "Photo of engine warning light", "Short video of suspension knock"). Empty if none.
- "intent": classify the customer's goal:
    "book"       — wants a workshop visit / slot scheduled
    "callback"   — wants a mechanic to phone them back
    "quote"      — wants an indicative price before deciding
    "info_only"  — general question, not committing to a visit yet
    ""           — not yet clear
- "preferredBookingTime": free-text day + window ("Tomorrow morning", "Monday afternoon", "ASAP"). Use windows only — never exact clock times like "10:30".

Conversation rules:
- Never introduce yourself as AI/Gemini or explain technology. Workshop static intro already set context.
- Ask at most one main question per turn. Write natural conversational prose — no internal labels.
- For safety guidance or indicative ranges, state them plainly in full sentences.
- Request photo/video/audio uploads only when helpful (warning light, leak, smoke, noise clip) — not every turn.
- Keep assistantMessage short: prefer 1–2 short sentences. In pricing mode you may use two sentences (estimate + one question) separated by a blank line.
- Do not use markdown ** in assistantMessage.
- NEVER use customer-visible labels such as INFO:, ESTIMATE:, QUESTION:, MAIN QUESTION:, NEXT STEP:, or WARNING:.
- Set intakeComplete true ONLY when WORKFLOW_VALIDATION.canSubmit is true for the active CONCIERGE_MODE AND the customer explicitly confirmed handoff. Never set intakeComplete in pricing or diagnostic modes.
- Booking mode: when all required fields are valid, set intakeComplete true. Do NOT offer booking-confirm-send chip — the app shows a review summary and send button. Do NOT ask for exact clock times (10:00, 11:00) — Morning/Afternoon/Evening windows are enough.
- NEVER store placeholder contact text in structuredIntake (e.g. "My name and number", "Call me", "WhatsApp is best") — leave customer.name and customer.contact empty until a real name and UK phone number are given.
- NEVER use bracket placeholders in assistantMessage (e.g. [Your Name], [Your Mobile Number]) unless WORKFLOW_VALIDATION.canSubmit is true AND you substitute real validated values.
- NEVER offer callback-confirm-send or booking-confirm-send chips unless WORKFLOW_VALIDATION.canSubmit is true.
- NEVER claim booking confirmed, appointment booked, scheduled, reserved, availability confirmed, request submitted, or that the workshop was notified unless intakeComplete is true AND WORKFLOW_VALIDATION.canSubmit is true.
- Modes must stay separated: do NOT switch from pricing/diagnostic into booking or callback collection unless the customer explicitly chooses that next action.
- If safety may be affected (brakes, overheating, flashing EML), tell the customer to avoid driving in assistantMessage and set urgencyLevel="high".

VEHICLE_PROFILE & RETURNING_CUSTOMER (when present in the user turn):
- The system performs a DVLA + internal-memory lookup whenever a registration is known. Treat these blocks as authoritative ground truth.
- NEVER ask for any fact already populated in VEHICLE_PROFILE (make, model, year, fuel, engine). Reference it naturally instead, e.g. "I can see your 2017 BMW 320d — what's it doing?".
- When quoting engine size in assistantMessage, copy VEHICLE_PROFILE.engine EXACTLY (e.g. "1.4L Petrol"). NEVER reformat, round, infer, or drop digits — NEVER write "4L" for "1.4L Petrol".
- When VEHICLE_PROFILE is present, leave structuredIntake.vehicle.make/model/year/engine empty — the system stores DVLA facts; Gemini must not rewrite them.
- NEVER ask the customer to re-provide name/phone/email if RETURNING_CUSTOMER lists them. Greet by first name ("Welcome back, James!") and ask only what's needed for THIS visit (issue, urgency, drivability, preferred slot).
- If RECENT_INTAKES are present, you may reference the most recent one briefly when relevant ("Last time it was a brake job — what's happening now?"). Don't read them out as a list.
- If VEHICLE_PROFILE arrives mid-conversation, acknowledge once and continue. Don't restart the intake.
- When VEHICLE_PROFILE includes motHealthSummary, lastMotResult, or lastMotAdvisoryCount, use MOT history naturally — e.g. if the customer mentions brakes and prior MOT advisories mention brake wear, note the pattern cautiously ("I can see previous MOT advisories related to brake wear — this may indicate the issue has progressed").
- Reference recurringMotThemes or repeated advisory lines when relevant; never invent MOT defects not in the profile.
- Still capture symptoms, drivability, warning lights, urgency, and preferred booking time — these are PER-VISIT details, not vehicle facts.

QUICK REPLIES (suggestionChips) — REQUIRED on every turn unless you are
asking an explicitly open-ended question (e.g. "anything else to add?")
or the customer has just typed a free-form answer that doesn't need
follow-up options. Treat them as the primary mobile input — most users
will tap rather than type.

- Provide 3–4 chips (never 1 or 5+).
- Each chip MUST be a plausible ANSWER to your assistantMessage, never
  a rephrasing of the question. If you cannot think of 3 distinct
  answers, omit chips entirely.
- "label" ≤ 22 characters, sentence case, no trailing punctuation,
  no emoji, no quotes.
- "message" is the natural full reply sent on tap (e.g. label
  "Engine light" → message "The engine warning light is on").
- Include an escape hatch when useful: "Something else",
  "Not sure", "None of these", "I'll type it" — never trap the
  customer.
- Adapt to the topic you just asked about:

  * Braking / suspension symptoms →
    "When braking", "Over bumps", "All the time", "Only when cold"
  * Warning lights →
    "Engine light", "ABS light", "Multiple lights", "No warning lights"
  * Engine / power issues →
    "Loses power", "Rough idle", "Won't start", "Stalls intermittently"
  * Drivability / safety →
    "Drives normally", "Drives but unsafe", "Won't move", "Avoiding driving it"
  * When it started →
    "Today", "This week", "A few weeks ago", "On and off for months"
  * Vehicle fuel / drivetrain →
    "Petrol", "Diesel", "Hybrid", "Not sure"
  * Urgency →
    "Today if possible", "This week", "Next week", "Just exploring"
  * Booking intent →
    "Book it in", "Get a quote first", "Speak to a mechanic", "Just info for now"
  * Contact handoff →
    "Call me back", "WhatsApp is best", "Email me", "I'll call you"
  * Yes/no with context (NEVER bare "Yes"/"No") →
    "Yes — same noise", "No — different", "Sometimes", "Not sure"

BAD chips (do NOT produce):
  - "When did it start?"      (echoes the question)
  - "Warning lights?"         (echoes the question)
  - "Tell me more"            (vacuous)
  - "Yes" / "No" alone        (no context, low signal)
  - "Hmm", "OK", "Sure"       (filler)
`.trim();

function buildRecoveryTurn(params: {
  structuredIntake: StructuredIntake;
  leadDraft: LeadDraft;
  registrationHint?: string;
  advisorRoute?: AdvisorRouteContext;
  intakeStateFallback: ReturnType<typeof structuredIntakeToIntakeState>;
  contentOverride?: string;
  modelMarkedComplete?: boolean;
}): AdvisorTurnResult {
  const workflowMode = resolveWorkflowMode(params.advisorRoute);
  const leadDraft = sanitizeLeadDraftContact(params.leadDraft);
  const structuredIntake = sanitizeStructuredIntakeContact(params.structuredIntake);
  const validation = validateLeadCompletion(
    workflowMode,
    structuredIntake,
    leadDraft,
    params.registrationHint
  );
  const intakeComplete = isHandoffIntakeComplete(workflowMode, validation);
  const handoffAllowed = isHandoffClaimAllowed(validation);
  const mechanicSummary = structuredIntakeToMechanicSummary(
    structuredIntake,
    params.registrationHint ?? leadDraft.registration
  );
  const intakeState = structuredIntakeToIntakeState(structuredIntake, intakeComplete);

  if (workflowMode === "booking" && validation.canSubmit) {
    return {
      content:
        params.contentOverride?.trim() ||
        "Your booking details look complete. I'll show a quick summary next — check the day, window, and contact number, then tap Send booking request.",
      intakeState,
      structuredIntake,
      leadDraft,
      mechanicSummary,
      suggestionChips: undefined,
      intakeComplete: true,
      callbackReady: false,
      shouldCaptureLead: false,
    };
  }

  if (workflowMode === "callback" && validation.canSubmit) {
    return {
      content:
        params.contentOverride?.trim() ||
        "Your callback details are saved. Tap Send request below — you don't need to wait for me to reconnect.",
      intakeState,
      structuredIntake,
      leadDraft,
      mechanicSummary,
      suggestionChips: [CALLBACK_CONFIRM_CHIP],
      intakeComplete: true,
      callbackReady: validation.canSubmit,
      shouldCaptureLead: false,
    };
  }

  const content =
    params.contentOverride?.trim() ||
    "I had a brief hiccup reading that reply, but your details are still saved. Please continue — or tap a quick reply if one is shown.";

  return {
    content,
    intakeState: params.intakeStateFallback,
    structuredIntake,
    leadDraft,
    mechanicSummary,
    suggestionChips: enforceHandoffWorkflowChips({
      mode: workflowMode,
      chips: undefined,
      validation,
      handoffAllowed,
    }),
    intakeComplete,
    callbackReady: false,
    shouldCaptureLead: false,
  };
}

function buildParseFailureTurn(
  params: {
    structuredIntake?: StructuredIntake;
    leadDraft?: LeadDraft;
    registrationHint?: string;
    advisorRoute?: AdvisorRouteContext;
  },
  failure: GeminiParseFailure
): AdvisorTurnResult {
  console.warn("[gemini] parse failure — preserving workflow state", {
    error: failure.error,
    hasPartialMessage: Boolean(failure.partial?.assistantMessage),
  });

  const currentIntake = params.structuredIntake ?? createEmptyStructuredIntake();
  const leadDraft = sanitizeLeadDraftContact(
    structuredIntakeToLeadDraft(currentIntake, {
      ...params.leadDraft,
      registration: params.registrationHint ?? params.leadDraft?.registration,
    })
  );
  const intakeStateFallback = structuredIntakeToIntakeState(currentIntake, false);

  return buildRecoveryTurn({
    structuredIntake: currentIntake,
    leadDraft,
    registrationHint: params.registrationHint,
    advisorRoute: params.advisorRoute,
    intakeStateFallback,
    contentOverride: failure.partial?.assistantMessage,
    modelMarkedComplete: failure.partial?.intakeComplete,
  });
}

function toGeminiHistory(messages: ChatMessage[]) {
  const mapped = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));

  // Gemini 2.5+ rejects `startChat({ history })` if the first turn isn't
  // role:"user" ("First content should be with role 'user', got model").
  // Our advisor sends an assistant intro before the customer's first
  // reply, so trim any leading model turns to keep the history valid.
  const firstUserIdx = mapped.findIndex((m) => m.role === "user");
  return firstUserIdx === -1 ? [] : mapped.slice(firstUserIdx);
}

// Keep chip labels tight so the premium pill UI doesn't wrap on mobile.
const MAX_CHIP_LABEL_CHARS = 28;
const MAX_CHIPS = 4;

function truncateLabel(input: string): string {
  const clean = input.replace(/[\s\u00A0]+/g, " ").trim().replace(/[.?!]+$/, "");
  return clean.length > MAX_CHIP_LABEL_CHARS
    ? `${clean.slice(0, MAX_CHIP_LABEL_CHARS - 1).trim()}…`
    : clean;
}

/**
 * Accept either of the shapes the model may produce:
 *   - rich: [{ id?, label, message }]
 *   - flat: ["No warning lights", "Engine light", ...]
 *
 * Falls back gracefully (returns undefined) on anything malformed
 * rather than throwing — chips are an enhancement, never a hard
 * requirement of a successful turn.
 */
function normalizeChips(...sources: unknown[]): SuggestionChip[] | undefined {
  const raw = sources.find((s) => Array.isArray(s) && (s as unknown[]).length > 0);
  if (!Array.isArray(raw)) return undefined;

  const out: SuggestionChip[] = [];
  const seenLabels = new Set<string>();

  for (const c of raw.slice(0, MAX_CHIPS * 2)) {
    let label = "";
    let message = "";
    let id = "";

    if (typeof c === "string") {
      label = truncateLabel(c);
      message = c.trim();
    } else if (c && typeof c === "object") {
      const o = c as Record<string, unknown>;
      label = truncateLabel(String(o.label ?? o.text ?? o.title ?? ""));
      message = String(o.message ?? o.value ?? o.label ?? "").trim();
      id = String(o.id ?? "").trim();
    } else {
      continue;
    }

    if (!label || !message) continue;
    const dedupeKey = label.toLowerCase();
    if (seenLabels.has(dedupeKey)) continue;
    seenLabels.add(dedupeKey);

    out.push({
      id: id || `chip-${out.length}`,
      label,
      message,
    });

    if (out.length >= MAX_CHIPS) break;
  }

  return out.length ? out : undefined;
}

function buildVehicleMemoryBlock(lookup: VehicleMemoryLookupResult): string[] {
  const lines: string[] = [];
  const v = lookup.vehicle;
  if (v && (v.make || v.model || v.year)) {
    lines.push(
      `VEHICLE_PROFILE: ${JSON.stringify({
        registration: lookup.regDisplay,
        make: v.make || undefined,
        model: v.model || undefined,
        year: v.year || undefined,
        fuel: v.fuel || undefined,
        engine: v.engine || undefined,
        motStatus: v.motStatus || undefined,
        motExpiryDate: v.motExpiryDate || undefined,
        taxStatus: v.taxStatus || undefined,
        lastMotResult: v.lastMotResult || undefined,
        lastMotAdvisoryCount: v.lastMotAdvisoryCount ?? undefined,
        motHealthSummary: v.motHealthSummary?.length ? v.motHealthSummary : undefined,
        recurringMotThemes: v.recurringMotThemes?.length ? v.recurringMotThemes : undefined,
        source: lookup.dvlaMatched ? "DVLA" : "memory",
      })}`
    );
  }

  if (lookup.returning && lookup.customer) {
    const c = lookup.customer;
    lines.push(
      `RETURNING_CUSTOMER: ${JSON.stringify({
        name: c.name || undefined,
        phone: c.phone || undefined,
        email: c.email || undefined,
        lastSeenAt: c.lastSeenAt,
      })}`
    );
  }

  if (lookup.recentIntakes.length > 0) {
    lines.push(
      `RECENT_INTAKES: ${JSON.stringify(
        lookup.recentIntakes.map((i) => ({
          at: i.at,
          summary: i.summary,
          urgency: i.urgency,
        }))
      )}`
    );
  }

  return lines;
}

function buildTurnContext(
  currentIntake: StructuredIntake,
  params: {
    isInit: boolean;
    registrationHint?: string;
    bookingContext?: BookingChatContext;
    leadDraft?: LeadDraft;
    vehicleMemory?: VehicleMemoryLookupResult;
    advisorRoute?: AdvisorRouteContext;
    availabilityBlock?: string;
  }
): string {
  const memoryLines = params.vehicleMemory
    ? buildVehicleMemoryBlock(params.vehicleMemory)
    : [];

  const routeBlock = formatAdvisorRouteForPrompt(params.advisorRoute, {
    isInit: params.isInit,
  });

  const workflowMode = resolveWorkflowMode(params.advisorRoute);
  const validation = validateLeadCompletion(
    workflowMode,
    currentIntake,
    params.leadDraft ?? {},
    params.registrationHint
  );

  const lines = [
    `CURRENT_INTAKE: ${JSON.stringify(currentIntake)}`,
    workflowValidationBlock(workflowMode, validation, currentIntake, params.leadDraft ?? {}),
    bookingContextLine(params.bookingContext),
    routeBlock,
    params.availabilityBlock ?? "",
    ...memoryLines,
    params.registrationHint && !params.vehicleMemory?.regDisplay
      ? `Registration hint: ${params.registrationHint}`
      : "",
    params.leadDraft?.name && !params.vehicleMemory?.returning
      ? `Known name: ${params.leadDraft.name}`
      : "",
  ].filter(Boolean);

  const isHeroInit =
    params.isInit &&
    (params.advisorRoute?.surface === "hero_ai_assistant" ||
      params.advisorRoute?.entry_point === "hero_ai_assistant");

  if (params.isInit && !isHeroInit) {
    const returningHint =
      params.vehicleMemory?.returning && params.vehicleMemory.customer?.name
        ? ` RETURNING customer — greet by first name, reference their vehicle briefly, then one question about today's issue.`
        : params.vehicleMemory?.vehicle?.make
          ? ` Plate on file — acknowledge their ${[params.vehicleMemory.vehicle.year, params.vehicleMemory.vehicle.make, params.vehicleMemory.vehicle.model].filter(Boolean).join(" ")} and ask what they need (do NOT ask make/model).`
          : "";

    lines.unshift(
      `Session start. Greet briefly: "${advisorIntro(Boolean(params.bookingContext))}"${returningHint || " Then one focused question."}`
    );
  }

  return lines.join("\n");
}

/**
 * Run one Gemini advisor turn — conversational reply + updated structured intake.
 */
export async function runGeminiAdvisorTurn(params: {
  messages: ChatMessage[];
  userMessage: string;
  isInit: boolean;
  structuredIntake?: StructuredIntake;
  leadDraft?: LeadDraft;
  registrationHint?: string;
  bookingContext?: BookingChatContext;
  advisorRoute?: AdvisorRouteContext;
  vehicleMemory?: VehicleMemoryLookupResult;
}): Promise<AdvisorTurnResult> {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const apiKey = process.env.GEMINI_API_KEY!.trim();

  const currentIntake = params.structuredIntake ?? createEmptyStructuredIntake();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getModelName(),
    systemInstruction: `${buildSystemPrompt()}\n\n${JSON_INSTRUCTION}`,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.6,
      maxOutputTokens: 2048,
    },
  });

  const history = toGeminiHistory(params.messages);
  const workflowModePreview = resolveWorkflowMode(params.advisorRoute);
  const availabilityBlock =
    workflowModePreview === "booking"
      ? await formatAvailabilityPromptBlock()
      : undefined;

  const context = buildTurnContext(currentIntake, {
    isInit: params.isInit,
    registrationHint: params.registrationHint,
    bookingContext: params.bookingContext,
    leadDraft: params.leadDraft,
    vehicleMemory: params.vehicleMemory,
    advisorRoute: params.advisorRoute,
    availabilityBlock,
  });

  const last = params.messages[params.messages.length - 1];
  const userAlreadyInHistory =
    !params.isInit &&
    last?.role === "user" &&
    last.content.trim() === params.userMessage.trim();

  const userText = params.isInit
    ? context
    : userAlreadyInHistory
      ? `[Context update]\n${context}`
      : `${params.userMessage}\n\n[Context]\n${context}`;

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userText);
  const rawText = result.response.text();
  const parseResult = parseGeminiResponse(rawText);
  if (!parseResult.ok) {
    return buildParseFailureTurn(params, parseResult);
  }
  const payload = parseResult.payload;
  const lockedVehicle = resolveDvlaVehicleFacts({
    vehicleMemory: params.vehicleMemory,
    advisorRoute: params.advisorRoute,
  });
  const mergedIntake = mergeStructuredIntake(
    currentIntake,
    payload.structuredIntake,
    lockedVehicle
  );
  let structuredIntake = sanitizeStructuredIntakeContact(mergedIntake);

  const workflowMode = resolveWorkflowMode(params.advisorRoute);
  const explicitHandoffOnly =
    params.advisorRoute?.handoff_policy === "explicit_only";

  let leadDraft = sanitizeLeadDraftContact(
    structuredIntakeToLeadDraft(structuredIntake, {
      ...params.leadDraft,
      registration: params.registrationHint ?? params.leadDraft?.registration,
    })
  );

  const quality = applyUnifiedIntakeQuality({
    mode: workflowMode,
    intake: structuredIntake,
    leadDraft,
    messages: params.messages,
    userMessage: params.isInit ? "" : params.userMessage,
  });
  structuredIntake = quality.intake;
  leadDraft = sanitizeLeadDraftContact(quality.leadDraft);

  const validation = validateLeadCompletion(
    workflowMode,
    structuredIntake,
    leadDraft,
    params.registrationHint
  );

  if (workflowMode === "booking") {
    emitBookingValidationTrace({
      mode: "booking",
      structuredIntake,
      leadDraft,
      registrationHint: params.registrationHint,
      modelMarkedComplete: payload.intakeComplete === true,
      geminiIntakeComplete: payload.intakeComplete,
    });
  }

  const intakeComplete = isHandoffIntakeComplete(workflowMode, validation);

  const mechanicSummary = structuredIntakeToMechanicSummary(
    structuredIntake,
    params.registrationHint ?? leadDraft.registration
  );

  const intakeState = structuredIntakeToIntakeState(structuredIntake, intakeComplete);

  if (workflowMode === "pricing" && pricingEstimateReady(structuredIntake)) {
    structuredIntake = applyPricingTerminalIntent(structuredIntake);
  }

  const handoffAllowed = isHandoffClaimAllowed(validation);

  const callbackMode = workflowMode === "callback";
  const callbackReady = callbackMode && validation.canSubmit;

  const pricingTurn = enforcePricingModeTurn({
    mode: workflowMode,
    intake: structuredIntake,
    content: payload.assistantMessage.trim(),
    chips: normalizeChips(payload.suggestionChips, payload.quickReplies),
    handoffAllowed,
  });

  const canonicalEngine =
    lockedVehicle?.engine?.trim() || structuredIntake.vehicle.engine?.trim() || undefined;

  let rawContent = pricingTurn.content;
  if (workflowMode === "pricing") {
    rawContent = stripPricingFiller(rawContent);
    rawContent = capPricingBubbles(rawContent);
  }

  const gatedChips = enforceHandoffWorkflowChips({
    mode: workflowMode,
    chips: pricingTurn.chips,
    validation,
    handoffAllowed,
    intake: structuredIntake,
  });

  const diagnosticTurn = enforceDiagnosticModeTurn({
    mode: workflowMode,
    intake: structuredIntake,
    content: rawContent,
    chips: gatedChips,
  });

  rawContent = diagnosticTurn.content;

  const callbackTurn = enforceCallbackModeTurn({
    mode: workflowMode,
    intake: structuredIntake,
    leadDraft,
    content: rawContent,
    chips: diagnosticTurn.chips ?? gatedChips,
    validation,
    handoffAllowed,
    messages: params.messages,
  });

  rawContent = callbackTurn.content;

  // Server-side closed-day enforcement for booking mode (Sunday / closures).
  let closedDayChips: SuggestionChip[] | undefined;
  if (workflowMode === "booking" && !params.isInit) {
    const closedReq = await resolveClosedDateRequest({
      userMessage: params.userMessage,
      preferredDate: leadDraft.preferredDate,
    });
    if (closedReq?.closed && closedReq.assistantHint) {
      rawContent = closedReq.assistantHint;
      closedDayChips = closedReq.nextOpenDates.map((iso, i) => ({
        id: `next-open-${i}`,
        label: formatUkDate(iso),
        message: `I'd like ${formatUkDate(iso)}`,
      }));
      if (leadDraft.preferredDate) {
        leadDraft = { ...leadDraft, preferredDate: undefined };
      }
      if (structuredIntake.preferredBookingTime) {
        structuredIntake = { ...structuredIntake, preferredBookingTime: "" };
      }
    }
  }

  let content = sanitizeAssistantContactPlaceholders(rawContent, validation, {
    name: leadDraft.name ?? structuredIntake.customer.name,
    phone: leadDraft.phone ?? structuredIntake.customer.contact,
  });
  if (shouldBlockPrematureCompletionMessage(content, handoffAllowed)) {
    content = softenPrematureCompletionMessage(content);
  }
  content = finalizeAssistantContent(content, {
    canonicalEngine,
    pricingMode: workflowMode === "pricing",
  });

  return {
    content,
    suggestionChips:
      closedDayChips ??
      callbackTurn.chips ??
      diagnosticTurn.chips ??
      gatedChips,
    typingLabel: payload.typingLabel,
    intakeState,
    leadDraft,
    mechanicSummary,
    intakeComplete,
    callbackReady,
    shouldCaptureLead: !explicitHandoffOnly && validation.canSubmit,
    structuredIntake,
  };
}
