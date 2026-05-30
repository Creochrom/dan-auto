import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  defaultPreferences,
  hasCookieConsentDecision,
  readCookiePreferences,
  writeCookiePreferences,
} from "../lib/cookies/consent.ts";

describe("cookie consent storage", () => {
  it("defaults accept-all to analytics and functional enabled", () => {
    const prefs = defaultPreferences("all");
    assert.equal(prefs.analytics, true);
    assert.equal(prefs.functional, true);
    assert.equal(prefs.essential, true);
  });

  it("reject non-essential disables optional categories", () => {
    const prefs = defaultPreferences("essential_only");
    assert.equal(prefs.analytics, false);
    assert.equal(prefs.functional, false);
  });

  it("persists and reads consent from storage", () => {
    const store = new Map<string, string>();
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    });

    try {
      assert.equal(hasCookieConsentDecision(), false);
      writeCookiePreferences(defaultPreferences("all"));
      assert.equal(hasCookieConsentDecision(), true);
      const saved = readCookiePreferences();
      assert.equal(saved?.level, "all");
      assert.ok(store.has(COOKIE_CONSENT_STORAGE_KEY));
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: original,
      });
    }
  });
});
