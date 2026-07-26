import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  assertBookableDate,
  dayOfWeek,
  getAvailableSlots,
  getAvailableSlotsRange,
  getClosedReason,
  isSunday,
  isWorkshopClosed,
  isWorkshopOpen,
  WorkshopClosedError,
} from "../lib/workshop/availability.ts";
import { workshopClosuresRepository } from "../lib/repositories/workshop-closures.repository.ts";

describe("workshop availability", () => {
  beforeEach(() => {
    workshopClosuresRepository.__clearMock();
  });

  it("marks Sundays as permanently closed", async () => {
    // 2026-08-09 is a Sunday
    assert.equal(isSunday("2026-08-09"), true);
    assert.equal(dayOfWeek("2026-08-09"), 0);
    assert.equal(await isWorkshopClosed("2026-08-09"), true);
    assert.equal(await isWorkshopOpen("2026-08-09"), false);

    const reason = await getClosedReason("2026-08-09");
    assert.equal(reason?.kind, "sunday");
    assert.match(reason?.message ?? "", /closed on Sundays/i);

    const slots = await getAvailableSlots("2026-08-09");
    assert.equal(slots.closed, true);
    assert.deepEqual(slots.available, []);
  });

  it("never returns Sunday slots in a range", async () => {
    const range = await getAvailableSlotsRange("2026-08-08", "2026-08-10");
    const sunday = range.find((d) => d.date === "2026-08-09");
    assert.ok(sunday);
    assert.equal(sunday!.closed, true);
    assert.equal(sunday!.available.length, 0);

    const saturday = range.find((d) => d.date === "2026-08-08");
    assert.ok(saturday);
    assert.equal(saturday!.closed, false);
    assert.ok(saturday!.available.every((t) => t < "13:00"));
  });

  it("closes inclusive holiday ranges", async () => {
    await workshopClosuresRepository.create({
      startDate: "2026-08-05",
      endDate: "2026-08-13",
      reason: "Summer Holiday",
    });

    for (const date of [
      "2026-08-05",
      "2026-08-06",
      "2026-08-09",
      "2026-08-13",
    ]) {
      assert.equal(await isWorkshopClosed(date), true, date);
      const reason = await getClosedReason(date);
      if (date === "2026-08-09") {
        // Sunday takes priority in messaging
        assert.equal(reason?.kind, "sunday");
      } else {
        assert.equal(reason?.kind, "closure");
        assert.match(reason?.message ?? "", /closed between/i);
      }
    }

    assert.equal(await isWorkshopOpen("2026-08-04"), true);
    assert.equal(await isWorkshopOpen("2026-08-14"), true);
  });

  it("assertBookableDate rejects closed ISO dates", async () => {
    await assert.rejects(
      () => assertBookableDate("2026-08-09"),
      (err: unknown) => {
        assert.ok(err instanceof WorkshopClosedError);
        assert.equal(err.status, 400);
        return true;
      }
    );

    await workshopClosuresRepository.create({
      startDate: "2026-08-05",
      endDate: "2026-08-13",
      reason: "Summer Holiday",
    });

    await assert.rejects(
      () => assertBookableDate("2026-08-10"),
      WorkshopClosedError
    );

    // Fuzzy non-ISO dates are not rejected here (AI soft path)
    await assertBookableDate("Tomorrow");
  });
});
