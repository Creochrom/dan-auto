import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bookingChangeEventsRepository } from "../lib/repositories/booking-change-events.repository.ts";
import { bookingService } from "../lib/services/booking.service.ts";
import { bookingsRepository } from "../lib/repositories/bookings.repository.ts";

describe("booking audit resilience", () => {
  it("creates booking when booking_change_events write fails", async () => {
    const originalCreate = bookingChangeEventsRepository.create.bind(
      bookingChangeEventsRepository
    );

    bookingChangeEventsRepository.create = async () => {
      throw new Error(
        '[booking_change_events] create failed: relation "public.booking_change_events" does not exist'
      );
    };

    try {
      const result = await bookingService.create({
        service: "MOT",
        registration: "AB12CDE",
        preferredDate: "Saturday",
        preferredTime: "11:00 AM",
        duration: "1h",
        customerName: "James Smith",
        customerPhone: "07850964041",
        source: "website",
      });

      assert.ok(result.booking.id.startsWith("bk_"));
      const persisted = await bookingsRepository.findById(result.booking.id);
      assert.ok(persisted);
      assert.equal(persisted!.registration, "AB12CDE");
    } finally {
      bookingChangeEventsRepository.create = originalCreate;
    }
  });

  it("updates booking when booking_change_events write fails", async () => {
    const created = await bookingService.create({
      service: "Service",
      registration: "XY99ZZZ",
      preferredDate: "Tomorrow",
      preferredTime: "Morning",
      duration: "1h",
      customerName: "Jane Doe",
      customerPhone: "07850964041",
      source: "website",
    });

    const originalCreate = bookingChangeEventsRepository.create.bind(
      bookingChangeEventsRepository
    );
    bookingChangeEventsRepository.create = async () => {
      throw new Error("[booking_change_events] create failed: table missing");
    };

    try {
      const updated = await bookingService.update(created.booking.id, {
        notes: "Updated notes",
      });
      assert.ok(updated);
      assert.equal(updated!.booking.notes, "Updated notes");
    } finally {
      bookingChangeEventsRepository.create = originalCreate;
    }
  });
});
