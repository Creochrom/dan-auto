import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyBookingJourneyChip,
  beginContextualBookingHandoff,
  BOOKING_DAY_CHIPS,
  BOOKING_NEED_CHIPS,
  BOOKING_WINDOW_CHIPS,
  getBookingConversationStart,
  hasBookingDaySelected,
  hasBookingServiceSelected,
  hasBookingWindowSelected,
  parseAppointmentPreference,
  resolveBookingJourneyProgress,
  resolveBookingServiceLabel,
  resolveContextualBookingService,
} from "../lib/booking/booking-journey.ts";
import { formatBookingPreferredSlot } from "../lib/services/booking-preview.ts";
import { validateLeadCompletion } from "../lib/services/advisor-workflow.ts";
import { resolveSystemBanner } from "../lib/config/system-status-copy.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import { inferBookingService } from "../lib/services/booking-handoff.ts";

function emptyIntake() {
  return createEmptyStructuredIntake();
}

describe("Book MOT or Service journey — step paths", () => {
  it("starts with need question and MOT/Service/Repair/Not sure chips", () => {
    const start = getBookingConversationStart();
    assert.match(start.message, /What do you need help with today/i);
    assert.equal(start.chips.length, 4);
    assert.ok(start.chips.some((c) => c.label === "MOT"));
    assert.ok(start.chips.some((c) => c.label === "Repair"));
  });

  it("MOT path skips service type and goes to appointment day", () => {
    const mot = BOOKING_NEED_CHIPS.find((c) => c.id === "book-need-mot")!;
    const result = applyBookingJourneyChip(mot, {});
    assert.equal(result.leadDraftPatch.problemDescription, "MOT");
    assert.ok(result.nextChips?.some((c) => c.id === "book-day-today"));
  });

  it("Interim service path sets service then day chips", () => {
    const svc = applyBookingJourneyChip(
      { id: "book-need-service", label: "Service", message: "Service" },
      {}
    );
    assert.match(svc.assistantMessage ?? "", /type of service/i);

    const interim = applyBookingJourneyChip(
      { id: "book-svc-interim", label: "Interim Service", message: "Interim" },
      svc.leadDraftPatch
    );
    assert.equal(interim.leadDraftPatch.problemDescription, "Interim Service");
    assert.deepEqual(interim.nextChips, BOOKING_DAY_CHIPS);
  });

  it("Full and Major service paths set correct labels", () => {
    for (const [id, label] of [
      ["book-svc-full", "Full Service"],
      ["book-svc-major", "Major Service"],
    ] as const) {
      const result = applyBookingJourneyChip(
        { id, label, message: label },
        {}
      );
      assert.equal(result.leadDraftPatch.problemDescription, label);
    }
  });

  it("Not sure path uses guidance then recommends service", () => {
    const unsure = applyBookingJourneyChip(
      BOOKING_NEED_CHIPS.find((c) => c.id === "book-need-unsure")!,
      {}
    );
    assert.ok(unsure.nextChips?.length);

    const guided = applyBookingJourneyChip(
      { id: "book-guide-mileage", label: "High mileage", message: "High mileage" },
      unsure.leadDraftPatch
    );
    assert.equal(guided.leadDraftPatch.problemDescription, "Major Service");
    assert.ok(guided.nextChips?.length);
  });

  it("appointment uses day then window without exact times", () => {
    let draft = { problemDescription: "MOT" };
    const day = applyBookingJourneyChip(BOOKING_DAY_CHIPS[2]!, draft);
    draft = { ...draft, ...day.leadDraftPatch };
    assert.equal(draft.preferredDate, "This week");

    const window = applyBookingJourneyChip(BOOKING_WINDOW_CHIPS[1]!, draft);
    draft = { ...draft, ...window.leadDraftPatch };
    assert.equal(draft.callbackWindow, "Afternoon");
    assert.match(window.structuredPatch?.preferredBookingTime ?? "", /Afternoon/);
    assert.doesNotMatch(window.structuredPatch?.preferredBookingTime ?? "", /\d{1,2}:\d{2}/);
  });
});

