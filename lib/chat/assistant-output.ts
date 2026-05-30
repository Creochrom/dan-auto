import {
  prepareCustomerFacingTurn,
  splitAdvisorTurnIntoBubbles,
} from "@/lib/chat/customer-facing";
import { sanitizeEngineReferencesInText } from "@/lib/chat/litre-guard";
import { capPricingBubbles, stripPricingFiller } from "@/lib/chat/pricing-output";
import { splitAssistantContent } from "@/lib/chat/reveal";

export type FinalizeAssistantOptions = {
  canonicalEngine?: string;
  pricingMode?: boolean;
};

/** Server-side final pass before content is stored or sent to the client. */
export function finalizeAssistantContent(
  content: string,
  opts: FinalizeAssistantOptions = {}
): string {
  let text = content.trim();
  if (opts.pricingMode) {
    text = stripPricingFiller(text);
    text = capPricingBubbles(text);
  }
  text = sanitizeEngineReferencesInText(text, opts.canonicalEngine);
  text = prepareCustomerFacingTurn(text);
  return text;
}

/** Client-side render path — same rules as server, applied per bubble. */
export function finalizeAssistantChunks(
  content: string,
  opts: FinalizeAssistantOptions = {}
): string[] {
  const sanitized = finalizeAssistantContent(content, opts);
  const parts = sanitized.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (opts.pricingMode && parts.length >= 2) {
    return parts.map((part) =>
      finalizeAssistantContent(part, { ...opts, pricingMode: false })
    );
  }
  return splitAssistantContent(sanitized, {
    canonicalEngine: opts.canonicalEngine,
  });
}

/** Raw Gemini → sanitized → rendered chunks (for tests). */
export function sanitizeAssistantPipeline(
  rawGemini: string,
  opts: FinalizeAssistantOptions = {}
): { sanitized: string; rendered: string[] } {
  const sanitized = finalizeAssistantContent(rawGemini, opts);
  const rendered = finalizeAssistantChunks(rawGemini, opts);
  return { sanitized, rendered };
}

/** Resolve canonical engine string from route + intake (first non-empty wins). */
export function resolveCanonicalEngine(opts: {
  routeEngine?: string;
  intakeEngine?: string;
  metaEngine?: string;
}): string | undefined {
  for (const candidate of [opts.routeEngine, opts.intakeEngine, opts.metaEngine]) {
    const trimmed = candidate?.trim();
    if (trimmed && !/^0\.?0?L\b/i.test(trimmed)) return trimmed;
  }
  return undefined;
}

export { sanitizeEngineReferencesInText } from "@/lib/chat/litre-guard";
