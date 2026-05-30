import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatVehicleDisplay,
  normalizeVehicleParts,
} from "../lib/vehicle/format-vehicle-display.ts";
import {
  dedupeServiceLabel,
  inferBookingService,
  normalizePreferredWindow,
} from "../lib/services/booking-handoff.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import { structuredIntakeToLeadDraft } from "../lib/services/intake-mapper.ts";
import { resolveSystemBanner } from "../lib/config/system-status-copy.ts";
import { bookingIntakeService } from "../lib/services/booking-intake.service.ts";
import { chatRepository } from "../lib/repositories/chat.repository.ts";
import { bookingsRepository } from "../lib/repositories/bookings.repository.ts";

describe("Release 0.2.7 booking fixes", () => {
  it("deduplicates Bmw Bmw 2007 2007 vehicle string", () => {
    const formatted = formatVehicleDisplay(
      normalizeVehicleParts({ make: "Bmw", model: "Bmw 2007", year: "2007" })
    );
    assert.equal(formatted, "2007 BMW");
  });

  it("formats canonical vehicle line", () => {
    const formatted = formatVehicleDisplay({
      year: "2007",
      make: "BMW",
      model: "320D",
    });
    assert.equal(formatted, "2007 BMW 320D");
  });

  it("deduplicates brake pads service label", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Brake pads replacement"],
      },
    };
    const leadDraft = structuredIntakeToLeadDraft(intake, {
      problemDescription: "Brake pads replacement",
    });
    assert.equal(inferBookingService(intake, leadDraft), "Brake pads");
    assert.equal(
      dedupeServiceLabel("Brake pads replacement Brake pads replacement"),
      "Brake pads replacement"
    );
  });

  it("normalizes clock times to windows", () => {
    assert.equal(normalizePreferredWindow("10:00"), "Morning");
    assert.equal(normalizePreferredWindow("Morning"), "Morning");
    assert.equal(normalizePreferredWindow("3:00 PM"), "Afternoon");
  });

  it("returns warning banner when booking saved but notification failed", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sent",
      conciergeMode: "booking",
      uploadsInProgress: false,
      isTyping: false,
      handoffMeta: {
        bookingId: "bk_test123",
        bookingCreated: true,
        notificationSent: false,
      },
    });
    assert.equal(banner?.variant, "warning");
    assert.match(banner?.message ?? "", /saved successfully/i);
    assert.match(banner?.message ?? "", /Reference: bk_test123/);
  });

  it("returns success banner with booking reference when notification sent", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sent",
      conciergeMode: "booking",
      uploadsInProgress: false,
      isTyping: false,
      handoffMeta: {
        bookingId: "bk_test456",
        notificationSent: true,
      },
    });
    assert.equal(banner?.variant, "success");
    assert.match(banner?.message ?? "", /Reference: bk_test456/);
  });

  it("returns 201-equivalent result when email fails after booking create", async () => {
    const session = await chatRepository.create({
      structuredIntake: {
        ...createEmptyStructuredIntake(),
        preferredBookingTime: "Tomorrow morning",
        customer: { name: "Ruslan", contact: "07667787786" },
        issue: {
          ...createEmptyStructuredIntake().issue,
          symptoms: ["Brake pads"],
        },
        intent: "book",
      },
      leadDraft: {
        name: "Ruslan",
        phone: "07667787786",
        preferredDate: "Tomorrow",
        callbackWindow: "Morning",
        registration: "MV57 HJX",
      },
    });

    const result = await bookingIntakeService.complete({
      chatSessionId: session.id,
      service: "Brake pads",
      preferredDate: "Tomorrow",
      preferredTime: "Morning",
      registration: "MV57 HJX",
      customerName: "Ruslan",
      customerPhone: "07667787786",
    });

    assert.equal(result.bookingCreated, true);
    assert.equal(result.notificationSent, false);
    assert.ok(result.notificationWarning);
    const row = await bookingsRepository.findById(result.bookingId);
    assert.ok(row);
  });
});
