import { extractEngineDisplacement } from "@/lib/vehicle-engine-display";

const LITRE_TOKEN = /\d+\.\d+\s*L(?:\s+(?:Diesel|Petrol|Hybrid|Electric))?/gi;
const PLACEHOLDER = /__ENG(\d+)__/g;

const INVALID_ZERO_LITRE =
  /(?<!\d\.)0\.?0?L(?:\s+(?:Diesel|Petrol|Hybrid|Electric))?\b/gi;

/** Mask decimal-litre tokens so sentence splitters do not treat "." as end-of-sentence. */
export function protectEngineLitres(text: string): {
  text: string;
  restore: (s: string) => string;
} {
  const tokens: string[] = [];
  const protectedText = text.replace(LITRE_TOKEN, (match) => {
    tokens.push(match);
    return `__ENG${tokens.length - 1}__`;
  });

  return {
    text: protectedText,
    restore: (value) =>
      value.replace(PLACEHOLDER, (_, index) => tokens[Number(index)] ?? ""),
  };
}

/** Split on sentence boundaries without breaking engine sizes like 2.0L. */
export function splitIntoSentences(text: string): string[] {
  const { text: protectedText, restore } = protectEngineLitres(text);
  const sentences =
    protectedText.match(/[^.!?\n]+[.!?]+(?:\s|$)|[^.!?\n]+$/g) ?? [];

  return sentences.map((sentence) => restore(sentence.trim())).filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Common corrupted forms when DVLA says e.g. "1.4L Petrol" or "2.0L Diesel". */
export function buildCorruptEnginePhrases(canonicalEngine: string): string[] {
  const canonical = canonicalEngine.trim();
  const displacement = extractEngineDisplacement(canonical);
  if (!displacement) return [];

  const fuel = canonical.replace(displacement, "").trim();
  const phrases = new Set<string>();

  if (fuel) {
    phrases.add(`0L ${fuel}`);
    phrases.add(`0.0L ${fuel}`);
  }

  const parts = displacement.match(/^(\d+)\.(\d+)L$/i);
  if (parts && fuel) {
    const dec = parts[2];
    if (dec && dec !== "0") {
      phrases.add(`${dec}L ${fuel}`);
    }
  }

  return [...phrases].sort((a, b) => b.length - a.length);
}

/** Remove invented / corrupted zero-litre references — omit, never display. */
export function stripInvalidEngineReferences(text: string): string {
  let result = text.replace(INVALID_ZERO_LITRE, "");

  result = result
    .replace(/\bfor your\s*,/gi, "For your vehicle,")
    .replace(/\bfor your\s+\./gi, "For your vehicle.")
    .replace(/\bfor your\s+—/gi, "For your vehicle —")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();

  return result;
}

/**
 * Repair or omit engine displacement in customer-visible copy.
 * Valid litre tokens are protected first so "2.0L" is never corrupted by "0L" fixes.
 */
export function sanitizeEngineReferencesInText(
  text: string,
  canonicalEngine?: string
): string {
  if (!text.trim()) return text;

  const protectedEngines: string[] = [];
  let result = text.replace(LITRE_TOKEN, (match) => {
    protectedEngines.push(match);
    return `__ENG${protectedEngines.length - 1}__`;
  });

  const canonical = canonicalEngine?.trim();
  if (canonical) {
    for (const corrupt of buildCorruptEnginePhrases(canonical)) {
      const pattern = new RegExp(`\\b${escapeRegex(corrupt)}\\b`, "gi");
      result = result.replace(pattern, canonical);
    }

    const displacement = extractEngineDisplacement(canonical);
    const fuel = displacement ? canonical.replace(displacement, "").trim() : "";
    if (displacement && fuel) {
      const truncated = displacement.match(/^(\d+)\.(\d+)L$/i);
      if (truncated) {
        const shortForm = `${truncated[2]}L ${fuel}`;
        if (shortForm.toLowerCase() !== canonical.toLowerCase()) {
          const shortPattern = new RegExp(`\\b${escapeRegex(shortForm)}\\b`, "gi");
          result = result.replace(shortPattern, canonical);
        }
      }
    }
  }

  result = stripInvalidEngineReferences(result);

  result = result.replace(PLACEHOLDER, (_, index) => {
    return protectedEngines[Number(index)] ?? "";
  });

  return result;
}

/** @deprecated Use sanitizeEngineReferencesInText */
export function applyCanonicalEngineReference(
  text: string,
  canonicalEngine?: string
): string {
  return sanitizeEngineReferencesInText(text, canonicalEngine);
}
