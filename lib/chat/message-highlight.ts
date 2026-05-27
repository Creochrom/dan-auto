export type AdvisorMessageSegment =
  | { type: "text"; text: string }
  | { type: "info"; text: string }
  | { type: "main_question"; text: string }
  | { type: "warning"; text: string }
  | { type: "estimate"; text: string }
  | { type: "next_step"; text: string };

const PREFIXES: { prefix: string; type: AdvisorMessageSegment["type"] }[] = [
  { prefix: "INFO:", type: "info" },
  { prefix: "MAIN QUESTION:", type: "main_question" },
  { prefix: "QUESTION:", type: "main_question" },
  { prefix: "WARNING:", type: "warning" },
  { prefix: "ESTIMATE:", type: "estimate" },
  { prefix: "NEXT STEP:", type: "next_step" },
];

function parseLine(line: string): AdvisorMessageSegment[] {
  const trimmed = line.trim();
  if (!trimmed) return [{ type: "text", text: "" }];

  for (const { prefix, type } of PREFIXES) {
    if (trimmed.toUpperCase().startsWith(prefix)) {
      const text = trimmed.slice(prefix.length).trim();
      if (!text) return [];
      return [{ type, text }];
    }
  }

  return [{ type: "text", text: trimmed }];
}

/** Split assistant copy into plain and semantically tagged blocks for UI styling. */
export function parseAdvisorMessageContent(content: string): AdvisorMessageSegment[] {
  const lines = content.split("\n");
  const segments: AdvisorMessageSegment[] = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    for (const seg of parsed) {
      if (seg.type === "text" && seg.text === "") {
        if (segments.length > 0) segments.push(seg);
        continue;
      }
      segments.push(seg);
    }
  }

  return segments.length ? segments : [{ type: "text", text: content }];
}
