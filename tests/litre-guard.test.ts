import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCorruptEnginePhrases,
  sanitizeEngineReferencesInText,
  splitIntoSentences,
} from "@/lib/chat/litre-guard";
import {
  finalizeAssistantChunks,
  sanitizeAssistantPipeline,
} from "@/lib/chat/assistant-output";
import { engineLabelFromCapacity } from "@/lib/vehicle-engine-display";
import { vehicleSnapshotFromLegacy } from "@/lib/services/advisor-routing-prompt";

const INVALID_ZERO_ENGINE = /(?<!\d\.)0L\s+(Diesel|Petrol)\b/i;

const DISPLACEMENTS = [
  { cc: 1000, fuel: "Petrol", label: "1.0L Petrol" },
  { cc: 1200, fuel: "Petrol", label: "1.2L Petrol" },
  { cc: 1398, fuel: "Petrol", label: "1.4L Petrol" },
  { cc: 1598, fuel: "Petrol", label: "1.6L Petrol" },
  { cc: 2000, fuel: "Diesel", label: "2.0L Diesel" },
  { cc: 3000, fuel: "Petrol", label: "3.0L Petrol" },
  { cc: 4000, fuel: "Petrol", label: "4.0L Petrol" },
] as const;

describe("engine trust — DVLA labels", () => {
  for (const { cc, fuel, label } of DISPLACEMENTS) {
    it(`${cc}cc formats as ${label}`, () => {
      assert.equal(engineLabelFromCapacity(cc, fuel), label);
    });
  }
});

describe("engine trust — corruption repair", () => {
  for (const { label } of DISPLACEMENTS) {
    it(`builds corrupt variants for ${label}`, () => {
      assert.ok(buildCorruptEnginePhrases(label).length > 0);
    });

    it(`repairs 0L variant for ${label}`, () => {
      const fuel = label.replace(/^[\d.]+L\s/, "");
      const raw = `0L ${fuel} — pads are commonly £120–£250.`;
      const fixed = sanitizeEngineReferencesInText(raw, label);
      assert.match(fixed, new RegExp(label.replace(".", "\\.")));
      assert.equal(INVALID_ZERO_ENGINE.test(fixed), false);
    });

    it(`pipeline preserves ${label} in long reply`, () => {
      const raw = `For your 2007 ${label}, brake pads on one axle are usually around £120–£250. When do you hear the squeaking?`;
      const { sanitized, rendered } = sanitizeAssistantPipeline(raw, {
        canonicalEngine: label,
      });
      assert.match(sanitized, new RegExp(label.replace(".", "\\.")));
      assert.equal(INVALID_ZERO_ENGINE.test(sanitized), false);
      for (const chunk of rendered) {
        assert.equal(INVALID_ZERO_ENGINE.test(chunk), false, chunk);
      }
    });
  }

  it("repairs 4L Petrol to 1.4L Petrol", () => {
    const fixed = sanitizeEngineReferencesInText(
      "4L Petrol timing belt jobs are commonly £350–£600.",
      "1.4L Petrol"
    );
    assert.match(fixed, /1\.4L Petrol/);
    assert.equal(/(?<!\d\.)4L Petrol\b/.test(fixed), false);
  });

  it("repairs production 0L Diesel Gemini output", () => {
    const raw = "0L Diesel depends on the specific component and local pricing.";
    const { sanitized, rendered } = sanitizeAssistantPipeline(raw, {
      canonicalEngine: "2.0L Diesel",
    });
    assert.match(sanitized, /2\.0L Diesel/);
    assert.equal(INVALID_ZERO_ENGINE.test(sanitized), false);
    for (const chunk of rendered) {
      assert.equal(INVALID_ZERO_ENGINE.test(chunk), false, chunk);
    }
  });

  it("omits 0L when no canonical engine", () => {
    const fixed = sanitizeEngineReferencesInText(
      "0L Diesel depends on the specific component."
    );
    assert.equal(INVALID_ZERO_ENGINE.test(fixed), false);
  });

  it("sentence split preserves 2.0L", () => {
    const text =
      "For your 2007 2.0L Diesel, brake pad replacement on one axle is commonly £120–£250. When do you hear the squeaking most often?";
    const sentences = splitIntoSentences(text);
    assert.equal(sentences.some((s) => s.includes("2.0L Diesel")), true);
    assert.equal(sentences.some((s) => INVALID_ZERO_ENGINE.test(s)), false);
  });

  it("legacy vehicle meta seeds engine for advisor route", () => {
    const snap = vehicleSnapshotFromLegacy({
      reg: "AB12 CDE",
      makeModel: "BMW 320d",
      meta: "2007 • Diesel • 2.0L",
    });
    assert.equal(snap.engine, "2.0L Diesel");
  });
});

describe("pricing render — two bubbles max", () => {
  it("splits estimate and question into two chunks", () => {
    const raw =
      "Brake pads on one axle are usually around £120–£250.\n\nWhen do you hear the squeaking?";
    const chunks = finalizeAssistantChunks(raw, { pricingMode: true });
    assert.equal(chunks.length, 2);
    assert.match(chunks[0]!, /£120–£250/);
    assert.match(chunks[1]!, /squeaking/);
  });
});
