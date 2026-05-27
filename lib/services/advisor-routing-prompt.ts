import type {
  AdvisorRouteContext,
  AdvisorSurface,
} from "@/lib/types/advisor-routing";
import type { VehicleReport } from "@/lib/types/vehicle-report";

/** Build a compact vehicle snapshot for advisor routing from a hero report. */
export function vehicleSnapshotFromReport(
  report: VehicleReport
): NonNullable<AdvisorRouteContext["vehicle_data"]> {
  const tokens = report.profile.makeModel.trim().split(/\s+/);
  const make = tokens[0] ?? "";
  const model = tokens.slice(1).join(" ") || report.profile.makeModel;

  return {
    registration: report.reg,
    make,
    model,
    year: String(report.profile.year),
    fuel: report.profile.fuel,
    engine: report.profile.engine,
  };
}

export function vehicleSnapshotFromLegacy(vehicle: {
  reg: string;
  makeModel: string;
  meta?: string;
}): NonNullable<AdvisorRouteContext["vehicle_data"]> {
  const tokens = vehicle.makeModel.trim().split(/\s+/);
  const make = tokens[0] ?? "";
  const model = tokens.slice(1).join(" ") || vehicle.makeModel;

  const meta = vehicle.meta ?? "";
  const yearMatch = meta.match(/\b(19|20)\d{2}\b/);
  const fuelMatch = meta.match(/(Petrol|Diesel|Electric|Hybrid)/i);
  const year = yearMatch ? String(yearMatch[0]) : "";
  const fuel = (fuelMatch?.[1] ?? "Diesel").replace(/^./, (c) => c.toUpperCase());

  // Keep the same intent as `lib/vehicle-report-builder` (demo dataset mapping).
  const engine =
    vehicle.makeModel.includes("320D")
      ? "2.0L Turbo Diesel (B47)"
      : vehicle.makeModel.includes("A4")
        ? "2.0L TDI"
        : vehicle.makeModel.includes("C220")
          ? "2.0L Diesel (OM654)"
          : vehicle.makeModel.includes("GTD")
            ? "2.0L TDI (DSG)"
            : fuel === "Diesel"
              ? "2.0L Diesel"
              : "2.0L Petrol";

  return {
    registration: vehicle.reg,
    make,
    model,
    year,
    fuel,
    engine,
  };
}

function resolveSurface(route: AdvisorRouteContext): AdvisorSurface {
  if (route.surface) return route.surface;
  if (route.entry_point === "hero_ai_assistant") return "hero_ai_assistant";
  if (route.entry_point === "mot_section") return "mot_help";
  if (route.intent === "booking" || route.entry_point.includes("booking")) {
    return "booking_flow";
  }
  return "general";
}

const SURFACE_BLOCKS: Record<AdvisorSurface, string> = {
  booking_flow: `
SURFACE: booking_flow
- You are a workshop intake assistant, NOT the primary booking system.
- Prioritise confirming service, date preference, and contact details.
- Ask at most ONE brief symptom question only if the customer mentions a problem.
- Avoid deep diagnostics, long fault trees, or multi-step technical interviews.
- Steer toward booking / callback. Set structuredIntake.intent to "book" when appropriate.
- Do not quote exact repair prices — inspection or service pricing only if relevant.`.trim(),

  hero_ai_assistant: `
SURFACE: hero_ai_assistant
- Premium automotive concierge — calm, intelligent, frictionless. NOT a generic chatbot.
- The customer chose an intent (diagnostic, pricing, callback, booking, quick question). Follow that thread.
- Do NOT open with "Hello I am an AI" or workshop-intake jargon.
- Diagnostic mode: stay conversational — gather symptoms with ONE question per turn. Do NOT rush to contact details.
- Pricing mode: explain rough UK ranges and what affects quotes; only offer mechanic review if the customer wants it.
- Callback mode: collect issue context briefly, then name, mobile, and timing in chat — do not pretend the workshop was notified until confirmed.
- Booking mode: help choose MOT vs service and next steps toward booking — avoid deep fault trees.
- Quick question mode: short, direct answers (safety, urgency, ballpark cost, MOT timing).
- Never guarantee diagnosis, final pricing, or that the vehicle is fully safe to drive.
- Use known DVLA vehicle data naturally; do NOT re-ask registration, make, model, year, or engine on file.
- Populate aiEstimate.summary as the conversation develops for eventual workshop handoff.`.trim(),

  mot_help: `
SURFACE: mot_help
- Focus on MOT eligibility, pre-checks, advisories, retests, and booking an MOT slot.
- Passenger cars only — explain professionally if asked about vans/commercial (not eligible).
- Saturday MOT hours 08:00–13:00 when relevant.
- Keep replies short; offer booking or callback.`.trim(),

  warning_light_help: `
SURFACE: warning_light_help
- Customer is concerned about a dashboard warning light or message.
- Ask which light/message, steady vs flashing, and whether drivability changed — one question at a time.
- Explain common meanings cautiously; recommend inspection for flashing engine management lights.
- Apply safety rules for overheating, brakes, smoke, severe knocking, steering loss, gearbox slipping.`.trim(),

  floating_widget: `
SURFACE: floating_widget
- General after-hours service advisor — concise intake for workshop callback.
- Balance helpful guidance with lead qualification (symptoms, urgency, contact).`.trim(),

  general: `
SURFACE: general
- Standard service advisor flow — professional, concise, one question per turn.`.trim(),
};

