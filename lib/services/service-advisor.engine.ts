import { ADVISOR_TYPING_LABELS, advisorIntro } from "@/lib/config/brand";
import { businessConfig } from "@/lib/config/business";
import { motPolicy } from "@/lib/config/services";
import type { BookingChatContext, LeadDraft } from "@/lib/types/chat";
import type {
  IntakePhase,
  IntakeSeverity,
  IntakeState,
  MechanicIntakeSummary,
  SuggestionChip,
  SymptomCategory,
} from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";

const INIT_TOKEN = "__init__";

export { INIT_TOKEN };

type CategoryProfile = {
  label: string;
  clarifyQuestion: string;
  clarifyChips: SuggestionChip[];
  causes: string[];
  estimateLow: number;
  estimateHigh: number;
  severity: IntakeSeverity;
  severityNote: string;
};

const PROFILES: Record<SymptomCategory, CategoryProfile> = {
  brakes: {
    label: "braking",
    clarifyQuestion:
      "Understood. Does the vibration or noise happen mainly when braking, at higher speeds, or constantly while driving?",
    clarifyChips: [
      { id: "brake-when", label: "When braking", message: "Mainly when braking" },
      { id: "brake-speed", label: "At higher speeds", message: "At higher speeds" },
      { id: "brake-constant", label: "All the time", message: "Constantly while driving" },
      { id: "brake-light", label: "Light braking only", message: "Mostly under light braking" },
    ],
    causes: ["worn brake discs", "uneven pad deposit", "warped rotors", "suspension wear under load"],
    estimateLow: 80,
    estimateHigh: 350,
    severity: "medium",
    severityNote: "Brake-related symptoms should be checked soon — avoid heavy braking until inspected.",
  },
  suspension: {
    label: "suspension",
    clarifyQuestion:
      "Thanks. Does the knock or bounce appear over bumps, when turning, or at steady motorway speeds?",
    clarifyChips: [
      { id: "sus-bump", label: "Over bumps", message: "Over bumps and uneven roads" },
      { id: "sus-turn", label: "When turning", message: "When turning or cornering" },
      { id: "sus-motorway", label: "At speed", message: "At steady motorway speeds" },
      { id: "sus-all", label: "Most situations", message: "In most driving situations" },
    ],
    causes: ["worn shock absorbers", "damaged drop links", "bush wear", "spring fatigue"],
    estimateLow: 120,
    estimateHigh: 480,
    severity: "medium",
    severityNote: "Suspension wear can affect stability — worth booking inspection if worsening.",
  },
  engine_warning: {
    label: "warning lights",
    clarifyQuestion:
      "Which light is on — steady engine management (EML), flashing EML, ABS, or something else? Is the car driving normally?",
    clarifyChips: [
      { id: "eml-steady", label: "Steady EML", message: "Steady engine management light" },
      { id: "eml-flash", label: "Flashing EML", message: "Flashing engine management light" },
      { id: "abs-light", label: "ABS / brake light", message: "ABS or brake warning light" },
      { id: "drives-ok", label: "Drives normally", message: "Car still drives normally" },
    ],
    causes: ["sensor or emissions fault", "misfire", "catalytic efficiency", "electrical fault"],
    estimateLow: 60,
    estimateHigh: 420,
    severity: "high",
    severityNote: "A flashing engine light often needs prompt diagnostics — avoid hard driving until checked.",
  },
  mot: {
    label: "MOT",
    clarifyQuestion:
      "When is your MOT due, and is it a standard passenger car (not a van or commercial vehicle)?",
    clarifyChips: [
      { id: "mot-soon", label: "Due within 2 weeks", message: "MOT due within two weeks" },
      { id: "mot-expired", label: "Already expired", message: "MOT has expired" },
      { id: "mot-prep", label: "Pre-MOT check", message: "I'd like a pre-MOT inspection" },
      { id: "mot-car", label: "Standard car", message: "Standard passenger car" },
    ],
    causes: ["wear items flagged at test", "lights or tyres", "emissions", "advisory items from last MOT"],
    estimateLow: 45,
    estimateHigh: 280,
    severity: "low",
    severityNote: "MOT pricing depends on vehicle class and any repairs needed after inspection.",
  },
  battery: {
    label: "battery / starting",
    clarifyQuestion:
      "Does the engine crank slowly, click with no start, or fail only after the car has been parked a while?",
    clarifyChips: [
      { id: "bat-slow", label: "Slow crank", message: "Engine cranks slowly" },
      { id: "bat-click", label: "Click, no start", message: "Clicking but won't start" },
      { id: "bat-cold", label: "After parking", message: "Fails after sitting overnight" },
      { id: "bat-random", label: "Intermittent", message: "Intermittent starting issues" },
    ],
    causes: ["weak battery", "alternator output", "parasitic drain", "starter motor wear"],
    estimateLow: 90,
    estimateHigh: 320,
    severity: "medium",
    severityNote: "Starting faults can leave you stranded — we'll prioritise callback if you're stuck.",
  },
  dpf: {
    label: "DPF",
    clarifyQuestion:
      "Is the DPF or engine warning on, and have you noticed reduced power, limp mode, or lots of short journeys?",
    clarifyChips: [
      { id: "dpf-light", label: "DPF warning on", message: "DPF warning light is on" },
      { id: "dpf-limp", label: "Limp mode", message: "Car is in limp mode" },
      { id: "dpf-short", label: "Short trips", message: "Mostly short journeys" },
      { id: "dpf-regen", label: "Failed regen", message: "Regeneration doesn't complete" },
    ],
    causes: ["soot loading", "failed regeneration", "sensor fault", "underlying engine issue"],
    estimateLow: 150,
    estimateHigh: 650,
    severity: "high",
    severityNote: "DPF issues can escalate quickly — avoid prolonged idling until reviewed.",
  },
  overheating: {
    label: "overheating",
    clarifyQuestion:
      "Is the temperature gauge in the red, is steam visible, or does it only climb in traffic?",
    clarifyChips: [
      { id: "heat-red", label: "Gauge in red", message: "Temperature gauge in the red" },
      { id: "heat-steam", label: "Steam / smell", message: "Steam or hot coolant smell" },
      { id: "heat-traffic", label: "In traffic only", message: "Only overheats in traffic" },
      { id: "heat-recent", label: "Started recently", message: "Started in the last few days" },
    ],
    causes: ["coolant leak", "thermostat", "water pump", "radiator or hose fault"],
    estimateLow: 80,
    estimateHigh: 520,
    severity: "high",
    severityNote: "Stop driving if the gauge is high or you see steam — risk of engine damage.",
  },
  noise: {
    label: "noise",
    clarifyQuestion:
      "Where does the noise seem to come from — front, rear, engine bay — and does it change with speed or revs?",
    clarifyChips: [
      { id: "noise-front", label: "Front", message: "Noise from the front" },
      { id: "noise-rear", label: "Rear", message: "Noise from the rear" },
      { id: "noise-engine", label: "Engine bay", message: "From the engine bay" },
      { id: "noise-speed", label: "With speed", message: "Gets louder with speed" },
    ],
    causes: ["wheel bearing wear", "exhaust contact", "drive belt", "loose undertray or heat shield"],
    estimateLow: 60,
    estimateHigh: 380,
    severity: "medium",
    severityNote: "New or worsening noises are worth recording — note when they appear for our technician.",
  },
  steering: {
    label: "steering",
    clarifyQuestion:
      "Do you feel vibration through the steering wheel, pulling to one side, or both — and at what speeds?",
    clarifyChips: [
      { id: "steer-vib", label: "Wheel vibration", message: "Vibration through the steering wheel" },
      { id: "steer-pull", label: "Pulls to one side", message: "Car pulls to one side" },
      { id: "steer-high", label: "At motorway speed", message: "Mainly at motorway speeds" },
      { id: "steer-low", label: "At low speed", message: "At low speeds too" },
    ],
    causes: ["wheel imbalance", "tyre wear", "tracking out of spec", "worn steering joints"],
    estimateLow: 50,
    estimateHigh: 320,
    severity: "medium",
    severityNote: "Steering symptoms affect control — book inspection if it feels unsafe.",
  },
  starting: {
    label: "starting",
    clarifyQuestion:
      "When you turn the key or press start, do you hear cranking, a single click, or nothing at all?",
    clarifyChips: [
      { id: "start-crank", label: "Cranks, won't fire", message: "Cranks but won't fire" },
      { id: "start-click", label: "Single click", message: "Single click then nothing" },
      { id: "start-nothing", label: "No response", message: "No response at all" },
      { id: "start-hot", label: "When warm", message: "Only when engine is hot" },
    ],
    causes: ["fuel or ignition fault", "immobiliser", "starter motor", "battery / earth issue"],
    estimateLow: 70,
    estimateHigh: 450,
    severity: "high",
    severityNote: "If you're stranded, mention that — we'll aim for a priority callback.",
  },
  general: {
    label: "general repair",
    clarifyQuestion:
      "When did you first notice this, and does it happen all the time or only under certain conditions?",
    clarifyChips: [
      { id: "gen-recent", label: "Started recently", message: "Started in the last week" },
      { id: "gen-ongoing", label: "Ongoing issue", message: "It's been ongoing for a while" },
      { id: "gen-intermit", label: "Intermittent", message: "Comes and goes" },
      { id: "gen-worse", label: "Getting worse", message: "It's getting worse" },
    ],
    causes: ["wear-related fault", "fluid or service item", "electrical issue", "needs diagnostic scan"],
    estimateLow: 60,
    estimateHigh: 350,
    severity: "medium",
    severityNote: "We'll narrow this down once a technician reviews your notes.",
  },
};

