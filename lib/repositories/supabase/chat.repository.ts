/**
 * Supabase implementation of the chat repository.
 * Mirrors the interface of lib/repositories/chat.repository.ts exactly.
 * Only active when STORAGE_BACKEND=supabase.
 *
 * Storage strategy: the full ChatSession is stored as a JSONB blob in the
 * `data` column.  This means the DB schema never needs to change when the
 * ChatSession type evolves.  Mutation methods do a read-modify-write.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type { BookingChatContext, ChatMessage, ChatSession } from "@/lib/types/chat";
import type { IntakeState, MechanicIntakeSummary } from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";

type ChatSessionRow = {
  id: string;
  data: ChatSession;
  created_at: string;
  updated_at: string;
};

function newId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function newMsgId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function getSession(id: string): Promise<ChatSession | undefined> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("data")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`[chat] findById failed: ${error.message}`);
  if (!data) return undefined;
  return (data as ChatSessionRow).data as ChatSession;
}

async function saveSession(session: ChatSession): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("chat_sessions")
    .update({ data: session, updated_at: session.updatedAt })
    .eq("id", session.id);
  if (error) throw new Error(`[chat] save failed: ${error.message}`);
}

export const supabaseChatRepository = {
  async findById(id: string): Promise<ChatSession | undefined> {
    return getSession(id);
  },

  async create(
    initial?: Partial<
      Pick<
        ChatSession,
        "intakeState" | "leadDraft" | "bookingContext" | "advisorRoute" | "structuredIntake"
      >
    >
  ): Promise<ChatSession> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const session: ChatSession = {
      id: newId(),
      messages: [],
      intakeState: initial?.intakeState,
      leadDraft: initial?.leadDraft,
      bookingContext: initial?.bookingContext,
      advisorRoute: initial?.advisorRoute,
      structuredIntake: initial?.structuredIntake,
      createdAt: now,
      updatedAt: now,
    };
    const { error } = await supabase.from("chat_sessions").insert({
      id: session.id,
      data: session,
      created_at: now,
      updated_at: now,
    });
    if (error) throw new Error(`[chat] create failed: ${error.message}`);
    return session;
  },

  async appendMessage(
    sessionId: string,
    role: ChatMessage["role"],
    content: string
  ): Promise<ChatMessage | null> {
    const session = await getSession(sessionId);
    if (!session) return null;

    const message: ChatMessage = {
      id: newMsgId(),
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    session.messages.push(message);
    session.updatedAt = message.createdAt;
    await saveSession(session);
    return message;
  },

  async updateLeadDraft(
    sessionId: string,
    draft: NonNullable<ChatSession["leadDraft"]>
  ): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    session.leadDraft = { ...session.leadDraft, ...draft };
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
  },

  async updateIntakeState(sessionId: string, state: IntakeState): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    session.intakeState = state;
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
  },

  async updateStructuredIntake(sessionId: string, intake: StructuredIntake): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    session.structuredIntake = intake;
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
  },

  async updateMechanicSummary(
    sessionId: string,
    summary: MechanicIntakeSummary
  ): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    session.mechanicSummary = summary;
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
  },

  async updateBookingContext(sessionId: string, ctx: BookingChatContext): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    session.bookingContext = ctx;
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
  },

  async updateAdvisorRoute(sessionId: string, route: AdvisorRouteContext): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    session.advisorRoute = route;
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
  },

  async markLeadCaptured(sessionId: string): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    session.leadCaptured = true;
    if (session.intakeState) session.intakeState.leadCaptured = true;
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
  },

  async markIntakeEmailed(sessionId: string, emailId: string): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    const now = new Date().toISOString();
    session.intakeEmailedAt = now;
    session.intakeEmailId = emailId;
    session.updatedAt = now;
    await saveSession(session);
  },

  async updateVehicleMemory(
    sessionId: string,
    lookup: VehicleMemoryLookupResult
  ): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) return;
    session.vehicleMemory = lookup;
    session.updatedAt = new Date().toISOString();
    await saveSession(session);
  },
};
