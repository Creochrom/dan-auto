import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  formatWorkshopField,
  formatWorkshopSourceLabel,
  NOT_PROVIDED,
  renderWorkshopPhoneBannerText,
} from "../lib/email/templates/workshop-shared.ts";
import { renderWorkshopAlertText } from "../lib/email/templates/booking-alert.ts";
import { renderLeadAlertText } from "../lib/email/templates/lead-alert.ts";
import type { Booking } from "../lib/types/booking.ts";
import type { Lead } from "../lib/types/lead.ts";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("workshop email templates", () => {
  it("uses Not provided for empty fields", () => {
    assert.equal(formatWorkshopField(""), NOT_PROVIDED);
    assert.equal(formatWorkshopField(undefined), NOT_PROVIDED);
  });

  it("puts phone banner at the top of direct booking alerts", () => {
    const booking: Booking = {
      id: "bk_test_123",
      status: "new",
      service: "MOT",
      registration: "AB12 CDE",
      preferredDate: "2026-06-01",
      preferredTime: "09:00",
      duration: "1h",
      customerName: "Jane Smith",
      customerPhone: "07700900123",
      customerEmail: "jane@example.com",
      notes: "Noise from front",
      source: "website",
      createdAt: "2026-05-28T10:00:00.000Z",
      updatedAt: "2026-05-28T10:00:00.000Z",
    };

    const text = renderWorkshopAlertText(booking);
    assert.ok(text.includes("New Booking Request"));
    assert.ok(text.includes(">>> CALL CUSTOMER <<<"));
    assert.ok(text.indexOf(">>> CALL CUSTOMER <<<") < text.indexOf("CUSTOMER DETAILS"));
    assert.ok(text.includes("Booking ID: bk_test_123"));
    assert.ok(text.includes("Phone number:           07700900123"));
    assert.ok(text.includes("Source:                 Quick Booking"));
  });

  it("maps AI advisor callback source label", () => {
    assert.equal(
      formatWorkshopSourceLabel("assistant", { intent: "callback" }),
      "AI Advisor — Callback"
    );
  });

  it("renders lead alerts with phone banner and lead id", () => {
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
    assert.ok(text.includes("Phone number:           07700900456"));
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
