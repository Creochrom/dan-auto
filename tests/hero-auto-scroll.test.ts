import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HERO_RIBBON_TRAVEL_MS,
  heroRibbonPhaseForScrollLeft,
  heroRibbonScrollLeftForPhase,
} from "../lib/hero-auto-scroll.ts";

describe("heroRibbonScrollLeftForPhase", () => {
  const max = 400;

  it("uses a 25s one-way travel duration constant", () => {
    assert.ok(HERO_RIBBON_TRAVEL_MS >= 20_000);
    assert.ok(HERO_RIBBON_TRAVEL_MS <= 30_000);
  });

  it("forward mode starts at the left edge", () => {
    assert.equal(heroRibbonScrollLeftForPhase(0, max, "forward"), 0);
  });

  it("forward mode reaches the right edge at half cycle", () => {
    assert.ok(Math.abs(heroRibbonScrollLeftForPhase(1, max, "forward") - max) < 0.001);
  });

  it("reverse mode starts at the right edge", () => {
    assert.ok(Math.abs(heroRibbonScrollLeftForPhase(0, max, "reverse") - max) < 0.001);
  });

  it("reverse mode reaches the left edge at half cycle", () => {
    assert.ok(Math.abs(heroRibbonScrollLeftForPhase(1, max, "reverse")) < 0.001);
  });

  it("returns zero when there is no overflow", () => {
    assert.equal(heroRibbonScrollLeftForPhase(0.5, 0, "forward"), 0);
  });
});

describe("heroRibbonPhaseForScrollLeft", () => {
  const max = 400;

  it("round-trips forward motion at cycle start", () => {
    const phase = heroRibbonPhaseForScrollLeft(0, max, "forward", 0);
    assert.ok(Math.abs(heroRibbonScrollLeftForPhase(phase, max, "forward")) < 0.001);
  });

  it("round-trips reverse motion at cycle start", () => {
    const phase = heroRibbonPhaseForScrollLeft(max, max, "reverse", 0);
    assert.ok(Math.abs(heroRibbonScrollLeftForPhase(phase, max, "reverse") - max) < 0.001);
  });
});
