import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAffirmativeBookingConfirmation } from "../lib/services/booking-handoff.ts";
import {
  formatBookingReviewChatNudge,
  isReviewReopenRequest,
} from "../lib/services/booking-preview.ts";
import { BOOKING_REVIEW_HELPER } from "../lib/config/booking-flow-copy.ts";

describe("Release 0.2.8 booking confirmation step", () => {
  it("accepts explicit affirmative submission phrases", () => {
    assert.equal(isAffirmativeBookingConfirmation("Yes"), true);
    assert.equal(isAffirmativeBookingConfirmation("Send it"), true);
    assert.equal(isAffirmativeBookingConfirmation("Confirm booking"), true);
    assert.equal(isAffirmativeBookingConfirmation("Looks good"), true);
    assert.equal(isAffirmativeBookingConfirmation("Book it"), true);
    assert.equal(isAffirmativeBookingConfirmation("maybe tomorrow"), false);
  });

  it("includes helper text in review chat nudge", () => {
    const nudge = formatBookingReviewChatNudge();
    assert.match(nudge, /review your request/i);
    assert.match(nudge, new RegExp(BOOKING_REVIEW_HELPER.replace(/\./g, "\\.")));
  });

  it("detects review reopen requests after not now", () => {
    assert.equal(isReviewReopenRequest("I'd like to review booking"), true);
    assert.equal(isReviewReopenRequest("ready to send booking request"), true);
    assert.equal(isReviewReopenRequest("what time is my mot"), false);
  });
});
