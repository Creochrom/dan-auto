import { chatRepository } from "@/lib/repositories/chat.repository";
import { leadService } from "@/lib/services/lead.service";
import {
  createInitialIntakeState,
  INIT_TOKEN,
  runServiceAdvisorTurn,
} from "@/lib/services/service-advisor.engine";
import type { ChatRequest, ChatResponse } from "@/lib/types/chat";

/**
 * Service advisor chat — structured intake until Gemini (GEMINI_API_KEY) replaces the engine.
 */

export const chatService = {
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

    const userText = isInit ? INIT_TOKEN : request.message!.trim();

    if (!isInit) {
      chatRepository.appendMessage(session.id, "user", userText);
    }

    const turn = runServiceAdvisorTurn({
      userMessage: userText,
      isInit,
      intake: session.intakeState,
      leadDraft: session.leadDraft ?? {},
      registrationHint: request.registration,
      bookingContext: session.bookingContext ?? request.bookingContext,
    });

    chatRepository.updateIntakeState(session.id, turn.intakeState);

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

    return {
      sessionId: session.id,
      message: assistantMessage,
      userMessage: isInit ? undefined : lastUser,
      leadDraft: turn.leadDraft,
      intakeState: turn.intakeState,
      mechanicSummary: turn.mechanicSummary ?? session.mechanicSummary,
      suggestionChips: turn.suggestionChips,
      typingLabel: turn.typingLabel,
      intakeComplete: turn.intakeComplete ?? turn.intakeState.phase === "complete",
    };
  },
};