const WELCOME_CHIPS: SuggestionChip[] = [
  { id: "chip-brakes", label: "Brake vibration", message: "My car vibrates or squeals when braking" },
  { id: "chip-warning", label: "Warning light", message: "I have a warning light on the dashboard" },
  { id: "chip-mot", label: "MOT or service", message: "I need to book an MOT or service" },
  { id: "chip-noise", label: "Strange noise", message: "There's a strange noise from my car" },
  { id: "chip-start", label: "Won't start", message: "My car won't start properly" },
];

const CALLBACK_CHIPS: SuggestionChip[] = [
  { id: "cb-yes", label: "Yes — call me back", message: "Yes, please have a technician call me back" },
  { id: "cb-no", label: "Not yet", message: "Not yet, I just wanted guidance for now" },
  { id: "cb-whatsapp", label: "WhatsApp instead", message: "I'd prefer to continue on WhatsApp" },
];

const URGENCY_CHIPS: SuggestionChip[] = [
  { id: "urg-low", label: "Safe to drive", message: "It's safe to drive for now" },
  { id: "urg-med", label: "Needs attention soon", message: "Needs attention this week" },
  { id: "urg-high", label: "Urgent", message: "Urgent — I'd like a priority callback" },
];

function formatBookingDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + "T12:00:00");
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return isoDate;
  }
}

