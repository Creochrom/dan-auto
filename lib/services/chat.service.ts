import { getAdvisorEngine, isGeminiConfigured } from "@/lib/config/advisor";
import { chatRepository } from "@/lib/repositories/chat.repository";
import { leadService } from "@/lib/services/lead.service";
import { runGeminiAdvisorTurn } from "@/lib/services/gemini.service";
import { vehicleMemoryService } from "@/lib/services/vehicle-memory.service";
import {
  createInitialIntakeState,
  INIT_TOKEN,
  runServiceAdvisorTurn,
  type AdvisorTurnResult,
} from "@/lib/services/service-advisor.engine";
import type { AdvisorEngine } from "@/lib/config/advisor";
import {
  createEmptyStructuredIntake,
  type StructuredIntake,
} from "@/lib/types/structured-intake";
import type { ChatRequest, ChatResponse, ChatSession, LeadDraft } from "@/lib/types/chat";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";
import { stripPlate } from "@/lib/format-plate";

const GEMINI_SETUP_MESSAGE = `The AI service advisor is not connected yet.

To enable Gemini instead of the scripted flow:
1. Create a file \`.env.local\` in the project root
2. Add: GEMINI_API_KEY=your_key_from_google_ai_studio
3. Restart \`npm run dev\`
4. Click the reset button in this chat to start a fresh conversation

Get a key: https://aistudio.google.com/apikey`;

/**
 * Service advisor chat — Gemini by default (replaces rule engine).
 * Legacy scripts: set ADVISOR_ENGINE=rules in .env.local
 */

function unconfiguredGeminiTurn(session: ChatSession): AdvisorTurnResult {
  return {
    content: GEMINI_SETUP_MESSAGE,
    intakeState: session.intakeState ?? createInitialIntakeState(),
    structuredIntake: session.structuredIntake ?? createEmptyStructuredIntake(),
    suggestionChips: [],
    intakeComplete: false,
  };
}

function geminiErrorTurn(session: ChatSession, err: unknown): AdvisorTurnResult {
  const detail = err instanceof Error ? err.message : String(err);
  console.error("[chat] Gemini turn failed:", err);

  // Surface a useful hint when the configured model is unavailable
  // (e.g. legacy `gemini-2.0-flash` 404 after the 2026-06-01 deprecation,
  // or a wrong `GEMINI_MODEL` override). Anything else gets a generic
  // friendly fallback — never expose raw SDK stack traces to customers.
  const isModelUnavailable =
    /no longer available|not found|404|deprecated|unsupported.*model/i.test(detail);

  const customerMessage = isModelUnavailable
    ? "Our AI service advisor is temporarily unavailable. Please call us on 07850 964 041 or use the booking form below — a mechanic will get straight back to you."
    : "Sorry — I'm having trouble reaching the AI service right now. Please try again in a moment, or call us on 07850 964 041 and we'll help you directly.";

  return {
    content: customerMessage,
    intakeState: session.intakeState ?? createInitialIntakeState(),
    structuredIntake: session.structuredIntake ?? createEmptyStructuredIntake(),
    suggestionChips: [
      { id: "retry", label: "Try again", message: "Please try again" },
      { id: "book", label: "Book online instead", message: "I'd like to book online instead" },
    ],
    intakeComplete: false,
  };
}

async function runAdvisorTurn(
  session: ChatSession,
  userText: string,
  isInit: boolean,
  registrationHint?: string
): Promise<{ turn: AdvisorTurnResult; advisorEngine: AdvisorEngine | "unconfigured" }> {
  const engine = getAdvisorEngine();

  if (engine === "rules") {
    return {
      advisorEngine: "rules",
      turn: runServiceAdvisorTurn({
        userMessage: userText,
        isInit,
        intake: session.intakeState!,
        leadDraft: session.leadDraft ?? {},
        registrationHint,
        bookingContext: session.bookingContext,
      }),
    };
  }

  if (!isGeminiConfigured()) {
    return { advisorEngine: "unconfigured", turn: unconfiguredGeminiTurn(session) };
  }

  try {
    const turn = await runGeminiAdvisorTurn({
      messages: session.messages,
      userMessage: userText,
      isInit,
      structuredIntake: session.structuredIntake ?? createEmptyStructuredIntake(),
      leadDraft: session.leadDraft ?? {},
      registrationHint,
      bookingContext: session.bookingContext,
      vehicleMemory: session.vehicleMemory,
    });
    return { advisorEngine: "gemini", turn };
  } catch (err) {
    return { advisorEngine: "gemini", turn: geminiErrorTurn(session, err) };
  }
}

