import type { AdvisorMessageSegment } from "@/lib/chat/message-highlight";

export type AssistantRenderBlock =
  | { kind: "text"; text: string }
  | {
      kind: "segment";
      type: Exclude<AdvisorMessageSegment["type"], "text">;
      text: string;
    };

/** Group parsed lines into separate UI blocks (one bubble each). */
export function groupAssistantBlocks(
  segments: AdvisorMessageSegment[]
): AssistantRenderBlock[] {
  const blocks: AssistantRenderBlock[] = [];
  let textAcc = "";

  const flushText = () => {
    const trimmed = textAcc.trim();
    if (trimmed) {
      blocks.push({ kind: "text", text: trimmed });
    }
    textAcc = "";
  };

  for (const seg of segments) {
    if (seg.type === "text") {
      if (!seg.text.trim()) continue;
      textAcc = textAcc ? `${textAcc}\n${seg.text.trim()}` : seg.text.trim();
      continue;
    }
    flushText();
    blocks.push({ kind: "segment", type: seg.type, text: seg.text });
  }

  flushText();
  return blocks;
}

export const SEGMENT_LABEL: Record<
  Exclude<AdvisorMessageSegment["type"], "text">,
  string
> = {
  info: "Info",
  main_question: "Question",
  warning: "Important",
  estimate: "Estimate",
  next_step: "Next step",
};
