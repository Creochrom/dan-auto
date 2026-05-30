import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPhoneDisplay,
  phoneTelHref,
  toUkE164Digits,
} from "../lib/format-contact.ts";

describe("phone display helpers", () => {
  it("normalises stored digits to UK display", () => {
    assert.equal(formatPhoneDisplay("447850964041"), "+44 7850 964041");
    assert.equal(formatPhoneDisplay("07850964041"), "+44 7850 964041");
    assert.equal(formatPhoneDisplay("+44 7850 964041"), "+44 7850 964041");
  });

  it("builds tel links with leading plus", () => {
    assert.equal(phoneTelHref("447850964041"), "tel:+447850964041");
    assert.equal(phoneTelHref("+44 7850 964041"), "tel:+447850964041");
    assert.equal(toUkE164Digits("07850964041"), "447850964041");
  });
});