/**
 * Seed the structured intake + lead draft from a vehicle-memory lookup so the
 * AI doesn't ask for things we already know. Returns the merged values.
 */
function seedFromVehicleMemory(
  base: StructuredIntake,
  draft: LeadDraft,
  lookup: VehicleMemoryLookupResult
): { structured: StructuredIntake; lead: LeadDraft } {
  const v = lookup.vehicle;
  const c = lookup.customer;

  const structured: StructuredIntake = {
    ...base,
    customer: {
      name: base.customer.name || c?.name || "",
      contact: base.customer.contact || c?.phone || c?.email || "",
    },
    vehicle: {
      make: base.vehicle.make || v?.make || "",
      model: base.vehicle.model || v?.model || "",
      year: base.vehicle.year || v?.year || "",
      engine: base.vehicle.engine || v?.engine || "",
      mileage: base.vehicle.mileage,
    },
  };

  const vehicleModelStr = [v?.year, v?.make, v?.model].filter(Boolean).join(" ");

  const lead: LeadDraft = {
    ...draft,
    registration: draft.registration || lookup.regDisplay,
    name: draft.name || c?.name,
    phone: draft.phone || c?.phone,
    email: draft.email || c?.email,
    vehicleModel: draft.vehicleModel || vehicleModelStr || undefined,
  };

  return { structured, lead };
}

