import type { ChatMessage } from "@/lib/types/chat";
import type { LeadDraft } from "@/lib/types/chat";
import type { IntakeIntent } from "@/lib/types/ai-intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";
import { looksLikePhoneInput, parseUkPhone } from "@/lib/validation/uk-phone";
import { validateCustomerPhone } from "@/lib/validation/advisor-contact";

const DAY_TOKEN =
  /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|asap|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?)/i;

const TIME_TOKEN =
  /\b(morning|afternoon|evening|night|\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|before\s+\d|after\s+\d|any\s?time|flexible|asap|12pm|12 pm|3pm|3 pm)/i;

const AT_TIME =
  /\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))/i;

/** Returns true when the user message is primarily sharing contact details. */
function isContactHandoffMessage(text: string): boolean {
  if (looksLikePhoneInput(text)) return true;
  const phoneMatch = text.match(/(?:\+?44|0)7[\d\s().-]{8,14}/);
  if (phoneMatch && parseUkPhone(phoneMatch[0]).valid) {
    if (/^(?:call me|my number|phone|mobile|reach me)/i.test(text.trim())) return true;
    if (text.replace(/\D/g, "").length >= 10 && text.length <= 48) return true;
  }
  return false;
}

const SKIP_USER_LINE =
  /^(yes|yeah|yep|no|nope|ok|okay|sure|send|please|thanks|thank you|any time|asap|morning|afternoon|evening|flexible|book it)$/i;

const DIAGNOSTIC_QUESTION =
  /\b(what (?:further|more) details|when do you hear|describe the (?:noise|symptom|problem)|tell me more about|how long has|does it happen when|any warning lights on the dashboard|what else can you tell|can you (?:tell|describe)|when did (?:it|this) start|how often|is it (?:getting|becoming) worse)\b/i;

/** True when assistant is still probing symptoms after callback intake is ready. */
export function isCallbackDiagnosticContent(content: string): boolean {
  if (!content.trim()) return false;
  if (DIAGNOSTIC_QUESTION.test(content)) return true;
  if (/\?\s*$/.test(content.trim()) && /\b(brake|noise|symptom|problem|issue|concern|vehicle|mileage|warning light)\b/i.test(content)) {
    return true;
  }
  return false;
}

export type CallbackSlotFields = {
  preferredDate: string;
  preferredTime: string;
};

/** Split combined callback timing like "today at 12pm" into date + time parts. */
export function resolveCallbackSlotFields(
  preferredBookingTime?: string,
  leadDraft: LeadDraft = {}
): CallbackSlotFields {
  const rawDate = leadDraft.preferredDate?.trim();
  const rawTime = leadDraft.callbackWindow?.trim();
  const slot = preferredBookingTime?.trim() ?? "";

  if (rawDate && rawTime && !/\bat\b/i.test(rawDate)) {
    return { preferredDate: rawDate, preferredTime: rawTime };
  }

  const combined = rawDate || rawTime || slot;
  if (!combined) {
    return { preferredDate: "ASAP", preferredTime: "Any time" };
  }

  const atSplit = combined.match(
    /^(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week)\s+(?:at\s+)?(.+)$/i
  );
  if (atSplit) {
    return {
      preferredDate: atSplit[1]!,
      preferredTime: atSplit[2]!.trim(),
    };
  }

  const dayMatch = combined.match(DAY_TOKEN);
  const timeMatch = combined.match(TIME_TOKEN);

  if (dayMatch && timeMatch && dayMatch[0] !== timeMatch[0]) {
    return {
      preferredDate: dayMatch[0].trim(),
      preferredTime: timeMatch[0].trim(),
    };
  }

  if (dayMatch && AT_TIME.test(combined)) {
    const timePart = combined.match(AT_TIME)?.[1]?.trim();
    if (timePart) {
      return { preferredDate: dayMatch[0]!.trim(), preferredTime: timePart };
    }
  }

  if (dayMatch) {
    return {
      preferredDate: dayMatch[0]!.trim(),
      preferredTime: rawTime || timeMatch?.[0]?.trim() || "Any time",
    };
  }

  if (/^(morning|afternoon|evening|any time|asap|flexible)$/i.test(combined)) {
    return { preferredDate: "ASAP", preferredTime: combined };
  }

  return { preferredDate: combined, preferredTime: rawTime || "Any time" };
}

