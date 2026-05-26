import { GoogleGenerativeAI } from "@google/generative-ai";
import { isGeminiConfigured } from "@/lib/config/advisor";
import { buildSystemPrompt } from "@/ai/prompts/systemPrompt";
import { advisorIntro } from "@/lib/config/brand";
import {
  bookingContextLine,
  isStructuredIntakeReadyForHandoff,
  mergeStructuredIntake,
  structuredIntakeToIntakeState,
  structuredIntakeToLeadDraft,
  structuredIntakeToMechanicSummary,
} from "@/lib/services/intake-mapper";
import type { AdvisorTurnResult } from "@/lib/services/service-advisor.engine";
import type { BookingChatContext, ChatMessage, LeadDraft } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";
import {
  createEmptyStructuredIntake,
  type StructuredIntake,
} from "@/lib/types/structured-intake";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";

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

type GeminiTurnPayload = {
  assistantMessage: string;
  suggestionChips?: unknown;
  quickReplies?: unknown;
  structuredIntake?: Partial<StructuredIntake>;
  intakeComplete?: boolean;
  typingLabel?: string;
};

const JSON_INSTRUCTION = `
You must respond with a single JSON object (no markdown fences) matching this shape:
{
  "assistantMessage": "string — conversational reply, one focused question or step",
  "suggestionChips": [{"id":"unique","label":"short button text","message":"natural reply sent if tapped"}],
  "structuredIntake": {
    "customer": { "name": "", "contact": "" },
    "vehicle": { "make": "", "model": "", "year": "", "engine": "", "mileage": "" },
    "issue": {
      "symptoms": [],
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
- Extract every detail the customer gives — symptoms, dashboard warning lights (e.g. "Engine", "ABS", "Battery", "Oil pressure"), when it started, whether the car is drivable, vehicle make/model/year/engine/mileage, name, phone/email.
- "issue.drivable": true if customer confirms it drives safely, false if they say they're avoiding driving / it's unsafe / won't start, null if unknown.
- "issue.severity": "low" | "medium" | "high" based on safety risk (flashing engine light, brake failure, overheating = high).
- "aiEstimate.estimatedPriceRange": a rough non-binding UK GBP range ("£80–£350 indicative") when you have enough context, else empty.
- "aiEstimate.possibleCauses": cautious language only ("may indicate", "could point to"), never definitive diagnosis.
- "aiEstimate.recommendedNextStep": short action ("Bring in for diagnostic scan", "Avoid driving — request recovery", "Routine service check").
- "aiEstimate.summary": 1–2 sentence neutral narrative written FOR THE MECHANIC (not the customer) — the workshop reads this first. Example: "Customer reports knocking sound from front left when braking at low speed on 2018 BMW 320d. No warning lights, car drives safely. Likely brake hardware — recommend inspection of pads/discs and caliper guides."
- "intent": classify the customer's goal:
    "book"       — wants a workshop visit / slot scheduled
    "callback"   — wants a mechanic to phone them back
    "quote"      — wants an indicative price before deciding
    "info_only"  — general question, not committing to a visit yet
    ""           — not yet clear
- "preferredBookingTime": free-text the customer named ("Tomorrow afternoon", "Sat morning", "ASAP", "Anytime this week"). Empty if not stated.

Conversation rules:
- Ask at most one main question per turn.
- Set "intakeComplete": true once you have name + phone/email + vehicle (make/model OR registration) + a clear symptom AND have offered a workshop handoff. Partial info is fine for an early callback — set intakeComplete true even if some non-critical fields are blank, as long as the workshop has enough to act on.
- If safety may be affected (brakes, overheating, flashing EML), tell the customer to avoid driving in assistantMessage and set urgencyLevel="high".

VEHICLE_PROFILE & RETURNING_CUSTOMER (when present in the user turn):
- The system performs a DVLA + internal-memory lookup whenever a registration is known. Treat these blocks as authoritative ground truth.
- NEVER ask for any fact already populated in VEHICLE_PROFILE (make, model, year, fuel, engine). Reference it naturally instead, e.g. "I can see your 2017 BMW 320d — what's it doing?".
- NEVER ask the customer to re-provide name/phone/email if RETURNING_CUSTOMER lists them. Greet by first name ("Welcome back, James!") and ask only what's needed for THIS visit (issue, urgency, drivability, preferred slot).
- If RECENT_INTAKES are present, you may reference the most recent one briefly when relevant ("Last time it was a brake job — what's happening now?"). Don't read them out as a list.
- If VEHICLE_PROFILE arrives mid-conversation, acknowledge once and continue. Don't restart the intake.
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

function parseGeminiJson(raw: string): GeminiTurnPayload {
  const trimmed = raw.trim();
  const jsonStr = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  const parsed = JSON.parse(jsonStr) as GeminiTurnPayload;
  if (!parsed.assistantMessage?.trim()) {
    throw new Error("Gemini response missing assistantMessage");
  }
  return parsed;
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
        taxStatus: v.taxStatus || undefined,
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
  }
): string {
  const memoryLines = params.vehicleMemory
    ? buildVehicleMemoryBlock(params.vehicleMemory)
    : [];

  const lines = [
    `CURRENT_INTAKE: ${JSON.stringify(currentIntake)}`,
    bookingContextLine(params.bookingContext),
    ...memoryLines,
    params.registrationHint && !params.vehicleMemory?.regDisplay
      ? `Registration hint: ${params.registrationHint}`
      : "",
    params.leadDraft?.name && !params.vehicleMemory?.returning
      ? `Known name: ${params.leadDraft.name}`
      : "",
  ].filter(Boolean);

  if (params.isInit) {
    const returningHint =
      params.vehicleMemory?.returning && params.vehicleMemory.customer?.name
        ? ` This is a RETURNING customer — greet them by first name and reference their ${
            params.vehicleMemory.vehicle
              ? `${[params.vehicleMemory.vehicle.year, params.vehicleMemory.vehicle.make, params.vehicleMemory.vehicle.model].filter(Boolean).join(" ")}`
              : "vehicle"
          } warmly, then ask what's brought them in today.`
        : params.vehicleMemory?.vehicle?.make
          ? ` The customer's plate is on file — open by acknowledging their ${[params.vehicleMemory.vehicle.year, params.vehicleMemory.vehicle.make, params.vehicleMemory.vehicle.model].filter(Boolean).join(" ")} and asking what issue they're having (do NOT ask what vehicle they have).`
          : "";

    lines.unshift(
      `Session start. Greet briefly in the style of: "${advisorIntro}"${returningHint || " then ask about their vehicle issue."}`
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
  const context = buildTurnContext(currentIntake, params);

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
  const payload = parseGeminiJson(result.response.text());
  const structuredIntake = mergeStructuredIntake(currentIntake, payload.structuredIntake);

  const intakeComplete =
    payload.intakeComplete === true || isStructuredIntakeReadyForHandoff(structuredIntake);

  const leadDraft = structuredIntakeToLeadDraft(structuredIntake, {
    ...params.leadDraft,
    registration: params.registrationHint ?? params.leadDraft?.registration,
  });

  const mechanicSummary = structuredIntakeToMechanicSummary(
    structuredIntake,
    params.registrationHint ?? leadDraft.registration
  );

  const intakeState = structuredIntakeToIntakeState(structuredIntake, intakeComplete);

  return {
    content: payload.assistantMessage.trim(),
    suggestionChips: normalizeChips(payload.suggestionChips, payload.quickReplies),
    typingLabel: payload.typingLabel,
    intakeState,
    leadDraft,
    mechanicSummary,
    intakeComplete,
    shouldCaptureLead: intakeComplete && Boolean(leadDraft.name && leadDraft.phone),
    structuredIntake,
  };
}
