import type { StructuredIntake } from "@/lib/types/structured-intake";

export type GeminiTurnPayload = {
  assistantMessage: string;
  suggestionChips?: unknown;
  quickReplies?: unknown;
  structuredIntake?: Partial<StructuredIntake>;
  intakeComplete?: boolean;
  typingLabel?: string;
};

export type GeminiParseSuccess = {
  ok: true;
  payload: GeminiTurnPayload;
  strategy: string;
};

export type GeminiParseFailure = {
  ok: false;
  error: string;
  partial?: Partial<GeminiTurnPayload>;
};

export type GeminiParseResult = GeminiParseSuccess | GeminiParseFailure;

const LOG_TAG = "[gemini-json]";

function truncateForLog(value: string, max = 8000): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}… [truncated ${value.length - max} chars]`;
}

function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function countUnescapedQuotes(input: string): number {
  let count = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "\\") {
      i++;
      continue;
    }
    if (input[i] === '"') count++;
  }
  return count;
}

/** Insert missing commas between adjacent JSON properties (common Gemini slip). */
function fixMissingCommasBetweenProperties(json: string): string {
  return json
    .replace(/"\s*\n\s*"/g, '",\n"')
    .replace(/"\s+"(?=[\w"])/g, '", "')
    .replace(/(\})\s*"/g, '$1, "')
    .replace(/(\])\s*"/g, '$1, "')
    .replace(/,\s*,/g, ",");
}

function extractBalancedObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < raw.length; i++) {
    const c = raw[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }

  return raw.slice(start);
}

function closeTruncatedJson(json: string): string {
  let repaired = json.trim();

  if (countUnescapedQuotes(repaired) % 2 === 1) {
    repaired += '"';
  }

  const openBrackets =
    (repaired.match(/\[/g)?.length ?? 0) - (repaired.match(/\]/g)?.length ?? 0);
  const openBraces =
    (repaired.match(/\{/g)?.length ?? 0) - (repaired.match(/\}/g)?.length ?? 0);

  for (let i = 0; i < openBrackets; i++) repaired += "]";
  for (let i = 0; i < openBraces; i++) repaired += "}";

  return fixMissingCommasBetweenProperties(repaired);
}

function unescapeJsonStringFragment(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

/** Pull assistantMessage even when the surrounding JSON object is truncated. */
export function extractAssistantMessageField(raw: string): string | null {
  const match = raw.match(/"assistantMessage"\s*:\s*"((?:\\.|[^"\\])*)(?:"|$)/);
  if (match?.[1]) {
    const text = unescapeJsonStringFragment(match[1]).trim();
    if (text.length >= 1) return text;
  }

  const keyIdx = raw.search(/"assistantMessage"\s*:/);
  if (keyIdx === -1) return null;

  const openQuote = raw.indexOf('"', raw.indexOf(":", keyIdx) + 1);
  if (openQuote === -1) return null;

  let i = openQuote + 1;
  let out = "";
  while (i < raw.length) {
    const c = raw[i]!;
    if (c === "\\" && i + 1 < raw.length) {
      out += raw[i]! + raw[i + 1]!;
      i += 2;
      continue;
    }
    if (c === '"') break;
    out += c;
    i++;
  }

  if (!out.trim() && i >= raw.length) {
    out = raw.slice(openQuote + 1).trim();
  }

  const cleaned = unescapeJsonStringFragment(out).trim();
  return cleaned.length >= 1 ? cleaned : null;
}

function extractPartialPayload(raw: string): Partial<GeminiTurnPayload> | undefined {
  const assistantMessage = extractAssistantMessageField(raw) ?? undefined;
  const intakeComplete = /"intakeComplete"\s*:\s*true/.test(raw);
  if (!assistantMessage && !intakeComplete) return undefined;
  return { assistantMessage, intakeComplete };
}

function validatePayload(parsed: unknown): GeminiTurnPayload | null {
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  const assistantMessage =
    typeof record.assistantMessage === "string" ? record.assistantMessage.trim() : "";
  if (!assistantMessage) return null;

  return {
    assistantMessage,
    suggestionChips: record.suggestionChips,
    quickReplies: record.quickReplies,
    structuredIntake: record.structuredIntake as Partial<StructuredIntake> | undefined,
    intakeComplete:
      typeof record.intakeComplete === "boolean" ? record.intakeComplete : undefined,
    typingLabel: typeof record.typingLabel === "string" ? record.typingLabel : undefined,
  };
}

function tryParse(jsonStr: string): GeminiTurnPayload | null {
  try {
    return validatePayload(JSON.parse(jsonStr));
  } catch {
    return null;
  }
}

type ParseStrategy = {
  name: string;
  transform: (raw: string) => string | null;
};

const PARSE_STRATEGIES: ParseStrategy[] = [
  { name: "direct", transform: (raw) => stripMarkdownFences(raw) },
  {
    name: "extract-balanced-object",
    transform: (raw) => extractBalancedObject(stripMarkdownFences(raw)),
  },
  {
    name: "fix-missing-commas",
    transform: (raw) => {
      const base = extractBalancedObject(stripMarkdownFences(raw)) ?? stripMarkdownFences(raw);
      return fixMissingCommasBetweenProperties(base);
    },
  },
  {
    name: "close-truncated",
    transform: (raw) => {
      const base = extractBalancedObject(stripMarkdownFences(raw)) ?? stripMarkdownFences(raw);
      return closeTruncatedJson(base);
    },
  },
  {
    name: "fix-commas-and-close",
    transform: (raw) => {
      const base = extractBalancedObject(stripMarkdownFences(raw)) ?? stripMarkdownFences(raw);
      return closeTruncatedJson(fixMissingCommasBetweenProperties(base));
    },
  },
];

/**
 * Parse Gemini JSON output with recovery strategies and structured diagnostics.
 */
export function parseGeminiResponse(raw: string): GeminiParseResult {
  console.info(`${LOG_TAG} RAW GEMINI RESPONSE`, {
    byteLength: raw.length,
    preview: truncateForLog(raw),
  });

  let lastError = "Unknown parse error";

  for (const strategy of PARSE_STRATEGIES) {
    const candidate = strategy.transform(raw);
    if (!candidate) continue;

    try {
      const payload = tryParse(candidate);
      if (payload) {
        console.info(`${LOG_TAG} PARSED RESPONSE`, {
          strategy: strategy.name,
          assistantMessageLength: payload.assistantMessage.length,
          intakeComplete: payload.intakeComplete ?? false,
          hasStructuredIntake: Boolean(payload.structuredIntake),
          chipCount: Array.isArray(payload.suggestionChips)
            ? payload.suggestionChips.length
            : Array.isArray(payload.quickReplies)
              ? payload.quickReplies.length
              : 0,
        });
        return { ok: true, payload, strategy: strategy.name };
      }
      lastError = `${strategy.name}: payload missing assistantMessage`;
    } catch (err) {
      lastError =
        err instanceof Error ? `${strategy.name}: ${err.message}` : `${strategy.name}: parse failed`;
    }
  }

  const partialMessage = extractAssistantMessageField(raw);
  if (partialMessage) {
    const partial: GeminiTurnPayload = {
      assistantMessage: partialMessage,
      intakeComplete: /"intakeComplete"\s*:\s*true/.test(raw),
    };
    console.warn(`${LOG_TAG} PARSED RESPONSE`, {
      strategy: "regex-assistantMessage-fallback",
      assistantMessageLength: partialMessage.length,
      intakeComplete: partial.intakeComplete ?? false,
    });
    return { ok: true, payload: partial, strategy: "regex-assistantMessage-fallback" };
  }

  const partial = extractPartialPayload(raw);
  console.error(`${LOG_TAG} PARSE ERROR`, {
    error: lastError,
    preview: truncateForLog(raw),
    partial,
  });

  return {
    ok: false,
    error: lastError,
    partial,
  };
}

/** @deprecated Use parseGeminiResponse — kept for internal re-exports/tests. */
export function parseGeminiJson(raw: string): GeminiTurnPayload {
  const result = parseGeminiResponse(raw);
  if (result.ok) return result.payload;
  throw new Error(result.error);
}
