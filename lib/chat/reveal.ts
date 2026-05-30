/** Split long assistant replies into natural paragraphs for progressive reveal */
import {
  prepareCustomerFacingTurn,
  splitAdvisorTurnIntoBubbles,
} from "@/lib/chat/customer-facing";
import { sanitizeEngineReferencesInText, splitIntoSentences } from "@/lib/chat/litre-guard";

export type SplitAssistantOptions = {
  canonicalEngine?: string;
};

function polishChunk(text: string, canonicalEngine?: string): string {
  return prepareCustomerFacingTurn(
    sanitizeEngineReferencesInText(text, canonicalEngine)
  );
}

export function splitAssistantContent(
  content: string,
  opts?: SplitAssistantOptions
): string[] {
  const canonicalEngine = opts?.canonicalEngine;

  const semantic = splitAdvisorTurnIntoBubbles(content);
  if (semantic.length > 1) {
    return semantic.map((chunk) => polishChunk(chunk, canonicalEngine));
  }

  const trimmed = semantic[0]?.trim() ?? content.trim();
  if (!trimmed) return [""];

  const paragraphs = trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    const merged =
      paragraphs.length > 4
        ? [
            paragraphs.slice(0, 2).join("\n\n"),
            paragraphs.slice(2).join("\n\n"),
          ]
        : paragraphs;
    return merged.map((chunk) => polishChunk(chunk, canonicalEngine));
  }

  if (trimmed.length < 220) {
    return [polishChunk(trimmed, canonicalEngine)];
  }

  const sentences = splitIntoSentences(trimmed);
  if (sentences.length >= 3) {
    const mid = Math.ceil(sentences.length / 2);
    const first = sentences.slice(0, mid).join(" ").trim();
    const second = sentences.slice(mid).join(" ").trim();
    if (first.length >= 40 && second.length >= 40) {
      return [
        polishChunk(first, canonicalEngine),
        polishChunk(second, canonicalEngine),
      ];
    }
  }

  return [polishChunk(trimmed, canonicalEngine)];
}

export const REVEAL_FIRST_MS = 420;
export const REVEAL_BETWEEN_MS = 680;
