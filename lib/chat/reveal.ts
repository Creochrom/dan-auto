/** Split long assistant replies into natural paragraphs for progressive reveal */
export function splitAssistantContent(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [""];

  const paragraphs = trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    return paragraphs.length > 4
      ? [
          paragraphs.slice(0, 2).join("\n\n"),
          paragraphs.slice(2).join("\n\n"),
        ]
      : paragraphs;
  }

  if (trimmed.length < 220) return [trimmed];

  const sentences = trimmed.match(/[^.!?\n]+[.!?]+(?:\s|$)|[^.!?\n]+$/g);
  if (sentences && sentences.length >= 3) {
    const mid = Math.ceil(sentences.length / 2);
    const first = sentences.slice(0, mid).join(" ").trim();
    const second = sentences.slice(mid).join(" ").trim();
    if (first.length >= 40 && second.length >= 40) return [first, second];
  }

  return [trimmed];
}

export const REVEAL_FIRST_MS = 420;
export const REVEAL_BETWEEN_MS = 680;