describe("Book MOT or Service — contact and review gates", () => {
  it("contact fields not required until service and appointment set", () => {
    const intake = emptyIntake();
    const draft = { problemDescription: "MOT", preferredDate: "Tomorrow" };
    const validation = validateLeadCompletion("booking", intake, draft);
    assert.equal(validation.issue, true);
    assert.equal(validation.day, true);
    assert.equal(validation.time, false);
    assert.equal(validation.canSubmit, false);
  });

  it("does not expose contact in journey progress before appointment complete", () => {
    const intake = emptyIntake();
    const draft = { problemDescription: "MOT" };
    const progress = resolveBookingJourneyProgress(intake, draft);
    assert.equal(progress.step, "appointment_day");
  });

  it("ready for review when service day and window captured", () => {
    const intake = emptyIntake();
    intake.preferredBookingTime = "Next week — Afternoon";
    const draft = {
      problemDescription: "Major Service",
      preferredDate: "Next week",
      callbackWindow: "Afternoon",
      name: "Alex",
      phone: "07123456789",
    };
    const progress = resolveBookingJourneyProgress(intake, draft);
    assert.equal(progress.step, "ready");
    const validation = validateLeadCompletion("booking", intake, draft);
    assert.equal(validation.canSubmit, true);
  });

  it("formats preferred slot with em dash not exact time", () => {
    const intake = emptyIntake();
    intake.preferredBookingTime = "Next week — Afternoon";
    const formatted = formatBookingPreferredSlot(intake, {
      preferredDate: "Next week",
      callbackWindow: "Afternoon",
    });
    assert.match(formatted, /Next week — Afternoon/);
    assert.doesNotMatch(formatted, /\d{1,2}:\d{2}/);
  });
});

describe("Book MOT or Service — success banner requires bookingId", () => {
  it("shows error when sent state lacks bookingId", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sent",
      conciergeMode: "booking",
      uploadsInProgress: false,
      isTyping: false,
      handoffMeta: {},
    });
    assert.equal(banner?.variant, "error");
  });

  it("shows success with reference when bookingId present", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sent",
      conciergeMode: "booking",
      uploadsInProgress: false,
      isTyping: false,
      handoffMeta: { bookingId: "bk_test123", notificationSent: true },
    });
    assert.equal(banner?.variant, "success");
    assert.match(banner?.message ?? "", /Reference: bk_test123/);
    assert.match(banner?.message ?? "", /confirm availability/i);
  });
});

describe("contextual booking from diagnostic / pricing", () => {
  it("starts inspection booking at appointment day chips", () => {
    const intake = emptyIntake();
    intake.aiEstimate.possibleCauses = ["Wheel bearing failure"];
    const result = beginContextualBookingHandoff({
      intake,
      leadDraft: {},
      source: "diagnostic_inspection",
    });
    assert.equal(result.leadDraftPatch.problemDescription, "Diagnostic inspection");
    assert.deepEqual(result.nextChips, BOOKING_DAY_CHIPS);
  });

  it("uses likely cause for repair booking from pricing", () => {
    const intake = emptyIntake();
    intake.aiEstimate.possibleCauses = ["Wheel bearing failure"];
    const label = resolveContextualBookingService(intake, {}, "repair_booking");
    assert.match(label, /wheel bearing/i);
    assert.match(label, /repair/i);
  });

  it("parses Today afternoon without exact clock time", () => {
    const parsed = parseAppointmentPreference("Today afternoon");
    assert.equal(parsed?.preferredDate, "Today");
    assert.equal(parsed?.callbackWindow, "Afternoon");
  });
});

describe("inferBookingService prefers explicit journey selection", () => {
  it("uses problemDescription from journey chips", () => {
    const intake = emptyIntake();
    const label = inferBookingService(intake, { problemDescription: "Major Service" });
    assert.equal(label, "Major Service");
    assert.equal(resolveBookingServiceLabel(intake, { problemDescription: "MOT" }), "MOT");
  });
});