function defaultIntakeState(): IntakeState {
  return {
    phase: "welcome",
    symptomSummary: "",
    clarificationNotes: [],
    clarifyAsked: false,
    possibleCauses: [],
    estimateLow: 60,
    estimateHigh: 350,
    severity: "medium",
    callbackRequested: false,
    leadCaptured: false,
  };
}

function detectCategory(text: string): SymptomCategory {
  const t = text.toLowerCase();
  if (/brake|braking|pedal|disc|pad|squeal|grind.*brak/i.test(t)) return "brakes";
  if (/dpf|particulate|regen/i.test(t)) return "dpf";
  if (/overheat|over heating|temperature gauge|coolant|steam/i.test(t)) return "overheating";
  if (/warning light|engine light|eml|management light|abs light|dashboard light/i.test(t))
    return "engine_warning";
  if (/\bmot\b|mot test|mot due|annual test/i.test(t)) return "mot";
  if (/battery|won't start|wont start|flat battery|dead battery|clicking/i.test(t)) {
    if (/crank|turnover|immobil/i.test(t)) return "starting";
    return "battery";
  }
  if (/won't start|wont start|crank|turnover|immobil|no start/i.test(t)) return "starting";
  if (/suspension|knock|bump|shock|spring|bounce/i.test(t)) return "suspension";
  if (/steering|pull|drift|alignment|wheel shake|vibrat.*wheel/i.test(t)) return "steering";
  if (/noise|rattle|hum|whine|grinding|clunk/i.test(t)) return "noise";
  if (/book|appointment|service slot|schedule/i.test(t)) return "mot";
  return "general";
}

function extractUkReg(text: string): string | undefined {
  const m = text.replace(/\s/g, "").match(/\b([A-Z]{2}\d{2}[A-Z]{3}|\d[A-Z]{3}\d{3})\b/i);
  return m?.[1]?.toUpperCase();
}

function extractEmail(text: string): string | undefined {
  const m = text.match(
    /(?:^|\s)([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})(?:\s|$)/i
  );
  return m?.[1]?.toLowerCase();
}

function extractPhone(text: string): string | undefined {
  const m = text.match(/(?:\+44|0)\s*7\d[\d\s]{7,10}\d|(?:\+44|0)\s*\d[\d\s]{8,12}\d/);
  return m?.[0]?.replace(/\s/g, "");
}

function extractName(text: string): string | undefined {
  const m = text.match(
    /(?:^|\b)(?:my name is|i'm|i am|name is|call me)\s+([a-z][a-z\s'-]{1,38})/i
  );
  if (m?.[1]) return m[1].trim().replace(/\s+/g, " ");
  if (/^[a-z][a-z\s'-]{1,30}$/i.test(text.trim()) && text.trim().split(/\s+/).length <= 4) {
    return text.trim();
  }
  return undefined;
}

function extractVehicleModel(text: string): string | undefined {
  const makes =
    /(?:bmw|audi|mercedes|vw|volkswagen|ford|vauxhall|toyota|honda|nissan|peugeot|renault|skoda|seat|mini|land rover|range rover)\s+[\w\d\s.-]{1,24}/i;
  const m = text.match(makes);
  return m?.[0]?.trim().slice(0, 48);
}

function extractCallbackWindow(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/\b(morning|am\b|before 12)/i.test(t)) return "Morning (8:00–12:00)";
  if (/\b(afternoon|pm\b|after 12|14:00|15:00|16:00)/i.test(t)) return "Afternoon (12:00–17:00)";
  if (/\b(14:00|2pm|3pm|4pm|5pm|14-17|14:00.17:00)/i.test(t)) return "14:00–17:00";
  if (/\b(evening|after 5|after 17)/i.test(t)) return "After 17:00 (if available)";
  if (/\banytime|any time|flexible/i.test(t)) return "Flexible — any time";
  if (/\btomorrow\b/i.test(t)) return "Tomorrow";
  if (/\btoday\b/i.test(t)) return "Today";
  const time = text.match(/\b\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\b/);
  if (time) return time[0];
  if (text.length >= 3 && text.length <= 60) return text.trim();
  return undefined;
}

