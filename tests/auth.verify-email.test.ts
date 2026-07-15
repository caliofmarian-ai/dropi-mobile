import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const dbMock = vi.hoisted(() => ({
  getUserById: vi.fn(),
  setEmailVerifyToken: vi.fn(),
  markEmailVerified: vi.fn(),
  createAuditLog: vi.fn(),
}));

const mailMock = vi.hoisted(() => ({
  sendPlatformEmail: vi.fn(),
  maskEmail: vi.fn((email: string) => email),
}));

vi.mock("../server/db", () => dbMock);
vi.mock("../server/_core/mail", () => mailMock);

const { dropiAuthRouter } = await import("../server/auth-router");

function createUser(overrides: Partial<ReturnType<typeof _baseUser>> = {}) {
  return { ..._baseUser(), ...overrides };
}

function _baseUser() {
  return {
    id: 7,
    openId: "user-open-id",
    email: "user@example.com",
    name: "User Example",
    loginMethod: "email",
    role: "user" as const,
    dropiRole: "customer" as const,
    channel: "C1" as const,
    zone: null,
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    passwordHash: "hashed",
    resetToken: null,
    resetTokenExpiry: null,
    emailVerified: false,
    emailVerifyToken: "123456",
    emailVerifyExpires: new Date(Date.now() + 30 * 60 * 1000),
    isAIAgent: false,
    agentMode: null,
    humanPairId: null,
    lastIp: null,
    lastDevice: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    profilePhotoUrl: null,
  };
}

function createAuthContext(user = createUser()): TrpcContext {
  return {
    user,
    req: {
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

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

describe("dropiAuth verify-email protected flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createAuditLog.mockResolvedValue(undefined);
    dbMock.setEmailVerifyToken.mockResolvedValue(undefined);
    dbMock.markEmailVerified.mockResolvedValue(undefined);
    mailMock.sendPlatformEmail.mockResolvedValue(true);
  });

  it("lets a logged-in user verify their email with the active code", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    const result = await caller.verifyEmail({ code: "123456" });

    expect(result).toEqual({
      success: true,
      message: "Email verified successfully",
    });
    expect(dbMock.markEmailVerified).toHaveBeenCalledWith(7);
  });

  it("lets a logged-in user resend the verification email when provider delivers successfully", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    mailMock.sendPlatformEmail.mockResolvedValue(true);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    const result = await caller.resendVerificationCode();

    expect(result).toEqual({
      success: true,
      message: "Verification code sent",
    });
    expect(dbMock.setEmailVerifyToken).toHaveBeenCalledTimes(1);
    const [, issuedCode, issuedExpiry] = dbMock.setEmailVerifyToken.mock.calls[0];
    expect(issuedCode).toMatch(/^\d{6}$/);
    expect(issuedExpiry).toBeInstanceOf(Date);
    expect(mailMock.sendPlatformEmail).toHaveBeenCalledTimes(1);
  });

  it("throws INTERNAL_SERVER_ERROR when provider delivery fails", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    mailMock.sendPlatformEmail.mockResolvedValue(false);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.resendVerificationCode()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("Unable to send verification code"),
    });
    // Code was persisted before the failure
    expect(dbMock.setEmailVerifyToken).toHaveBeenCalledTimes(1);
    // Mail service was invoked
    expect(mailMock.sendPlatformEmail).toHaveBeenCalledTimes(1);
    // The procedure's own audit log (action: auth.resend_verification) is NOT written on delivery failure
    const auditCalls = dbMock.createAuditLog.mock.calls;
    const procedureAudit = auditCalls.find((c: any[]) => c[0]?.action === "auth.resend_verification");
    expect(procedureAudit).toBeUndefined();
  });

  it("throws INTERNAL_SERVER_ERROR when mail service is not configured (sendPlatformEmail not called / returns false)", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    // Simulate no transport configured: sendPlatformEmail returns false
    mailMock.sendPlatformEmail.mockResolvedValue(false);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.resendVerificationCode()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("throws INTERNAL_SERVER_ERROR when user has no email address", async () => {
    dbMock.getUserById.mockResolvedValue(createUser({ email: null as any }));
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.resendVerificationCode()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("No email address on file"),
    });
    expect(mailMock.sendPlatformEmail).not.toHaveBeenCalled();
  });

  it("does not log the verification code in any log output", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    mailMock.sendPlatformEmail.mockResolvedValue(true);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const caller = dropiAuthRouter.createCaller(createAuthContext());
    await caller.resendVerificationCode();

    const allLogs = [
      ...logSpy.mock.calls.map((c) => c.join(" ")),
      ...errorSpy.mock.calls.map((c) => c.join(" ")),
      ...warnSpy.mock.calls.map((c) => c.join(" ")),
    ];

    for (const line of allLogs) {
      // No 6-digit numeric code should appear in any log line
      expect(line).not.toMatch(/\b\d{6}\b/);
    }
  });

  it("loading state terminates: mutation throws on delivery failure (does not hang)", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    mailMock.sendPlatformEmail.mockResolvedValue(false);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    // mutateAsync will reject, meaning isPending terminates — verified by the
    // promise settling (either resolve or reject) rather than hanging.
    const promise = caller.resendVerificationCode();
    await expect(promise).rejects.toBeDefined();
  });

  it("rejects unauthenticated resend requests", async () => {
    const caller = dropiAuthRouter.createCaller(createPublicContext());

    await expect(caller.resendVerificationCode()).rejects.toThrow("Please login (10001)");
  });
});

