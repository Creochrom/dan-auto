import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  splitAdvisorTurnIntoBubbles,
  stripAdvisorSemanticLabels,
} from "@/lib/chat/customer-facing";
import { splitAssistantContent } from "@/lib/chat/reveal";

describe("customer-facing assistant copy", () => {
  it("strips semantic labels from lines", () => {
    const raw = "INFO: Approximate pricing depends on inspection.\nESTIMATE: £120–£280 typical.";
    assert.equal(
      stripAdvisorSemanticLabels(raw),
      "Approximate pricing depends on inspection.\n£120–£280 typical."
    );
  });

  it("splits estimate and follow-up question into separate bubbles", () => {
    const raw = [
      "INFO: Brake pad wear varies by axle.",
      "ESTIMATE: £120–£280 for front pads at local rates.",
      "QUESTION: Is the noise mainly when braking?",
    ].join("\n");

    const bubbles = splitAdvisorTurnIntoBubbles(raw);
    assert.equal(bubbles.length, 3);
    assert.match(bubbles[0], /Brake pad wear/);
    assert.match(bubbles[1], /£120–£280/);
    assert.match(bubbles[2], /noise mainly/);
    assert.equal(bubbles.some((b) => /INFO:/i.test(b)), false);
    assert.equal(bubbles.some((b) => /ESTIMATE:/i.test(b)), false);
    assert.equal(bubbles.some((b) => /QUESTION:/i.test(b)), false);
  });

  it("splitAssistantContent uses semantic bubbles before paragraph fallback", () => {
    const chunks = splitAssistantContent(
      "ESTIMATE: £80–£150 indicative.\nQUESTION: Front or rear?"
    );
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0], "£80–£150 indicative.");
    assert.equal(chunks[1], "Front or rear?");
  });
});
