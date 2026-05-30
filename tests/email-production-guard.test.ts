import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertProductionEmailDelivery } from "@/lib/email/config";

describe("production email delivery guard", () => {
  it("allows log provider in development", () => {
    const prevEnv = process.env.NODE_ENV;
    const prevProvider = process.env.EMAIL_PROVIDER;
    process.env.NODE_ENV = "development";
    process.env.EMAIL_PROVIDER = "log";
    assert.doesNotThrow(() => assertProductionEmailDelivery());
    process.env.NODE_ENV = prevEnv;
    process.env.EMAIL_PROVIDER = prevProvider;
  });

  it("blocks log provider in production", () => {
    const prevEnv = process.env.NODE_ENV;
    const prevProvider = process.env.EMAIL_PROVIDER;
    const prevKey = process.env.RESEND_API_KEY;
    process.env.NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "log";
    delete process.env.RESEND_API_KEY;
    assert.throws(() => assertProductionEmailDelivery(), /EMAIL_PROVIDER=log/);
    process.env.NODE_ENV = prevEnv;
    process.env.EMAIL_PROVIDER = prevProvider;
    process.env.RESEND_API_KEY = prevKey;
  });
});
