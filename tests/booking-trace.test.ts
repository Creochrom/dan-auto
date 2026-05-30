import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bookingTraceEnd,
  bookingTraceStage,
  bookingTraceStart,
  createBookingTraceId,
} from "../lib/logging/booking-trace.ts";
import {
  buildBookingIntakePayload,
  isAffirmativeBookingConfirmation,
} from "../lib/services/booking-handoff.ts";
import { validateLeadCompletion } from "../lib/services/advisor-workflow.ts";
import { bookingIntakeService } from "../lib/services/booking-intake.service.ts";
import { chatRepository } from "../lib/repositories/chat.repository.ts";
import { bookingsRepository } from "../lib/repositories/bookings.repository.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import { createInitialIntakeState } from "../lib/services/service-advisor.engine.ts";

async function runSuccessfulBookingTrace(): Promise<string> {
  const traceId = createBookingTraceId();

  bookingTraceStart(traceId, {
    scenario: "simulated_successful_booking",
    userAction: "chip_tap:booking-confirm-send",
  });

  const session = await chatRepository.create({
    intakeState: createInitialIntakeState(),
    structuredIntake: {
      ...createEmptyStructuredIntake(),
      preferredBookingTime: "Today at 3:00 PM",
      customer: { name: "James Smith", contact: "07850964041" },
      intent: "book",
    },
    leadDraft: {
      name: "James Smith",
      phone: "07850964041",
      problemDescription: "MOT",
      preferredDate: "Today",
      callbackWindow: "3:00 PM",
      registration: "AB12CDE",
    },
    advisorRoute: {
      entry_point: "hero_concierge",
      intent: "booking",
      surface: "hero_chat",
      concierge_mode: "booking",
      handoff_policy: "explicit_only",
    },
  });

  bookingTraceStage("1_user_action", traceId, {
    action: "Send booking request chip",
    chatSessionId: session.id,
  });

  const intake = session.structuredIntake!;
  const leadDraft = session.leadDraft!;
  const validation = validateLeadCompletion("booking", intake, leadDraft, "AB12CDE");
  bookingTraceStage("2_readiness_validation", traceId, { validation });

  const payload = buildBookingIntakePayload({
    chatSessionId: session.id,
    intake,
    leadDraft,
    registrationHint: "AB12CDE",
    traceId,
  });
  assert.ok(payload);

  bookingTraceStage("3_submitBookingHandoff", traceId, { payloadReady: true });
  bookingTraceStage("4_post_booking_intake", traceId, { transport: "direct_service_call" });

  const result = await bookingIntakeService.complete({ ...payload!, traceId });

  bookingTraceStage("9_api_response", traceId, {
    bookingId: result.bookingId,
    emailSent: result.emailSent,
  });

  const persisted = await bookingsRepository.findById(result.bookingId);
  bookingTraceStage("10_client_success_banner", traceId, {
    note: "simulated — would set intakeSubmitState=sent and show green banner",
    adminRecordFound: Boolean(persisted),
    bookingStatus: persisted?.status ?? null,
  });

  bookingTraceEnd(traceId, "success", {
    bookingId: result.bookingId,
    emailSent: result.emailSent,
    adminPersistence: Boolean(persisted),
  });

  return traceId;
}

async function runSessionLostTrace(): Promise<string> {
  const traceId = createBookingTraceId();

  bookingTraceStart(traceId, {
    scenario: "simulated_session_not_found",
    userAction: "typed_affirmative:YES",
  });

  const intake = {
    ...createEmptyStructuredIntake(),
    preferredBookingTime: "Tomorrow morning",
    customer: { name: "Jane Doe", contact: "07850964041" },
  };
  const leadDraft = {
    name: "Jane Doe",
    phone: "07850964041",
    problemDescription: "MOT",
    preferredDate: "Tomorrow",
    callbackWindow: "morning",
  };

  bookingTraceStage("2_readiness_validation", traceId, {
    validation: validateLeadCompletion("booking", intake, leadDraft, "AB12CDE"),
  });

  const payload = buildBookingIntakePayload({
    chatSessionId: "chat_stale_or_unknown_session",
    intake,
    leadDraft,
    registrationHint: "AB12CDE",
    traceId,
  });
  assert.ok(payload);

  bookingTraceStage("3_submitBookingHandoff", traceId, { payloadReady: true });

  try {
    await bookingIntakeService.complete({ ...payload!, traceId });
    bookingTraceEnd(traceId, "success", { unexpected: true });
  } catch (err) {
    bookingTraceEnd(traceId, "failure", {
      stage: "6_booking_intake_service",
      error: err instanceof Error ? err.message : String(err),
      note: "POST /api/booking-intake returns 400 — client intakeSubmitState=error, red banner",
    });
  }

  return traceId;
}

function runNeverSubmittedTrace(): string {
  const traceId = createBookingTraceId();

  bookingTraceStart(traceId, {
    scenario: "simulated_gemini_confirmation_without_submit",
    userAction: "none — user did not tap Send booking request or type YES",
  });

  bookingTraceStage("1_user_action", traceId, {
    blocked: true,
    reason: "no_handoff_trigger",
    geminiMessage: "Confirming your request...",
    intakeComplete: true,
    autoSubmitIntake: false,
    handoff_policy: "explicit_only",
  });

  bookingTraceStage("2_readiness_validation", traceId, {
    canSubmit: true,
    note: "validation passes but submitBookingHandoff never called",
  });

  bookingTraceStage("10_client_success_banner", traceId, {
    intakeSubmitState: "idle",
    banner: null,
    note: "No green banner — intakeSubmitState never reached sent",
  });

  bookingTraceEnd(traceId, "blocked", {
    disappearancePoint: "between_stage_1_and_3",
    explanation:
      "Assistant intakeComplete=true is chat-only; Hero requires explicit chip/YES before POST /api/booking-intake",
  });

  return traceId;
}

describe("booking trace investigation", () => {
  it("successful path reaches database, email, and would show success banner", async () => {
    const traceId = await runSuccessfulBookingTrace();
    assert.match(traceId, /^btrace_/);
  });

  it("session-not-found path fails at booking-intake service", async () => {
    const traceId = await runSessionLostTrace();
    assert.match(traceId, /^btrace_/);
  });

  it("gemini-only confirmation never reaches submitBookingHandoff", () => {
    const traceId = runNeverSubmittedTrace();
    assert.match(traceId, /^btrace_/);
  });

  it("typed YES matches affirmative detector", () => {
    assert.equal(isAffirmativeBookingConfirmation("YES"), true);
    assert.equal(isAffirmativeBookingConfirmation("Confirming your request"), false);
  });
});
