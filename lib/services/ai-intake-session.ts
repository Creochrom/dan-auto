import { chatRepository } from "@/lib/repositories/chat.repository";
import type { AiIntakeSessionSnapshot } from "@/lib/types/ai-intake";
import type { ChatSession } from "@/lib/types/chat";

/**
 * Resolve chat session from server memory (or DB), or rebuild from client
 * snapshot (required on Vercel — chat is still in-memory per instance when
 * STORAGE_BACKEND=mock).
 */
export async function resolveAiIntakeSession(
  sessionId: string,
  snapshot?: AiIntakeSessionSnapshot
): Promise<ChatSession | null> {
  const stored = await chatRepository.findById(sessionId);
  if (stored) return stored;

  if (!snapshot?.messages?.length) return null;

  const now = new Date().toISOString();
  return {
    id: sessionId,
    messages: snapshot.messages.slice(0, 80),
    leadDraft: snapshot.leadDraft,
    mechanicSummary: snapshot.mechanicSummary,
    advisorRoute: snapshot.advisorRoute,
    bookingContext: snapshot.bookingContext,
    createdAt: now,
    updatedAt: now,
  };
}
