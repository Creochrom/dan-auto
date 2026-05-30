import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { computeBookingFieldChanges } from "../lib/booking/compute-booking-changes.ts";
import { formatPhoneDisplay, phoneTelHref } from "../lib/format-contact.ts";
import {
  formatWorkshopField,
  formatWorkshopSourceLabel,
  NOT_PROVIDED,
  renderWorkshopFieldDiffText,
  renderWorkshopPhoneBannerText,
} from "../lib/email/templates/workshop-shared.ts";
import { renderWorkshopAlertSubject, renderWorkshopAlertText } from "../lib/email/templates/booking-alert.ts";
import {
  renderWorkshopUpdatedSubject,
  renderWorkshopUpdatedText,
  renderWorkshopCancelledSubject,
} from "../lib/email/templates/booking-updated.ts";
import { renderLeadAlertText } from "../lib/email/templates/lead-alert.ts";
import type { Booking } from "../lib/types/booking.ts";
import type { Lead } from "../lib/types/lead.ts";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

const sampleBooking = (): Booking => ({
  id: "bk_test_123",
  status: "new",
  service: "MOT",
  registration: "MV57 HJX",
  preferredDate: "2026-06-30",
  preferredTime: "13:30",
  duration: "1h",
  customerName: "Jane Smith",
  customerPhone: "447460648701",
  customerEmail: "jane@example.com",
  notes: "Noise from front",
  source: "website",
  createdAt: "2026-05-28T10:00:00.000Z",
  updatedAt: "2026-05-28T10:00:00.000Z",
});

describe("workshop email templates", () => {
  it("uses Not provided for empty fields", () => {
    assert.equal(formatWorkshopField(""), NOT_PROVIDED);
    assert.equal(formatWorkshopField(undefined), NOT_PROVIDED);
  });

  it("formats UK phone numbers for humans with working tel links", () => {
    assert.equal(formatPhoneDisplay("447460648701"), "+44 7460 648 701");
    assert.equal(phoneTelHref("447460648701"), "tel:+447460648701");
  });

  it("uses new booking subject with registration and slot", () => {
    const booking = sampleBooking();
    assert.equal(
      renderWorkshopAlertSubject(booking),
      "New Booking – MV57 HJX – 30 Jun 2026 13:30"
    );
  });

  it("puts phone banner and email at the top of direct booking alerts", () => {
    const booking = sampleBooking();
    const text = renderWorkshopAlertText(booking);
    assert.ok(text.includes("New Booking"));
    assert.ok(text.includes(">>> CALL CUSTOMER <<<"));
    assert.ok(text.indexOf(">>> CALL CUSTOMER <<<") < text.indexOf("CUSTOMER DETAILS"));
    assert.ok(text.includes("Phone: +44 7460 648 701"));
    assert.ok(text.includes("Email: jane@example.com"));
    assert.ok(text.includes("Booking ID: bk_test_123"));
    assert.ok(text.includes("Source:                 Quick Booking"));
  });

  it("renders updated booking subject and diff block", () => {
    const before = sampleBooking();
    const after = {
      ...before,
      preferredDate: "2026-07-02",
      preferredTime: "08:30",
      updatedAt: "2026-05-29T10:00:00.000Z",
    };
    const changes = computeBookingFieldChanges(before, after);

    assert.equal(renderWorkshopUpdatedSubject(after), "UPDATED Booking – MV57 HJX");
    const diffText = renderWorkshopFieldDiffText(changes).join("\n");
    assert.ok(diffText.includes("OLD: 30 Jun 2026"));
    assert.ok(diffText.includes("NEW: 2 Jul 2026"));
    assert.ok(diffText.includes("OLD: 13:30"));
    assert.ok(diffText.includes("NEW: 08:30"));

    const body = renderWorkshopUpdatedText(after, changes);
    assert.ok(body.includes("BOOKING UPDATED"));
    assert.ok(body.includes("Customer changed booking details."));
  });

  it("renders cancelled booking subject", () => {
    const booking = { ...sampleBooking(), status: "rejected" as const };
    assert.equal(renderWorkshopCancelledSubject(booking), "CANCELLED Booking – MV57 HJX");
  });

  it("maps AI advisor callback source label", () => {
    assert.equal(
      formatWorkshopSourceLabel("assistant", { intent: "callback" }),
      "AI Advisor — Callback"
    );
  });

  it("renders lead alerts with formatted phone banner and lead id", () => {
    const lead: Lead = {
      id: "lead_test_456",
      status: "new",
      name: "Alex Driver",
      phone: "07700900456",
      email: "alex@example.com",
      registration: "XY09 ZZZ",
      problemDescription: "Brakes squealing under load",
      source: "contact_form",
      createdAt: "2026-05-28T11:00:00.000Z",
      updatedAt: "2026-05-28T11:00:00.000Z",
    };

    const text = renderLeadAlertText(lead);
    assert.ok(text.includes(">>> CALL CUSTOMER <<<"));
    assert.ok(text.includes("Lead ID: lead_test_456"));
    assert.ok(text.includes("Phone number:           +44 7700 900 456"));
    assert.ok(text.includes("Source:                 Contact Form"));
    assert.ok(text.includes("Brakes squealing under load"));
  });
});

describe("getIntakeEmailRecipients", () => {
  it("parses comma-separated primary recipients", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.BOOKING_EMAIL_TO_SECONDARY;
    process.env.BOOKING_EMAIL_TO =
      "contact@danautocentre.co.uk,sales@danautocentre.co.uk,owner@gmail.com";

    const { getIntakeEmailRecipients } = await import("../lib/email/config.ts");
    assert.deepEqual(getIntakeEmailRecipients(), [
      "contact@danautocentre.co.uk",
      "sales@danautocentre.co.uk",
      "owner@gmail.com",
    ]);
  });

  it("merges secondary recipient and dedupes", async () => {
    process.env.NODE_ENV = "test";
    process.env.BOOKING_EMAIL_TO = "contact@danautocentre.co.uk";
    process.env.BOOKING_EMAIL_TO_SECONDARY = "owner@gmail.com,contact@danautocentre.co.uk";

    const { getIntakeEmailRecipients } = await import("../lib/email/config.ts");
    assert.deepEqual(getIntakeEmailRecipients(), [
      "contact@danautocentre.co.uk",
      "owner@gmail.com",
    ]);
  });

  it("renders phone banner with Not provided when phone missing", () => {
    const lines = renderWorkshopPhoneBannerText("Jane", "");
    assert.ok(lines.join("\n").includes(`Phone: ${NOT_PROVIDED}`));
  });
});
