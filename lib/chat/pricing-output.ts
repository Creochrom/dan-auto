import {
  splitAdvisorTurnIntoBubbles,
  stripAdvisorSemanticLabels,
} from "@/lib/chat/customer-facing";

const PRICING_FILLER = [
  /\bdepends on the specific component\b/gi,
  /\blocal pricing varies\b/gi,
  /\bSouthampton independent garage rates?\b/gi,
  /\bSouthampton garage rates?\b/gi,
  /\binspection is required\b/gi,
  /\binspection is needed\b/gi,
  /\bindicative pricing\b/gi,
  /\bconfirmed quote requires inspection\b/gi,
  /\bpricing is approximate\b/gi,
  /\bbased on similar repairs\b/gi,
  /\bvarious causes\b/gi,
  /\bpricing depends\b/gi,
];

/** Remove generic AI filler from pricing replies. */
export function stripPricingFiller(text: string): string {
  let result = stripAdvisorSemanticLabels(text);
  for (const pattern of PRICING_FILLER) {
    result = result.replace(pattern, "");
  }
  return result
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*[,.]\s*/gm, "")
    .trim();
}

/**
 * Cap pricing output to at most one estimate block + one follow-up question.
 * Uses blank-line separation so the client can split into two bubbles.
 */
export function capPricingBubbles(content: string): string {
  const stripped = stripPricingFiller(content);
  const parts = stripped.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const estimate = parts.find((p) => /£/.test(p)) ?? parts[0]!;
    const question =
      parts.find((p) => p.includes("?") && p !== estimate) ?? parts[1] ?? "";
    if (question) return `${estimate}\n\n${question}`;
  }

  const bubbles = splitAdvisorTurnIntoBubbles(stripped);
  if (bubbles.length <= 2) {
    return bubbles.join("\n\n").trim();
  }

  const estimate = bubbles.find((b) => /£/.test(b)) ?? bubbles[0]!;
  const question =
    bubbles.find((b) => b.includes("?") && b !== estimate) ??
    bubbles.find((b) => b !== estimate) ??
    "";

  if (question) {
    return `${estimate.trim()}\n\n${question.trim()}`;
  }
  return estimate.trim();
}
