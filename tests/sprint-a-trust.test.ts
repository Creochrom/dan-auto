import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripPricingFiller } from "@/lib/chat/pricing-output";
import { prepareCustomerFacingTurn } from "@/lib/chat/customer-facing";
import { resolveSystemBanner } from "@/lib/config/system-status-copy";

describe("pricing filler removal", () => {
  it("strips generic AI filler phrases", () => {
    const raw =
      "0L Diesel depends on the specific component. Local pricing varies. Inspection is required.";
    const cleaned = stripPricingFiller(raw);
    assert.equal(/depends on the specific component/i.test(cleaned), false);
    assert.equal(/local pricing varies/i.test(cleaned), false);
    assert.equal(/inspection is required/i.test(cleaned), false);
  });
});

describe("semantic label stripping", () => {
  it("removes INFO ESTIMATE QUESTION labels from customer copy", () => {
    const raw = [
      "INFO: Brake pad wear varies by axle.",
      "ESTIMATE: £120–£280 for front pads.",
      "QUESTION: Is the noise mainly when braking?",
    ].join("\n");

    const out = prepareCustomerFacingTurn(raw);
    assert.equal(/INFO:/i.test(out), false);
    assert.equal(/ESTIMATE:/i.test(out), false);
    assert.equal(/QUESTION:/i.test(out), false);
    assert.match(out, /£120–£280/);
    assert.match(out, /when braking/i);
  });
});

describe("system status banner", () => {
  it("shows amber sending state for booking", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sending",
      conciergeMode: "booking",
      uploadsInProgress: false,
      isTyping: false,
    });
    assert.equal(banner?.variant, "pending");
    assert.match(banner!.message, /Sending booking request/i);
  });

  it("shows green success for callback", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sent",
      conciergeMode: "callback",
      uploadsInProgress: false,
      isTyping: false,
    });
    assert.equal(banner?.variant, "success");
    assert.match(banner!.message, /Callback request received/i);
  });

  it("shows green booking success copy with workshop follow-up", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sent",
      conciergeMode: "booking",
      uploadsInProgress: false,
      isTyping: false,
      handoffMeta: { bookingId: "bk_test123", notificationSent: true },
    });
    assert.equal(banner?.variant, "success");
    assert.match(banner!.message, /Booking request received/i);
    assert.match(banner!.message, /Reference: bk_test123/i);
    assert.match(banner!.message, /workshop has received your request/i);
  });

  it("shows callback success with lead reference when provided", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sent",
      conciergeMode: "callback",
      uploadsInProgress: false,
      isTyping: false,
      handoffMeta: { leadId: "lead_abc", submittedAt: "2026-05-30T10:00:00.000Z" },
    });
    assert.equal(banner?.variant, "success");
    assert.match(banner!.message, /lead_abc/);
  });

  it("shows red error with retry message", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "error",
      conciergeMode: "booking",
      uploadsInProgress: false,
      isTyping: false,
    });
    assert.equal(banner?.variant, "error");
    assert.match(banner!.message, /Request not sent/i);
  });
});
