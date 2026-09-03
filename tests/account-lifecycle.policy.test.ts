import { describe, expect, it } from "vitest";
import {
  hashOneTimeCode,
  isOneTimeCodeExpired,
  shouldThrottleVerificationResend,
  verifyOneTimeCode,
} from "../server/account-lifecycle";

const SECRET = "unit-test-lifecycle-secret";

describe("DROPi account lifecycle one-time-code policy", () => {
  it("stores a keyed digest instead of the six-digit credential", () => {
    const stored = hashOneTimeCode("password-reset", "123456", SECRET);

    expect(stored).toMatch(/^otc1:[0-9a-f]{64}$/);
    expect(stored).not.toContain("123456");
    expect(verifyOneTimeCode(stored, "password-reset", "123456", SECRET)).toBe(true);
    expect(verifyOneTimeCode(stored, "password-reset", "654321", SECRET)).toBe(false);
  });

  it("separates verification and password-reset credential purposes", () => {
    const verification = hashOneTimeCode("email-verification", "123456", SECRET);
    const recovery = hashOneTimeCode("password-reset", "123456", SECRET);

    expect(verification).not.toBe(recovery);
    expect(verifyOneTimeCode(verification, "password-reset", "123456", SECRET)).toBe(false);
  });

  it("keeps only expiring legacy plaintext codes valid during transition", () => {
    expect(verifyOneTimeCode("123456", "email-verification", "123456", SECRET)).toBe(true);
    expect(verifyOneTimeCode("123456", "email-verification", "123457", SECRET)).toBe(false);
  });

  it("fails closed when expiry is missing, malformed, or elapsed", () => {
    const now = Date.parse("2026-09-03T20:00:00.000Z");
    expect(isOneTimeCodeExpired(null, now)).toBe(true);
    expect(isOneTimeCodeExpired("not-a-date", now)).toBe(true);
    expect(isOneTimeCodeExpired("2026-09-03T20:00:00.000Z", now)).toBe(true);
    expect(isOneTimeCodeExpired("2026-09-03T20:00:01.000Z", now)).toBe(false);
  });

  it("throttles verification resends only during the first minute", () => {
    const now = Date.parse("2026-09-03T20:00:00.000Z");
    const freshExpiry = new Date(now + 29 * 60 * 1000 + 1);
    const oldEnoughExpiry = new Date(now + 29 * 60 * 1000);

    expect(shouldThrottleVerificationResend("otc1:stored", freshExpiry, now)).toBe(true);
    expect(shouldThrottleVerificationResend("otc1:stored", oldEnoughExpiry, now)).toBe(false);
    expect(shouldThrottleVerificationResend(null, freshExpiry, now)).toBe(false);
  });
});