/**
 * Turn-level instructions appended to Gemini context based on how the user
 * entered the advisor. Keep additions short — the base system prompt still applies.
 */
export function formatAdvisorRouteForPrompt(
  route: AdvisorRouteContext | undefined,
  opts?: { isInit?: boolean }
): string {
  if (!route) return "";

  const surface = resolveSurface(route);
  const today = new Date().toISOString().slice(0, 10);
  const vehicleLine = route.vehicle_data
    ? `Known vehicle: ${JSON.stringify(route.vehicle_data)}`
    : "";

  const intentBlocks: Record<AdvisorRouteContext["intent"], string> = {
    booking: `
INTENT: booking — fast path; minimal diagnostic depth.`.trim(),

    diagnostic_help: `
INTENT: diagnostic_help — service advisor depth; symptoms, ranges, workshop summary.`.trim(),

    vehicle_insights: `
INTENT: vehicle_insights — explain report data if asked; offer book or speak to team.`.trim(),

    account_signup: `
INTENT: account_signup — membership benefits briefly if asked.`.trim(),

    general: "",
  };

  const modeLine = route.concierge_mode
    ? `CONCIERGE_MODE: ${route.concierge_mode}`
    : "";

  const handoffLine =
    route.handoff_policy === "explicit_only"
      ? `
HANDOFF_POLICY: explicit_only
- NEVER set intakeComplete true during casual diagnostic or pricing conversation.
- NEVER ask for name/phone until the customer explicitly wants mechanic review or a callback.
- When offering workshop handoff, use suggestionChips with ids "escalate-callback" (label e.g. "Request callback") and "escalate-continue" (label e.g. "Continue here").
- Do NOT imply an email was sent or a mechanic was notified until intakeComplete is true and the customer has confirmed callback details.`.trim()
      : "";

  const safeToDriveBlock =
    route.concierge_focus === "safe_to_drive"
      ? `
CONCIERGE_FOCUS: safe_to_drive
- Customer needs honest drivability guidance — urgent vs can wait for short journeys.
- One question per turn. No guarantees the vehicle is safe.
- Apply safety rules for brakes, overheating, smoke, steering loss, flashing EML, severe knocking.
- Keep assistantMessage very short when suggestionChips are present.`.trim()
      : "";

  const conversationUx = `
CONVERSATION_UX (all hero modes):
- Sound like a calm workshop service advisor — not a generic AI tutor.
- No filler, no long educational paragraphs, no repeating the mode intro.
- When suggestionChips are offered: assistantMessage is ONE short sentence (question or next step) — chips carry the options.
- One focused question per turn unless answering a direct quick question.`.trim();

  const callbackBlock =
    route.concierge_mode === "callback"
      ? `
CONCIERGE_MODE: callback (conversational — NO forms in the UI)
Flow — one step per turn, calm premium tone:
1) If the customer has not yet explained the reason: ask what they would like the mechanic to call about (one short question).
2) After they explain: briefly assess whether a phone callback is appropriate (yes for advice/next steps; be honest if inspection is likely needed but a call can still help).
3) Collect name ONLY if not already in RETURNING_CUSTOMER / lead context: "Before I send this through, what name should the mechanic ask for?" — when they answer, reply once with warmth e.g. "Nice to meet you, {FirstName}."
4) Collect mobile ONLY if not known: "What number would you like the mechanic to call?" Accept UK formats (07…, +447…). If invalid, ask them to double-check politely — do NOT set phone in structuredIntake until plausible.
5) Ask callback timing: "Would you like to specify a preferred callback time, or should the team contact you as soon as a mechanic becomes available?" Use suggestionChips: id "callback-time-asap" label "ASAP", "callback-time-morning" "Morning", "callback-time-afternoon" "Afternoon", "callback-time-evening" "Evening", "callback-time-any" "Any time", "callback-time-custom" "I'll type a time". Accept skip phrases (no preference, any time, just send it).
6) When name + phone + issue context + timing preference (or explicit ASAP/any time) are captured: set structuredIntake.intent to "callback", set preferredBookingTime, set intakeComplete true, confirm naturally that you are sending to the workshop (do not say it was already sent before this turn). Optional chip id "callback-confirm-send" label "Send request".
- NEVER show or reference embedded forms. Use normal chat only.
- Keep assistantMessage short (1–3 sentences).`.trim()
      : "";

  const pricingBlock =
    route.concierge_mode === "pricing"
      ? `
CONCIERGE_MODE: pricing — rough estimate, NEVER a confirmed quote
Tone: trustworthy, realistic, premium. Southampton local market context.

1) Always start the FIRST pricing reply with a calm disclaimer before any numbers:
   - that pricing is approximate
   - that a confirmed quote requires inspection/diagnosis
   - mention Southampton garage rates for parts + labour

2) Use the full vehicle snapshot (year, make/model, engine variant, fuel type) from Known vehicle.
   Reference it naturally, e.g. "2019 BMW 320D M Sport 2.0 Diesel" (or the closest available details).
   Do NOT invent trim/generation if it isn't present — instead, use what you have and say it's based on the configuration.

3) Structure the reply with semantic lines:
   - INFO: approximate estimate context + what affects pricing
   - ESTIMATE: rough ranges (non-binding) framed as typical local estimates
   - NEXT STEP: next actions (diagnostics / callback / booking / ask another question)

4) Rough estimate vs confirmed quote (must be explicit):
   - Rough estimate: "typical range" and "based on similar cars in Southampton"
   - Confirmed quote: only after inspection confirms the fault + parts condition (corrosion/seized components etc.)

5) Quick replies:
   - Always return EXACTLY 4 suggestionChips on pricing turns.
   - Chips must be vehicle-aware: prefer likely repair areas for this engine/drivetrain/fuel (e.g. DPF/emissions for diesels, turbo issues for turbo diesels).
   - Also include next actions across the set (Book diagnostics / Request callback / MOT/service / Ask another question).

6) If the user’s issue is vague or unknown:
   - Do NOT invent ranges.
   - Offer likely causes in cautious language
   - Ask ONE clarifying question OR offer mechanic callback for realistic next steps.

Keep assistantMessage calm and concise — no giant blocks.`.trim()
      : "";

  const modeHints: Partial<Record<string, string>> = {
    diagnostic: "Stay in diagnostic conversation. No contact capture unless customer chooses callback.",
    pricing: "Focus on indicative UK ranges and factors — optional mechanic review only if they ask.",
    callback: "Follow CALLBACK conversational flow in CONCIERGE_MODE block.",
    booking: "Help select MOT/service and booking path — minimal diagnostics.",
    quick_question: "Answer briefly; one follow-up question at most.",
  };

  const modeHint = route.concierge_mode
    ? modeHints[route.concierge_mode] ?? ""
    : "";

  const blocks = [
    `ADVISOR_ROUTE: ${JSON.stringify({
      entry_point: route.entry_point,
      intent: route.intent,
      surface,
      concierge_mode: route.concierge_mode,
      handoff_policy: route.handoff_policy,
    })}`,
    `TODAY: ${today}`,
    vehicleLine,
    modeLine,
    modeHint,
    handoffLine,
    conversationUx,
    callbackBlock,
    pricingBlock,
    safeToDriveBlock,
    SURFACE_BLOCKS[surface],
    intentBlocks[route.intent] ?? "",
  ];

  return blocks.filter(Boolean).join("\n");
}
