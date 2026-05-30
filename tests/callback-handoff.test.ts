import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  isAffirmativeCallbackConfirmation,
  isCallbackHandoffReady,
} from "../lib/services/callback-handoff.ts";
import { createEmptyStructuredIntake } from "../lib/types/structured-intake.ts";
import { chatRepository } from "../lib/repositories/chat.repository.ts";
import { aiIntakeService } from "../lib/services/ai-intake.service.ts";
import { createInitialIntakeState } from "../lib/services/service-advisor.engine.ts";
import {
  validateCustomerName,
  validateCustomerPhone,
  validateLeadContact,
} from "../lib/validation/advisor-contact.ts";
import { resolveSystemBanner } from "../lib/config/system-status-copy.ts";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("callback placeholder rejection", () => {
  it("rejects bracket placeholders before persistence", () => {
    for (const value of ["[name]", "[mobile number]", "[your number]", "[your name]"]) {
      assert.equal(validateCustomerName(value).valid, false, value);
      assert.equal(validateCustomerPhone(value).valid, false, value);
      assert.equal(validateLeadContact(value, value).canSubmit, false, value);
    }
  });
});

describe("callback handoff helpers", () => {
  it("detects affirmative callback confirmations", () => {
    assert.equal(isAffirmativeCallbackConfirmation("yes please"), true);
    assert.equal(isAffirmativeCallbackConfirmation("not yet"), false);
  });

  it("requires contact and issue context for callback handoff", () => {
    const intake = {
      ...createEmptyStructuredIntake(),
      issue: {
        ...createEmptyStructuredIntake().issue,
        symptoms: ["Brake noise"],
      },
    };
    const leadDraft = { name: "James Smith", phone: "07850964041" };
    assert.equal(isCallbackHandoffReady("callback", intake, leadDraft, "AB12CDE"), true);
    assert.equal(isCallbackHandoffReady("callback", createEmptyStructuredIntake(), {}, undefined), false);
  });
});

describe("callback intake submission", () => {
  it("creates lead and returns delivery metadata after workshop email", async () => {
    process.env.NODE_ENV = "development";
    const session = await chatRepository.create({
      intakeState: createInitialIntakeState(),
      structuredIntake: {
        ...createEmptyStructuredIntake(),
        intent: "callback",
        customer: { name: "James Smith", contact: "07850964041" },
        issue: {
          ...createEmptyStructuredIntake().issue,
          symptoms: ["Brake squeal"],
        },
      },
      leadDraft: {
        name: "James Smith",
        phone: "07850964041",
        callbackWindow: "Afternoon",
        registration: "AB12CDE",
      },
      advisorRoute: {
        entry_point: "hero_ai_assistant",
        intent: "general",
        surface: "hero_ai_assistant",
        concierge_mode: "callback",
        handoff_policy: "explicit_only",
      },
    });

    await chatRepository.appendMessage(session.id, "user", "Brake squeal when stopping");
    await chatRepository.appendMessage(session.id, "assistant", "When does it happen?");

    const result = await aiIntakeService.submit({
      chatSessionId: session.id,
      customerName: "James Smith",
      customerPhone: "07850964041",
      preferredCallbackTime: "Afternoon",
    });

    assert.ok(result.leadId.startsWith("lead_"));
    assert.ok(result.submittedAt);
    assert.equal(typeof result.emailSent, "boolean");
    assert.ok(result.emailId);
    assert.equal(result.summary.intent, "callback");
  });

  it("rejects placeholder contact at submission", async () => {
    const session = await chatRepository.create({
      structuredIntake: createEmptyStructuredIntake(),
      leadDraft: { name: "[name]", phone: "[mobile number]" },
    });

    await assert.rejects(
      () =>
        aiIntakeService.submit({
          chatSessionId: session.id,
          customerName: "[name]",
          customerPhone: "[mobile number]",
        }),
      /Valid name and UK phone/
    );
  });
});

describe("callback success banner", () => {
  it("includes lead reference and timestamp on success", () => {
    const banner = resolveSystemBanner({
      intakeSubmitState: "sent",
      conciergeMode: "callback",
      uploadsInProgress: false,
      isTyping: false,
      handoffMeta: {
        leadId: "lead_test_123",
        submittedAt: "2026-05-30T14:30:00.000Z",
        emailSent: true,
      },
    });
    assert.equal(banner?.variant, "success");
    assert.match(banner!.message, /Callback request received/i);
    assert.match(banner!.message, /lead_test_123/);
    assert.match(banner!.message, /workshop has been notified/i);
  });
});
