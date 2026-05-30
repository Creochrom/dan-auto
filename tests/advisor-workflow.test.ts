import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPlaceholderContactInput,
  isPlaceholderName,
  isPlaceholderPhone,
  validateCustomerName,
  validateCustomerPhone,
  validateLeadContact,
} from "../lib/validation/advisor-contact.ts";
import {
  applyPricingTerminalIntent,
  enforceHandoffWorkflowChips,
  enforcePricingModeTurn,
  formatPricingTerminalContent,
  isHandoffClaimAllowed,
  pricingEstimateReady,
  sanitizeAssistantContactPlaceholders,
  validateLeadCompletion,
} from "../lib/services/advisor-workflow.ts";
import { BOOKING_CONFIRM_CHIP_ID } from "../lib/config/booking-flow-copy.ts";
import { CALLBACK_CONFIRM_CHIP_ID } from "../lib/config/callback-flow-copy.ts";
import { mergeStructuredIntake } from "../lib/services/intake-mapper.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";

describe("advisor contact validation", () => {
  it("rejects placeholder names and phones", () => {
    assert.equal(isPlaceholderName("My name and number"), true);
    assert.equal(isPlaceholderName("Call me"), true);
    assert.equal(isPlaceholderName("You already have my details"), true);
    assert.equal(isPlaceholderName("Use the same number"), true);
    assert.equal(isPlaceholderPhone("WhatsApp is best"), true);
    assert.equal(isPlaceholderPhone("Call me"), true);
    assert.equal(isPlaceholderPhone("WhatsApp me"), true);
    assert.equal(isPlaceholderPhone("You already have my number"), true);
    assert.equal(isPlaceholderPhone("Use the same number as before"), true);
    assert.equal(isPlaceholderContactInput("You already have my details"), true);
    assert.equal(isPlaceholderContactInput("Use the same number"), true);
  });

  it("accepts real name and UK mobile", () => {
    const name = validateCustomerName("James Smith");
    const phone = validateCustomerPhone("07850 964 041");
    assert.equal(name.valid, true);
    assert.equal(phone.valid, true);
    assert.equal(validateLeadContact("James Smith", "07850 964 041").canSubmit, true);
  });

  it("rejects invalid contact pairs", () => {
    assert.equal(
      validateLeadContact("My name and number", "07850 964 041").canSubmit,
      false
    );
    assert.equal(validateLeadContact("James Smith", "WhatsApp is best").canSubmit, false);
  });
});

