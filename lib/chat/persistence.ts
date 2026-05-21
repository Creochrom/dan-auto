import type { ChatMessage, ChatTranscript } from "@/lib/types/chat";

const TRANSCRIPT_PREFIX = "dana-chat-transcript:";

export function saveChatTranscript(sessionId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  const payload: ChatTranscript = {
    sessionId,
    messages,
    updatedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(`${TRANSCRIPT_PREFIX}${sessionId}`, JSON.stringify(payload));
  } catch {
    /* quota — ignore */
  }
}

export function loadChatTranscript(sessionId: string): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${TRANSCRIPT_PREFIX}${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatTranscript;
    if (parsed.sessionId !== sessionId || !Array.isArray(parsed.messages)) return null;
    return parsed.messages;
  } catch {
    return null;
  }
}

export function clearChatTranscript(sessionId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${TRANSCRIPT_PREFIX}${sessionId}`);
}
