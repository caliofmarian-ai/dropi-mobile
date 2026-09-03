import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "./_core/env";

export type OneTimeCodePurpose = "email-verification" | "password-reset";

const HASH_PREFIX = "otc1:";
const TEST_ONLY_SECRET = "dropi-test-only-one-time-code-secret";

function resolveLifecycleSecret(explicitSecret?: string): string {
  const secret = (explicitSecret ?? process.env.JWT_SECRET ?? ENV.cookieSecret ?? "").trim();
  if (secret) return secret;

  // Repository regression suites intentionally run without deployment secrets.
  // This deterministic value is reachable only in NODE_ENV=test; production and
  // development runtime remain fail-closed when JWT_SECRET is absent.
  if (process.env.NODE_ENV === "test") return TEST_ONLY_SECRET;

  throw new Error("JWT_SECRET is required for DROPi one-time-code protection");
}

function oneTimeCodeDigest(
  purpose: OneTimeCodePurpose,
  code: string,
  explicitSecret?: string,
): string {
  return createHmac("sha256", resolveLifecycleSecret(explicitSecret))
    .update(`${purpose}\0${code}`, "utf8")
    .digest("hex");
}

export function hashOneTimeCode(
  purpose: OneTimeCodePurpose,
  code: string,
  explicitSecret?: string,
): string {
  return `${HASH_PREFIX}${oneTimeCodeDigest(purpose, code, explicitSecret)}`;
}

export function verifyOneTimeCode(
  storedValue: string | null | undefined,
  purpose: OneTimeCodePurpose,
  candidate: string,
  explicitSecret?: string,
): boolean {
  if (!storedValue || !candidate) return false;

  // Transitional compatibility: codes issued before IMPL-007 were stored as
  // six plaintext digits. They remain usable only until their existing expiry.
  if (!storedValue.startsWith(HASH_PREFIX)) {
    const stored = Buffer.from(storedValue, "utf8");
    const supplied = Buffer.from(candidate, "utf8");
    return stored.length === supplied.length && timingSafeEqual(stored, supplied);
  }

  const expected = Buffer.from(storedValue.slice(HASH_PREFIX.length), "hex");
  const actual = Buffer.from(oneTimeCodeDigest(purpose, candidate, explicitSecret), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isOneTimeCodeExpired(
  expiry: Date | string | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!expiry) return true;
  const expiryMs = new Date(expiry).getTime();
  return !Number.isFinite(expiryMs) || expiryMs <= nowMs;
}

export function shouldThrottleVerificationResend(
  storedCode: string | null | undefined,
  expiry: Date | string | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!storedCode || !expiry) return false;
  const expiryMs = new Date(expiry).getTime();
  if (!Number.isFinite(expiryMs)) return false;

  // Verification codes live for 30 minutes. More than 29 minutes remaining
  // means the previous code was issued less than one minute ago.
  return expiryMs - nowMs > 29 * 60 * 1000;
}