describe("advisor workflow modes", () => {
  it("pricing mode never allows submit", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      aiEstimate: {
        ...createEmptyStructuredIntake().aiEstimate,
        estimatedPriceRange: "£80–£350",
      },
      customer: { name: "James Smith", contact: "07850964041" },
    };
    const result = validateLeadCompletion("pricing", intake, {
      name: "James Smith",
      phone: "07850964041",
    });
    assert.equal(result.canSubmit, false);
    assert.equal(pricingEstimateReady(intake), true);
  });

  it("callback requires valid contact and issue context", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Brake noise"],
      },
      customer: { name: "James Smith", contact: "07850964041" },
    };
    const ok = validateLeadCompletion("callback", intake, {
      name: "James Smith",
      phone: "07850964041",
    });
    assert.equal(ok.canSubmit, true);

    const bad = validateLeadCompletion("callback", intake, {
      name: "Call me",
      phone: "07850964041",
    });
    assert.equal(bad.canSubmit, false);
  });

  it("booking requires service, day and time", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      preferredBookingTime: "",
      customer: { name: "James Smith", contact: "07850964041" },
    };
    const incomplete = validateLeadCompletion("booking", intake, {
      name: "James Smith",
      phone: "07850964041",
    });
    assert.equal(incomplete.canSubmit, false);

    intake.preferredBookingTime = "Tomorrow morning";
    const missingService = validateLeadCompletion("booking", intake, {
      name: "James Smith",
      phone: "07850964041",
      preferredDate: "Tomorrow",
      callbackWindow: "Morning",
    });
    assert.equal(missingService.canSubmit, false);

    const complete = validateLeadCompletion("booking", intake, {
      name: "James Smith",
      phone: "07850964041",
      problemDescription: "MOT",
      preferredDate: "Tomorrow",
      callbackWindow: "Morning",
    });
    assert.equal(complete.canSubmit, true);
  });

  it("offers pricing next actions after estimate", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      aiEstimate: {
        ...createEmptyStructuredIntake().aiEstimate,
        estimatedPriceRange: "£120–£280",
      },
    };
    const turn = enforcePricingModeTurn({
      mode: "pricing",
      intake,
      content: "ESTIMATE: £120–£280 typical for front brake pads.",
      handoffAllowed: false,
    });
    assert.deepEqual(turn.chips?.map((c) => c.id), [
      "pricing-action-book",
      "pricing-action-callback",
      "pricing-action-question",
    ]);
  });

  it("softens premature completion claims in pricing mode", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      aiEstimate: {
        ...createEmptyStructuredIntake().aiEstimate,
        estimatedPriceRange: "£120–£280",
      },
    };
    const turn = enforcePricingModeTurn({
      mode: "pricing",
      intake,
      content: "Your booking is confirmed for tomorrow morning.",
      handoffAllowed: false,
    });
    assert.equal(turn.content.toLowerCase().includes("confirmed"), false);
    assert.deepEqual(turn.chips?.map((c) => c.id), [
      "pricing-action-book",
      "pricing-action-callback",
      "pricing-action-question",
    ]);
  });

  it("strips labels and choose-below boilerplate from terminal pricing content", () => {
    const formatted = formatPricingTerminalContent(
      "ESTIMATE: £120–£280\nQUESTION: Is the noise from the front or rear?\n\nChoose below — book an appointment."
    );
    assert.equal(/choose below/i.test(formatted), false);
    assert.equal(/QUESTION:/i.test(formatted), false);
    assert.equal(/ESTIMATE:/i.test(formatted), false);
    assert.match(formatted, /£120–£280/);
  });

  it("locks pricing intent to quote after estimate", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      intent: "book" as const,
      aiEstimate: {
        ...createEmptyStructuredIntake().aiEstimate,
        estimatedPriceRange: "£80–£200",
      },
    };
    const locked = applyPricingTerminalIntent(intake);
    assert.equal(locked.intent, "book");

    intake.intent = "";
    const quoted = applyPricingTerminalIntent(intake);
    assert.equal(quoted.intent, "quote");
  });

  it("blocks handoff confirm chips until contact validates", () => {
    const chips = enforceHandoffWorkflowChips({
      mode: "callback",
      validation: validateLeadCompletion("callback", createEmptyStructuredIntake(), {}),
      handoffAllowed: false,
      chips: [
        { id: "callback-confirm-send", label: "Send request", message: "Send it" },
        { id: "callback-time-asap", label: "ASAP", message: "ASAP please" },
        { id: "cb-general", label: "General", message: "General question" },
      ],
    });
    assert.deepEqual(chips?.map((c) => c.id), ["cb-general"]);
  });

  it("strips bracket contact placeholders when contact is invalid", () => {
    const text = sanitizeAssistantContactPlaceholders(
      "Thanks [Your Name] — we'll call [Your Mobile Number].",
      validateLeadCompletion("callback", createEmptyStructuredIntake(), {})
    );
    assert.equal(text.includes("[Your"), false);
    assert.match(text, /full name/i);
  });

  it("mergeStructuredIntake ignores placeholder contact from model", () => {
    const merged = mergeStructuredIntake(
      createEmptyStructuredIntake(),
      {
        customer: { name: "My name and number", contact: "Call me" },
      }
    );
    assert.equal(merged.customer.name, "");
    assert.equal(merged.customer.contact, "");
  });

  it("allows handoff when canSubmit true regardless of Gemini intakeComplete", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      preferredBookingTime: "Saturday 11:00 AM",
      customer: { name: "James Smith", contact: "07850964041" },
    };
    const validation = validateLeadCompletion("booking", intake, {
      name: "James Smith",
      phone: "07850964041",
      problemDescription: "MOT",
      preferredDate: "Saturday",
      callbackWindow: "Morning",
    });
    assert.equal(validation.canSubmit, true);
    assert.equal(isHandoffClaimAllowed(validation), true);

    const chips = enforceHandoffWorkflowChips({
      mode: "booking",
      validation,
      handoffAllowed: isHandoffClaimAllowed(validation),
      chips: [
        {
          id: BOOKING_CONFIRM_CHIP_ID,
          label: "Send booking request",
          message: "Yes, please send my booking request",
        },
      ],
    });
    assert.deepEqual(chips?.map((c) => c.id), [BOOKING_CONFIRM_CHIP_ID]);
  });

  it("blocks handoff confirm chips when canSubmit false", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      preferredBookingTime: "",
      customer: { name: "James Smith", contact: "07850964041" },
    };
    const validation = validateLeadCompletion("booking", intake, {
      name: "James Smith",
      phone: "07850964041",
    });
    assert.equal(validation.canSubmit, false);
    assert.equal(isHandoffClaimAllowed(validation), false);

    const chips = enforceHandoffWorkflowChips({
      mode: "booking",
      validation,
      handoffAllowed: isHandoffClaimAllowed(validation),
      chips: [
        {
          id: BOOKING_CONFIRM_CHIP_ID,
          label: "Send booking request",
          message: "Yes, please send my booking request",
        },
      ],
    });
    assert.equal(chips, undefined);
  });

  it("allows callback handoff chip when canSubmit true without Gemini intakeComplete", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Brake noise"],
      },
      customer: { name: "James Smith", contact: "07850964041" },
    };
    const validation = validateLeadCompletion("callback", intake, {
      name: "James Smith",
      phone: "07850964041",
    });
    assert.equal(isHandoffClaimAllowed(validation), true);

    const chips = enforceHandoffWorkflowChips({
      mode: "callback",
      validation,
      handoffAllowed: isHandoffClaimAllowed(validation),
      chips: [
        { id: CALLBACK_CONFIRM_CHIP_ID, label: "Send request", message: "Send it" },
      ],
    });
    assert.deepEqual(chips?.map((c) => c.id), [CALLBACK_CONFIRM_CHIP_ID]);
  });
});