function isAffirmative(text: string): boolean {
  return /\b(yes|yeah|yep|sure|please|ok|okay|go ahead|call me|callback|book|arrange)\b/i.test(
    text
  );
}

function isNegative(text: string): boolean {
  return /\b(no|not yet|later|just guidance|don't|dont)\b/i.test(text);
}

function formatRange(low: number, high: number): string {
  return `£${low}–£${high}`;
}

function buildMechanicSummary(
  intake: IntakeState,
  draft: LeadDraft
): MechanicIntakeSummary {
  const profile = intake.category ? PROFILES[intake.category] : PROFILES.general;
  return {
    vehicle: draft.vehicleModel,
    registration: draft.registration,
    symptoms: intake.symptomSummary || draft.problemDescription || "Not specified",
    possibleCauses: intake.possibleCauses.length
      ? intake.possibleCauses
      : profile.causes.slice(0, 3),
    estimatedRange: formatRange(intake.estimateLow, intake.estimateHigh),
    severity: intake.severity,
    severityNote: profile.severityNote,
    callbackRequested: intake.callbackRequested,
    callbackWindow: draft.callbackWindow,
    customerName: draft.name,
    customerPhone: draft.phone,
  };
}

function appendSymptom(intake: IntakeState, text: string): void {
  const part = text.trim().slice(0, 200);
  if (!part) return;
  intake.symptomSummary = intake.symptomSummary
    ? `${intake.symptomSummary}; ${part}`.slice(0, 400)
    : part;
}

function applyCategory(intake: IntakeState, category: SymptomCategory): void {
  const profile = PROFILES[category];
  intake.category = category;
  intake.possibleCauses = profile.causes.slice(0, 4);
  intake.estimateLow = profile.estimateLow;
  intake.estimateHigh = profile.estimateHigh;
  intake.severity = profile.severity;
}

function adviseMessage(intake: IntakeState, forBooking: boolean): string {
  const profile = PROFILES[intake.category ?? "general"];
  const causes = intake.possibleCauses.slice(0, 3).join(", ");
  const tail = forBooking
    ? "How urgent does this feel? Then I'll note everything for a mechanic to review with your booking."
    : "Would you like a technician to review your case and call you back with a clearer plan?";
  return (
    `Based on what you've described, this may point to ${causes}.\n\n` +
    `Typical workshop guidance for similar ${profile.label} cases is around ${formatRange(intake.estimateLow, intake.estimateHigh)} depending on parts and what we find on inspection — I can't confirm an exact repair without seeing the vehicle.\n\n` +
    `${profile.severityNote}\n\n` +
    tail
  );
}

export type AdvisorTurnResult = {
  content: string;
  intakeState: IntakeState;
  leadDraft?: LeadDraft;
  mechanicSummary?: MechanicIntakeSummary;
  structuredIntake?: StructuredIntake;
  suggestionChips?: SuggestionChip[];
  typingLabel?: string;
  shouldCaptureLead?: boolean;
  skipUserMessage?: boolean;
  intakeComplete?: boolean;
};

export function runServiceAdvisorTurn(params: {
  userMessage: string;
  isInit: boolean;
  intake: IntakeState;
  leadDraft: LeadDraft;
  registrationHint?: string;
  bookingContext?: BookingChatContext;
}): AdvisorTurnResult {
  const { isInit, registrationHint, bookingContext } = params;
  const forBooking = Boolean(bookingContext);
  let intake = { ...params.intake };
  const draft: LeadDraft = { ...params.leadDraft };
  const msg = params.userMessage.trim();

  if (registrationHint && !draft.registration) {
    draft.registration = registrationHint;
  }

  if (isInit) {
    intake.phase = "symptom_capture";
    const slotLine = bookingContext
      ? `I've noted **${bookingContext.service}** on **${formatBookingDate(bookingContext.preferredDate)}** at **${bookingContext.preferredTime}**.`
      : "";
    const content = forBooking
      ? `${slotLine}\n\nTell us what's happening with the vehicle — symptoms, warning lights, noises, or anything you'd like the technician to know. Upload photos or videos in the panel if you have them.\n\nI'll ask a few focused questions, suggest possible causes, and share rough cost guidance (not a fixed quote). A mechanic can review your request and call you back.`
      : `${advisorIntro(false)}\n\nDescribe the symptom, warning light, noise, or what you'd like booked. I'll ask a few focused questions, suggest likely causes, and give rough cost guidance (not a fixed quote).`;
    return {
      content,
      intakeState: intake,
      leadDraft: draft,
      suggestionChips: WELCOME_CHIPS,
      typingLabel: ADVISOR_TYPING_LABELS.init,
      skipUserMessage: true,
    };
  }

  const reg = extractUkReg(msg);
  if (reg) draft.registration = reg;
  const phone = extractPhone(msg);
  if (phone) draft.phone = phone;
  const email = extractEmail(msg);
  if (email) draft.email = email;
  const model = extractVehicleModel(msg);
  if (model) draft.vehicleModel = model;

  // MOT commercial redirect — professional, not "cars only" bark
  if (
    intake.phase === "symptom_capture" &&
    /\b(van|commercial|class\s*4|lorry|truck|pickup)\b/i.test(msg) &&
    /\bmot\b/i.test(msg)
  ) {
    return {
      content: `${motPolicy.notEligible[0]} ${motPolicy.notEligible[1] ?? ""} We can still help with repairs, diagnostics, and preparation — tell me what the vehicle needs and I'll note it for the team.`,
      intakeState: { ...intake, phase: "symptom_capture" },
      leadDraft: draft,
      suggestionChips: [
        { id: "van-repair", label: "Book repair", message: "I need a repair booking instead" },
        { id: "van-callback", label: "Request callback", message: "Please call me back about repairs" },
      ],
      typingLabel: ADVISOR_TYPING_LABELS.mot,
    };
  }

  switch (intake.phase) {
    case "welcome":
    case "symptom_capture": {
      if (msg.length < 8 && !intake.symptomSummary) {
        return {
          content:
            "Tell me a little more — what's the car doing, and when did you first notice it? Even a short description helps our technicians.",
          intakeState: intake,
          leadDraft: draft,
          suggestionChips: WELCOME_CHIPS,
          typingLabel: ADVISOR_TYPING_LABELS.symptoms,
        };
      }
      appendSymptom(intake, msg);
      if (!draft.problemDescription) draft.problemDescription = intake.symptomSummary;
      const category = detectCategory(intake.symptomSummary + " " + msg);
      applyCategory(intake, category);
      intake.phase = "clarify";
      intake.clarifyAsked = true;
      const profile = PROFILES[category];
      return {
        content: profile.clarifyQuestion,
        intakeState: intake,
        leadDraft: draft,
        suggestionChips: profile.clarifyChips,
        typingLabel: ADVISOR_TYPING_LABELS.symptoms,
      };
    }

    case "clarify": {
      appendSymptom(intake, msg);
      intake.clarificationNotes.push(msg.slice(0, 120));
      draft.problemDescription = intake.symptomSummary;
      intake.phase = forBooking ? "collect_urgency" : "callback_offer";
      const content = adviseMessage(intake, forBooking);
      return {
        content,
        intakeState: intake,
        leadDraft: draft,
        suggestionChips: forBooking ? URGENCY_CHIPS : CALLBACK_CHIPS,
        typingLabel: ADVISOR_TYPING_LABELS.estimate,
      };
    }

    case "collect_urgency": {
      draft.urgency = msg.slice(0, 80);
      intake.phase = "callback_offer";
      return {
        content:
          "Thank you. Shall I pass this to our technicians with your booking slot? They'll call you back to confirm details and discuss next steps.",
        intakeState: intake,
        leadDraft: draft,
        suggestionChips: [
          { id: "cb-yes", label: "Yes — pass to workshop", message: "Yes, please pass this to the workshop team" },
          { id: "cb-guidance", label: "Guidance only", message: "I only needed guidance for now" },
        ],
        typingLabel: ADVISOR_TYPING_LABELS.logging,
      };
    }

    case "advise":
    case "callback_offer": {
      if (isNegative(msg) && !isAffirmative(msg)) {
        intake.callbackRequested = false;
        intake.phase = "complete";
        return {
          content:
            "No problem — keep the guidance in mind, and reach out when you're ready. You can reopen this chat anytime or message us on WhatsApp.",
          intakeState: intake,
          leadDraft: draft,
          suggestionChips: WELCOME_CHIPS,
          typingLabel: "Saving your notes…",
          mechanicSummary: buildMechanicSummary(intake, draft),
        };
      }
      if (/\bwhatsapp\b/i.test(msg)) {
        return {
          content: `You can message the workshop on WhatsApp — we'll pick up from there. Our number is ${businessConfig.phone.display}.`,
          intakeState: { ...intake, phase: "complete" },
          leadDraft: draft,
          mechanicSummary: buildMechanicSummary(intake, draft),
        };
      }
      intake.callbackRequested = true;
      intake.phase = "collect_name";
      return {
        content: forBooking
          ? "Good — I'll attach this to your booking request. What's your first name?"
          : "Good — I'll pass this to our technicians. What's your first name?",
        intakeState: intake,
        leadDraft: draft,
        typingLabel: ADVISOR_TYPING_LABELS.logging,
      };
    }

    case "collect_name": {
      const name = extractName(msg);
      if (!name) {
        return {
          content: "Please share the name we should use when we call you back.",
          intakeState: intake,
          leadDraft: draft,
        };
      }
      draft.name = name;
      intake.phase = "collect_phone";
      return {
        content: `Thanks, ${name}. What's the best mobile number to reach you on?`,
        intakeState: intake,
        leadDraft: draft,
        typingLabel: ADVISOR_TYPING_LABELS.logging,
      };
    }

    case "collect_phone": {
      if (!draft.phone) {
        return {
          content: `Please share a mobile number — we'll call from ${businessConfig.phone.display}.`,
          intakeState: intake,
          leadDraft: draft,
        };
      }
      intake.phase = "collect_reg";
      return {
        content: "What's your vehicle registration? (e.g. WP56 YAD)",
        intakeState: intake,
        leadDraft: draft,
      };
    }

    case "collect_reg": {
      if (!draft.registration) {
        return {
          content: "I need the registration plate to match your vehicle in our system.",
          intakeState: intake,
          leadDraft: draft,
        };
      }
      if (!draft.vehicleModel) {
        intake.phase = "collect_vehicle";
        return {
          content:
            "Optional but helpful — what's the make and model? (e.g. BMW 320d)",
          intakeState: intake,
          leadDraft: draft,
          suggestionChips: [
            { id: "veh-skip", label: "Skip", message: "Skip — registration is enough" },
          ],
        };
      }
      intake.phase = "collect_callback_window";
      return {
        content: "When is the best time for a callback? (e.g. 14:00–17:00, morning, or flexible)",
        intakeState: intake,
        leadDraft: draft,
        suggestionChips: [
          { id: "win-morn", label: "Morning", message: "Morning 8:00–12:00" },
          { id: "win-aft", label: "Afternoon", message: "Afternoon 14:00–17:00" },
          { id: "win-flex", label: "Flexible", message: "Flexible — any time" },
        ],
      };
    }

    case "collect_vehicle": {
      if (!/skip/i.test(msg)) {
        const veh = extractVehicleModel(msg) ?? msg.trim().slice(0, 48);
        if (veh) draft.vehicleModel = veh;
      }
      intake.phase = "collect_callback_window";
      return {
        content: "When is the best time for a callback? (e.g. 14:00–17:00, morning, or flexible)",
        intakeState: intake,
        leadDraft: draft,
        suggestionChips: [
          { id: "win-morn", label: "Morning", message: "Morning 8:00–12:00" },
          { id: "win-aft", label: "Afternoon", message: "Afternoon 14:00–17:00" },
          { id: "win-flex", label: "Flexible", message: "Flexible — any time" },
        ],
      };
    }

    case "collect_callback_window": {
      const window = extractCallbackWindow(msg);
      if (window) draft.callbackWindow = window;
      intake.phase = "complete";
      intake.leadCaptured = true;
      const summary = buildMechanicSummary(intake, draft);
      const causes = summary.possibleCauses.join(", ");
      const doneIntro = forBooking
        ? `Thank you${draft.name ? `, ${draft.name}` : ""}. Your booking intake is ready — tap **Send request to workshop** when you're happy, or add more detail below.`
        : `Thank you${draft.name ? `, ${draft.name}` : ""}. I've prepared a summary for our technicians — they'll review your case and call ${draft.phone ?? "you"}${draft.callbackWindow ? ` around ${draft.callbackWindow}` : ""}.`;

      return {
        content:
          `${doneIntro}\n\n` +
          `**Workshop handoff (draft):**\n` +
          `• Vehicle: ${summary.vehicle ?? "—"}${summary.registration ? ` · ${summary.registration}` : ""}\n` +
          `• Symptoms: ${summary.symptoms}\n` +
          `• Possible causes: ${causes}\n` +
          `• Guidance range: ${summary.estimatedRange} (indicative only)\n` +
          `• Callback: Yes${summary.callbackWindow ? ` · ${summary.callbackWindow}` : ""}\n\n` +
          `This isn't a diagnosis or fixed quote — our technician will confirm after inspection.`,
        intakeState: intake,
        leadDraft: draft,
        mechanicSummary: summary,
        shouldCaptureLead: !forBooking,
        intakeComplete: true,
        typingLabel: ADVISOR_TYPING_LABELS.summary,
      };
    }

    case "complete": {
      appendSymptom(intake, msg);
      const category = detectCategory(msg);
      applyCategory(intake, category);
      intake.phase = "clarify";
      intake.clarifyAsked = true;
      const profile = PROFILES[category];
      return {
        content: `Happy to look at another concern. ${profile.clarifyQuestion}`,
        intakeState: intake,
        leadDraft: draft,
        suggestionChips: profile.clarifyChips,
        typingLabel: "Reviewing your notes…",
      };
    }

    default:
      return {
        content: adviseMessage(intake, forBooking),
        intakeState: intake,
        leadDraft: draft,
        suggestionChips: CALLBACK_CHIPS,
      };
  }
}

export function createInitialIntakeState(): IntakeState {
  return defaultIntakeState();
}
