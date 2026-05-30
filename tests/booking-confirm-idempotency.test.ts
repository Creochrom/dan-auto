import assert from "node:assert/strict";
import test from "node:test";
import { bookingService } from "@/lib/services/booking.service";
import { jobService } from "@/lib/services/job.service";

test("confirm flow creates one job per booking id", async () => {
  const created = await bookingService.create({
    service: "Diagnostics",
    registration: "AB12CDE",
    preferredDate: "2026-06-01",
    preferredTime: "10:00",
    duration: "1h",
    customerName: "Test Customer",
    customerPhone: "07123456789",
    notes: "Customer reports intermittent knocking noise.",
    source: "website",
    intakeSummary: {
      caseSummary: {
        kind: "booking",
        customerName: "Test Customer",
        customerPhone: "07123456789",
        registration: "AB12CDE",
        symptoms: "Intermittent knocking from front suspension.",
        bookingReason: "Diagnostics",
        urgency: "medium",
        drivability: "unknown",
        preferredDate: "2026-06-01",
        preferredTime: "10:00",
        possibleCauses: ["Drop link wear"],
        preparedAt: new Date().toISOString(),
      },
      customerName: "Test Customer",
      customerPhone: "07123456789",
      registration: "AB12CDE",
      bookingSlot: {
        service: "Diagnostics",
        preferredDate: "2026-06-01",
        preferredTime: "10:00",
      },
      symptoms: "Intermittent knocking from front suspension.",
      possibleCauses: ["Drop link wear"],
      uploadedFiles: [],
      urgency: "medium",
      preparedAt: new Date().toISOString(),
    },
  });

  const result = await bookingService.update(created.booking.id, { status: "confirmed" });
  assert.ok(result, "booking should exist");
  const booking = result.booking;

  const first = await jobService.ensureBookingJob({
    bookingId: booking.id,
    registration: booking.registration,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    service: booking.service,
    scheduledDate: booking.preferredDate,
    symptomsText: booking.intakeSummary?.symptoms ?? booking.notes,
    actor: "test-runner",
  });

  const second = await jobService.ensureBookingJob({
    bookingId: booking.id,
    registration: booking.registration,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    service: booking.service,
    scheduledDate: booking.preferredDate,
    symptomsText: booking.intakeSummary?.symptoms ?? booking.notes,
    actor: "test-runner",
  });

  assert.equal(first.job.id, second.job.id, "should reuse same job id");
  assert.equal(first.created, true, "first call creates job");
  assert.equal(second.created, false, "second call is idempotent");
});
