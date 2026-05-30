import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractAssistantMessageField,
  parseGeminiResponse,
} from "../lib/services/gemini-json-parse.ts";

/** Example malformed payload — missing comma between properties (reported in production). */
const MISSING_COMMA_PAYLOAD = `{
  "assistantMessage": "Here's your booking summary for Today at 3:00 PM. Does everything look correct?"
  "intakeComplete": true,
  "structuredIntake": {
    "intent": "book",
    "preferredBookingTime": "Today at 3:00 PM",
    "customer": { "name": "James Smith", "contact": "07850964041" }
  },
  "suggestionChips": [
    { "id": "booking-confirm-send", "label": "Send booking request", "message": "Yes, please send my booking request" }
  ]
}`;

/** Example truncated payload — unterminated assistantMessage string. */
const UNTERMINATED_STRING_PAYLOAD = `{
  "assistantMessage": "Here's your booking summary for Today at 3:00 PM. Please confirm if you'd like me to send this to the workshop.
  "intakeComplete": true,
  "structuredIntake": {
    "intent": "book",
    "preferredBookingTime": "Today at 3:00 PM"
  }
}`;

describe("gemini JSON parse recovery", () => {
  it("recovers from missing comma between JSON properties", () => {
    assert.throws(() => JSON.parse(MISSING_COMMA_PAYLOAD));

    const result = parseGeminiResponse(MISSING_COMMA_PAYLOAD);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.match(result.payload.assistantMessage, /booking summary/i);
    assert.equal(result.payload.intakeComplete, true);
    assert.notEqual(result.strategy, "direct");
  });

  it("recovers from unterminated assistantMessage string", () => {
    assert.throws(() => JSON.parse(UNTERMINATED_STRING_PAYLOAD));

    const result = parseGeminiResponse(UNTERMINATED_STRING_PAYLOAD);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.match(result.payload.assistantMessage, /booking summary/i);
  });

  it("extracts assistantMessage via regex when object is truncated mid-string", () => {
    const raw = `{"assistantMessage": "Summary for Today at 3:00 PM — ready to send?`;
    const message = extractAssistantMessageField(raw);
    assert.ok(message);
    assert.match(message!, /Summary for Today/i);
  });

  it("parses valid JSON via direct strategy", () => {
    const raw = JSON.stringify({
      assistantMessage: "All set — tap Send booking request when ready.",
      intakeComplete: true,
    });
    const result = parseGeminiResponse(raw);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.strategy, "direct");
    assert.match(result.payload.assistantMessage, /Send booking request/i);
  });

  it("logs parse failure shape when recovery is impossible", () => {
    const result = parseGeminiResponse("not json at all");
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /assistantMessage|parse|direct/i);
  });
});