/** Apply split callback slot fields onto lead draft after each turn. */
export function normalizeCallbackLeadDraft(
  leadDraft: LeadDraft,
  structuredIntake: StructuredIntake
): LeadDraft {
  const slot = resolveCallbackSlotFields(
    structuredIntake.preferredBookingTime,
    leadDraft
  );
  return {
    ...leadDraft,
    preferredDate: slot.preferredDate,
    callbackWindow: slot.preferredTime,
  };
}

/** Extract customer concern lines from chat when structured intake is empty. */
export function extractCustomerConcernFromTranscript(messages: ChatMessage[]): string {
  const lines: string[] = [];

  for (const message of messages) {
    if (message.role !== "user") continue;
    const text = (message.displayContent ?? message.content).trim();
    if (text.length < 6) continue;
    if (SKIP_USER_LINE.test(text)) continue;
    if (isContactHandoffMessage(text)) continue;
    if (/^UK phone confirmed/i.test(text)) continue;
    if (/^My name is /i.test(text)) continue;
    if (/I would like (a )?mechanic to call/i.test(text)) continue;
    lines.push(text);
  }

  return lines.slice(-4).join(" · ");
}

export type CallbackSummaryInput = {
  symptoms: string;
  estimatedRange?: string;
  aiSummary?: string;
  intent: IntakeIntent;
  urgency: UrgencyLevel;
  transcriptConcern?: string;
  possibleCauses?: string[];
  callbackReason?: string;
};

/** Workshop-facing callback summary — never empty. */
export function buildCallbackSummary(input: CallbackSummaryInput): string {
  const concern =
    input.symptoms && !/^not specified/i.test(input.symptoms)
      ? input.symptoms
      : input.transcriptConcern?.trim();

  const parts: string[] = [];

  if (concern) {
    parts.push(`Customer concern: ${concern}`);
  }

  if (input.estimatedRange?.trim()) {
    parts.push(`Estimate discussed: ${input.estimatedRange.trim()}`);
  }

  if (input.possibleCauses?.length) {
    parts.push(`Likely area: ${input.possibleCauses.slice(0, 3).join("; ")}`);
  }

  if (input.aiSummary?.trim() && !parts.some((p) => p.includes(input.aiSummary!.trim()))) {
    parts.push(input.aiSummary.trim());
  }

  if (input.callbackReason?.trim()) {
    parts.push(`Reason for callback: ${input.callbackReason.trim()}`);
  }

  parts.push(
    `Priority: ${input.urgency} — customer requested a mechanic callback (${input.intent === "callback" ? "callback flow" : "advisor handoff"})`
  );

  if (parts.length === 1 && concern) {
    return parts.join("\n");
  }

  if (parts.length <= 1) {
    const fallback = input.transcriptConcern?.trim() || concern;
    return fallback
      ? `Callback requested — ${fallback}`
      : "Callback requested — see customer concern in transcript.";
  }

  return parts.join("\n");
}

export function syncPhoneFromUserMessage(
  userMessage: string,
  leadDraft: LeadDraft,
  structuredIntake: StructuredIntake
): { leadDraft: LeadDraft; structuredIntake: StructuredIntake } {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return { leadDraft, structuredIntake };
  }

  const candidates = [
    trimmed,
    trimmed.match(/(?:\+?44|0)7[\d\s().-]{8,14}/)?.[0],
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (!looksLikePhoneInput(candidate) && !/(?:\+?44|0)7/.test(candidate)) {
      continue;
    }

    const parsed = parseUkPhone(candidate);
    if (!parsed.valid) continue;

    const phoneCheck = validateCustomerPhone(parsed.national);
    if (!phoneCheck.valid) continue;

    return {
      leadDraft: { ...leadDraft, phone: phoneCheck.normalized },
      structuredIntake: {
        ...structuredIntake,
        customer: {
          ...structuredIntake.customer,
          contact: phoneCheck.normalized,
        },
      },
    };
  }

  return { leadDraft, structuredIntake };
}

export function isDiagnosticCallbackQuestion(content: string): boolean {
  return isCallbackDiagnosticContent(content);
}

export function callbackConfirmationContent(name?: string): string {
  const greeting = name?.trim() ? `Thanks, ${name.trim().split(/\s+/)[0]}.` : "Thanks.";
  return `${greeting} I've got your details. Please check the summary below and tap Send request when you're ready — the workshop will call you back.`;
}

export function callbackTimingPromptContent(): string {
  return "When would you like the mechanic to call — morning, afternoon, or ASAP?";
}
