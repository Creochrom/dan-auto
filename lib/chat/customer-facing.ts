import { parseAdvisorMessageContent } from "@/lib/chat/message-highlight";

const SEMANTIC_PREFIX =
  /^(?:INFO|MAIN QUESTION|QUESTION|WARNING|ESTIMATE|NEXT STEP)\s*:\s*/i;

/** Remove internal semantic prefixes from a single line. */
export function stripSemanticPrefix(line: string): string {
  return line.replace(SEMANTIC_PREFIX, "").trim();
}

/** Strip semantic labels from all lines in customer-visible assistant copy. */
export function stripAdvisorSemanticLabels(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    if (SEMANTIC_PREFIX.test(trimmed)) {
      out.push(stripSemanticPrefix(trimmed));
    } else {
      out.push(trimmed);
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Split a turn into separate chat bubbles:
 * - context (info, warning, plain text) grouped together
 * - estimate on its own bubble when present
 * - follow-up question on its own bubble
 * - next-step guidance on its own bubble
 */
export function splitAdvisorTurnIntoBubbles(content: string): string[] {
  const segments = parseAdvisorMessageContent(content.trim());
  const bubbles: string[] = [];
  let contextParts: string[] = [];

  const flushContext = () => {
    const joined = contextParts.join("\n\n").trim();
    if (joined) bubbles.push(joined);
    contextParts = [];
  };

  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;

    switch (seg.type) {
      case "main_question":
        flushContext();
        bubbles.push(text);
        break;
      case "estimate":
        flushContext();
        bubbles.push(text);
        break;
      case "next_step":
        flushContext();
        bubbles.push(text);
        break;
      default:
        contextParts.push(text);
        break;
    }
  }

  flushContext();

  if (bubbles.length === 0) {
    const stripped = stripAdvisorSemanticLabels(content);
    return stripped ? [stripped] : [""];
  }

  return bubbles;
}

/** Final pass on assistant copy before it reaches the client. */
export function prepareCustomerFacingTurn(content: string): string {
  return stripAdvisorSemanticLabels(content.trim());
}
