import { mockStore } from "@/lib/repositories/mock-store";
import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseChatRepository } from "@/lib/repositories/supabase/chat.repository";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type { BookingChatContext, ChatMessage, ChatSession } from "@/lib/types/chat";
import type { IntakeState, MechanicIntakeSummary } from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const chatRepository = {
  async findById(id: string): Promise<ChatSession | undefined> {
    if (getStorageBackend() === "supabase") return supabaseChatRepository.findById(id);
    return mockStore.chatSessions.find((s) => s.id === id);
  },

  async create(
    initial?: Partial<
      Pick<
        ChatSession,
        "intakeState" | "leadDraft" | "bookingContext" | "advisorRoute" | "structuredIntake"
      >
    >
  ): Promise<ChatSession> {
    if (getStorageBackend() === "supabase") return supabaseChatRepository.create(initial);

    const now = new Date().toISOString();
    const session: ChatSession = {
      id: newId("chat"),
      messages: [],
      intakeState: initial?.intakeState,
      leadDraft: initial?.leadDraft,
      bookingContext: initial?.bookingContext,
      advisorRoute: initial?.advisorRoute,
      structuredIntake: initial?.structuredIntake,
      createdAt: now,
      updatedAt: now,
    };
    mockStore.chatSessions.push(session);
    return session;
  },

  async appendMessage(
    sessionId: string,
    role: ChatMessage["role"],
    content: string
  ): Promise<ChatMessage | null> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.appendMessage(sessionId, role, content);
    }

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

  async updateLeadDraft(
    sessionId: string,
    draft: NonNullable<ChatSession["leadDraft"]>
  ): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.updateLeadDraft(sessionId, draft);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.leadDraft = { ...session.leadDraft, ...draft };
    session.updatedAt = new Date().toISOString();
  },

  async updateIntakeState(sessionId: string, state: IntakeState): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.updateIntakeState(sessionId, state);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.intakeState = state;
    session.updatedAt = new Date().toISOString();
  },

  async updateStructuredIntake(sessionId: string, intake: StructuredIntake): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.updateStructuredIntake(sessionId, intake);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.structuredIntake = intake;
    session.updatedAt = new Date().toISOString();
  },

  async updateMechanicSummary(
    sessionId: string,
    summary: MechanicIntakeSummary
  ): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.updateMechanicSummary(sessionId, summary);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.mechanicSummary = summary;
    session.updatedAt = new Date().toISOString();
  },

  async updateBookingContext(sessionId: string, ctx: BookingChatContext): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.updateBookingContext(sessionId, ctx);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.bookingContext = ctx;
    session.updatedAt = new Date().toISOString();
  },

  async updateAdvisorRoute(sessionId: string, route: AdvisorRouteContext): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.updateAdvisorRoute(sessionId, route);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.advisorRoute = route;
    session.updatedAt = new Date().toISOString();
  },

  async markLeadCaptured(sessionId: string): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.markLeadCaptured(sessionId);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.leadCaptured = true;
    if (session.intakeState) session.intakeState.leadCaptured = true;
    session.updatedAt = new Date().toISOString();
  },

  async markIntakeEmailed(sessionId: string, emailId: string): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.markIntakeEmailed(sessionId, emailId);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.intakeEmailedAt = new Date().toISOString();
    session.intakeEmailId = emailId;
    session.updatedAt = session.intakeEmailedAt;
  },

  async updateVehicleMemory(
    sessionId: string,
    lookup: VehicleMemoryLookupResult
  ): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseChatRepository.updateVehicleMemory(sessionId, lookup);
    }
    const session = mockStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.vehicleMemory = lookup;
    session.updatedAt = new Date().toISOString();
  },
};
