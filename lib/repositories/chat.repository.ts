import { mockStore } from "@/lib/repositories/mock-store";
import type { BookingChatContext, ChatMessage, ChatSession } from "@/lib/types/chat";
import type { IntakeState, MechanicIntakeSummary } from "@/lib/types/intake";

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const chatRepository = {
  findById(id: string): ChatSession | undefined {
    return mockStore.chatSessions.find((s) => s.id === id);
  },

  create(
    initial?: Partial<Pick<ChatSession, "intakeState" | "leadDraft" | "bookingContext">>
  ): ChatSession {
    const now = new Date().toISOString();
    const session: ChatSession = {
      id: newId("chat"),
      messages: [],
      intakeState: initial?.intakeState,
      leadDraft: initial?.leadDraft,
      bookingContext: initial?.bookingContext,
      createdAt: now,
      updatedAt: now,
    };
    mockStore.chatSessions.push(session);
    return session;
  },

  appendMessage(
    sessionId: string,
    role: ChatMessage["role"],
    content: string
  ): ChatMessage | null {
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const message: ChatMessage = {
      id: newId("msg"),
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    session.messages.push(message);
    session.updatedAt = message.createdAt;
    return message;
  },

  updateLeadDraft(
    sessionId: string,
    draft: NonNullable<ChatSession["leadDraft"]>
  ): void {
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.leadDraft = { ...session.leadDraft, ...draft };
    session.updatedAt = new Date().toISOString();
  },

  updateIntakeState(sessionId: string, state: IntakeState): void {
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.intakeState = state;
    session.updatedAt = new Date().toISOString();
  },

  updateMechanicSummary(sessionId: string, summary: MechanicIntakeSummary): void {
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.mechanicSummary = summary;
    session.updatedAt = new Date().toISOString();
  },

  updateBookingContext(sessionId: string, ctx: BookingChatContext): void {
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.bookingContext = ctx;
    session.updatedAt = new Date().toISOString();
  },

  markLeadCaptured(sessionId: string): void {
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.leadCaptured = true;
    if (session.intakeState) session.intakeState.leadCaptured = true;
    session.updatedAt = new Date().toISOString();
  },

  markIntakeEmailed(sessionId: string, emailId: string): void {
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.intakeEmailedAt = new Date().toISOString();
    session.intakeEmailId = emailId;
    session.updatedAt = session.intakeEmailedAt;
  },
};
