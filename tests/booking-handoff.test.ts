import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBookingIntakePayload,
  inferBookingService,
  isAffirmativeBookingConfirmation,
  isBookingHandoffReady,
  resolveBookingSlotFields,
} from "../lib/services/booking-handoff.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import { chatRepository } from "../lib/repositories/chat.repository.ts";
import { bookingIntakeService } from "../lib/services/booking-intake.service.ts";
import { createInitialIntakeState } from "../lib/services/service-advisor.engine.ts";

describe("booking handoff helpers", () => {
  it("detects affirmative booking confirmations", () => {
    assert.equal(isAffirmativeBookingConfirmation("YES"), true);
    assert.equal(isAffirmativeBookingConfirmation("yes please"), true);
    assert.equal(isAffirmativeBookingConfirmation("no"), false);
    assert.equal(isAffirmativeBookingConfirmation("maybe tomorrow"), false);
  });

  it("infers service from pricing context", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Service cost enquiry"],
      },
      aiEstimate: {
        ...createEmptyStructuredIntake().aiEstimate,
        estimatedPriceRange: "£120–£180",
      },
    };
    assert.equal(inferBookingService(intake, {}), "Service");
  });

  it("splits day and time from preferred booking slot text", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      preferredBookingTime: "Today morning",
    };
    const slot = resolveBookingSlotFields(intake, {});
    assert.equal(slot.preferredDate, "Today");
    assert.equal(slot.preferredTime, "Morning");
  });

  it("builds booking-intake payload when booking handoff is ready", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      preferredBookingTime: "Today at 3:00 PM",
      customer: { name: "James Smith", contact: "07850964041" },
    };
    const leadDraft = {
      name: "James Smith",
      phone: "07850964041",
      problemDescription: "MOT",
      preferredDate: "Today",
      callbackWindow: "Morning",
    };

    assert.equal(isBookingHandoffReady("booking", intake, leadDraft, "AB12 CDE"), true);

    const payload = buildBookingIntakePayload({
      chatSessionId: "chat_test",
      intake,
      leadDraft,
      registrationHint: "AB12 CDE",
    });

    assert.ok(payload);
    assert.equal(payload!.chatSessionId, "chat_test");
    assert.equal(payload!.preferredDate, "Today");
    assert.equal(payload!.preferredTime, "Morning");
    assert.equal(payload!.registration, "AB12 CDE");
    assert.equal(payload!.customerName, "James Smith");
  });

  it("returns null when booking handoff is incomplete", () => {
    const intake = createEmptyStructuredIntake();
    assert.equal(isBookingHandoffReady("booking", intake, {}, undefined), false);
    assert.equal(
      buildBookingIntakePayload({
        chatSessionId: "chat_test",
        intake,
        leadDraft: {},
      }),
      null
    );
  });

  it("submits booking via booking-intake without Gemini", async () => {
    const session = await chatRepository.create({
      intakeState: createInitialIntakeState(),
      structuredIntake: {
        ...createEmptyStructuredIntake(),
        preferredBookingTime: "Today at 3:00 PM",
        customer: { name: "James Smith", contact: "07850964041" },
      },
      leadDraft: {
        name: "James Smith",
        phone: "07850964041",
        problemDescription: "MOT",
        preferredDate: "Today",
        callbackWindow: "Morning",
        registration: "AB12CDE",
      },
      advisorRoute: {
        entry_point: "hero_concierge",
        intent: "booking",
        surface: "hero_chat",
        concierge_mode: "booking",
      },
    });

    const payload = buildBookingIntakePayload({
      chatSessionId: session.id,
      intake: session.structuredIntake!,
      leadDraft: session.leadDraft!,
      registrationHint: "AB12CDE",
    });
    assert.ok(payload);

    const result = await bookingIntakeService.complete(payload!);
    assert.ok(result.bookingId);
    assert.equal(result.intakeSummary.bookingSlot.preferredDate, "Today");
    assert.equal(result.intakeSummary.bookingSlot.preferredTime, "Morning");
    assert.equal(result.bookingCreated, true);
  });
});