export const chatService = {
  getStatus() {
    const engine = getAdvisorEngine();
    return {
      engine,
      geminiConfigured: isGeminiConfigured(),
      active:
        engine === "rules" ? "rules" : isGeminiConfigured() ? "gemini" : "unconfigured",
    };
  },

  async handleMessage(request: ChatRequest): Promise<ChatResponse> {
    const isInit =
      request.init === true ||
      request.message === INIT_TOKEN ||
      request.message?.trim() === "";

    if (!isInit && !request.message?.trim()) {
      throw new Error("message is required");
    }

    let session = request.sessionId
      ? chatRepository.findById(request.sessionId)
      : undefined;

    if (!session) {
      session = chatRepository.create({
        intakeState: createInitialIntakeState(),
        structuredIntake: createEmptyStructuredIntake(),
        bookingContext: request.bookingContext,
      });
    }

    if (request.bookingContext && !session.bookingContext) {
      chatRepository.updateBookingContext(session.id, request.bookingContext);
      session.bookingContext = request.bookingContext;
    }

    if (!session.intakeState) {
      session.intakeState = createInitialIntakeState();
    }

    if (!session.structuredIntake) {
      session.structuredIntake = createEmptyStructuredIntake();
    }

    // ── Vehicle memory: do a DVLA + repo lookup the first time we see a
    // registration on this session (or when the customer changes plate),
    // then seed the structured intake + lead draft so the AI never asks
    // for facts we already know.
    const incomingRegCanon = stripPlate(request.registration ?? "");
    const knownRegCanon = stripPlate(session.vehicleMemory?.reg ?? "");
    if (incomingRegCanon && incomingRegCanon !== knownRegCanon) {
      const lookup = vehicleMemoryService.lookup(incomingRegCanon);
      session.vehicleMemory = lookup;
      chatRepository.updateVehicleMemory(session.id, lookup);

      const seeded = seedFromVehicleMemory(
        session.structuredIntake,
        session.leadDraft ?? {},
        lookup
      );
      session.structuredIntake = seeded.structured;
      session.leadDraft = seeded.lead;
      chatRepository.updateStructuredIntake(session.id, seeded.structured);
      chatRepository.updateLeadDraft(session.id, seeded.lead);
    }

    const userText = isInit ? INIT_TOKEN : request.message!.trim();

    if (!isInit) {
      chatRepository.appendMessage(session.id, "user", userText);
    }

    const refreshedForTurn = chatRepository.findById(session.id) ?? session;
    const { turn, advisorEngine } = await runAdvisorTurn(
      refreshedForTurn,
      userText,
      isInit,
      request.registration
    );

    chatRepository.updateIntakeState(session.id, turn.intakeState);

    if (turn.structuredIntake) {
      chatRepository.updateStructuredIntake(session.id, turn.structuredIntake);
    }

    if (turn.leadDraft) {
      chatRepository.updateLeadDraft(session.id, turn.leadDraft);
    }

    if (turn.mechanicSummary) {
      chatRepository.updateMechanicSummary(session.id, turn.mechanicSummary);
    }

    const assistantMessage = chatRepository.appendMessage(
      session.id,
      "assistant",
      turn.content
    );

    if (!assistantMessage) {
      throw new Error("Failed to append assistant message");
    }

    const shouldCapture =
      turn.shouldCaptureLead &&
      !session.leadCaptured &&
      turn.leadDraft?.name &&
      turn.leadDraft?.phone;

    if (shouldCapture && turn.leadDraft) {
      const { name, phone, registration, vehicleModel, problemDescription, callbackWindow } =
        turn.leadDraft;
      const summary = turn.mechanicSummary;
      leadService.create({
        name: name!,
        phone: phone!,
        registration,
        vehicleModel,
        problemDescription: problemDescription ?? summary?.symptoms,
        preferredDate: callbackWindow,
        source: "assistant",
        aiSummary: summary
          ? [
              `Vehicle: ${summary.vehicle ?? "—"}`,
              `Reg: ${summary.registration ?? "—"}`,
              `Symptoms: ${summary.symptoms}`,
              `Causes: ${summary.possibleCauses.join("; ")}`,
              `Range: ${summary.estimatedRange}`,
              `Severity: ${summary.severity}`,
              `Callback: ${summary.callbackWindow ?? "—"}`,
            ].join("\n")
          : `Chat session ${session.id}`,
      });
      chatRepository.markLeadCaptured(session.id);
    }

    const lastUser = [...session.messages]
      .reverse()
      .find((m) => m.role === "user");

    const refreshed = chatRepository.findById(session.id) ?? session;
    const structuredIntake = turn.structuredIntake ?? refreshed.structuredIntake;

    return {
      sessionId: session.id,
      message: assistantMessage,
      userMessage: isInit ? undefined : lastUser,
      leadDraft: turn.leadDraft,
      intakeState: turn.intakeState,
      mechanicSummary: turn.mechanicSummary ?? refreshed.mechanicSummary,
      structuredIntake,
      suggestionChips: turn.suggestionChips,
      typingLabel: turn.typingLabel,
      intakeComplete: turn.intakeComplete ?? turn.intakeState.phase === "complete",
      intakeEmailed: Boolean(refreshed.intakeEmailedAt),
      advisorEngine,
    };
  },

  getIntakeExport(sessionId: string) {
    const session = chatRepository.findById(sessionId);
    if (!session) return null;

    return {
      sessionId: session.id,
      structuredIntake: session.structuredIntake ?? createEmptyStructuredIntake(),
      mechanicSummary: session.mechanicSummary,
      leadDraft: session.leadDraft,
      intakeState: session.intakeState,
      messages: session.messages,
      intakeComplete:
        session.intakeState?.phase === "complete" ||
        Boolean(session.mechanicSummary) ||
        Boolean(session.leadCaptured),
      intakeEmailed: Boolean(session.intakeEmailedAt),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  },
};
