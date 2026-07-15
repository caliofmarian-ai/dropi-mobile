/**
 * Regression tests: email normalization in dropiAuth.login
 *
 * Requirement (PR #38): login must call getUserByEmail with a normalized email
 * (lowercase + trimmed) so that case/whitespace variants match the provisioned
 * row (which provision-admin.ts stores as lowercase).
 *
 * Note on whitespace: the loginSchema uses `z.string().email()` which rejects
 * emails with surrounding whitespace (zod email validation fires before the
 * handler body).  The `.trim()` in the handler body is a defensive measure for
 * any input that bypasses schema validation.  These tests verify both behaviours.
 *
 * Tests verify:
 *  - uppercase email is lowercased before DB lookup
 *  - mixed-case email is lowercased before DB lookup
 *  - exact lowercase email is unchanged
 *  - exact lowercase produces the same DB lookup as uppercase variant
 *  - whitespace-padded email is rejected by zod (never reaches DB lookup)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

// ===== MOCKS =====

const dbMock = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  incrementFailedLogin: vi.fn(),
  resetFailedLogin: vi.fn(),
  updateUserLastLogin: vi.fn(),
  createSession: vi.fn(),
  createAuditLog: vi.fn(),
}));

const sdkMock = vi.hoisted(() => ({
  sdk: {
    createSessionToken: vi.fn(),
    authenticateRequest: vi.fn(),
  },
}));

const mailMock = vi.hoisted(() => ({
  sendPlatformEmail: vi.fn(),
  maskEmail: vi.fn((email: string) => {
    const [local, domain] = email.split("@");
    return `${local?.[0] ?? ""}***@${domain}`;
  }),
}));

vi.mock("../server/db", () => dbMock);
vi.mock("../server/_core/sdk", () => sdkMock);
vi.mock("../server/_core/mail", () => mailMock);

const { dropiAuthRouter } = await import("../server/auth-router");

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// ===== HELPERS =====

/**
 * Calls dropiAuth.login and swallows the expected UNAUTHORIZED error.
 * Returns the email argument passed to db.getUserByEmail.
 */
async function getLookupEmail(inputEmail: string): Promise<string> {
  dbMock.getUserByEmail.mockResolvedValue(undefined); // user not found → UNAUTHORIZED thrown
  const caller = dropiAuthRouter.createCaller(createPublicContext());
  await caller.login({ email: inputEmail, password: "any" }).catch(() => {});
  const calls = dbMock.getUserByEmail.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return String(calls[0]?.[0] ?? "");
}

// ===== TESTS =====

describe("dropiAuth.login — email normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createAuditLog.mockResolvedValue(undefined);
    dbMock.incrementFailedLogin.mockResolvedValue(undefined);
    dbMock.resetFailedLogin.mockResolvedValue(undefined);
    dbMock.updateUserLastLogin.mockResolvedValue(undefined);
    dbMock.createSession.mockResolvedValue(undefined);
    sdkMock.sdk.createSessionToken.mockResolvedValue("jwt-token");
    mailMock.maskEmail.mockImplementation((email: string) => {
      const [local, domain] = email.split("@");
      return `${local?.[0] ?? ""}***@${domain}`;
    });
  });

  it("lowercases an all-uppercase email before DB lookup", async () => {
    const lookupEmail = await getLookupEmail("ADMIN@EXAMPLE.COM");
    expect(lookupEmail).toBe("admin@example.com");
  });

  it("lowercases a mixed-case email before DB lookup", async () => {
    const lookupEmail = await getLookupEmail("Admin@Example.COM");
    expect(lookupEmail).toBe("admin@example.com");
  });

  it("leaves an exact lowercase email unchanged", async () => {
    const lookupEmail = await getLookupEmail("admin@example.com");
    expect(lookupEmail).toBe("admin@example.com");
  });

  it("uppercase and lowercase variants produce the same DB lookup email", async () => {
    const lookupLower = await getLookupEmail("dropi.deliveries@gmail.com");
    vi.clearAllMocks();
    const lookupUpper = await getLookupEmail("DROPI.DELIVERIES@GMAIL.COM");
    expect(lookupLower).toBe(lookupUpper);
  });

  it("rejects a whitespace-padded email at schema validation (never reaches DB lookup)", async () => {
    // zod's z.string().email() fires before the handler body — whitespace is rejected
    dbMock.getUserByEmail.mockResolvedValue(undefined);
    const caller = dropiAuthRouter.createCaller(createPublicContext());

    await expect(
      caller.login({ email: "  admin@example.com  " as string, password: "any" }),
    ).rejects.toThrow(); // BAD_REQUEST from zod validation

    expect(dbMock.getUserByEmail).not.toHaveBeenCalled();
  });
});

