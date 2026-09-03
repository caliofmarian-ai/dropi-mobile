import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";
import { hashOneTimeCode } from "../server/account-lifecycle";

process.env.JWT_SECRET = "test-jwt-secret";

const dbMock = vi.hoisted(() => ({
  getUserById: vi.fn(),
  setEmailVerifyToken: vi.fn(),
  clearEmailVerifyToken: vi.fn(),
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
    dbMock.clearEmailVerifyToken.mockResolvedValue(undefined);
    dbMock.markEmailVerified.mockResolvedValue(undefined);
    mailMock.sendPlatformEmail.mockResolvedValue(true);
  });

  it("lets a logged-in user verify a transitional plaintext code", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    const result = await caller.verifyEmail({ code: "123456" });

    expect(result).toEqual({
      success: true,
      message: "Email verified successfully",
    });
    expect(dbMock.markEmailVerified).toHaveBeenCalledWith(7);
  });

  it("verifies a new protected-at-rest code", async () => {
    dbMock.getUserById.mockResolvedValue(
      createUser({
        emailVerifyToken: hashOneTimeCode("email-verification", "123456", "test-jwt-secret"),
      }),
    );
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.verifyEmail({ code: "123456" })).resolves.toMatchObject({ success: true });
    expect(dbMock.markEmailVerified).toHaveBeenCalledWith(7);
  });

  it("fails closed and clears a verification credential with missing expiry", async () => {
    dbMock.getUserById.mockResolvedValue(createUser({ emailVerifyExpires: null as any }));
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.verifyEmail({ code: "123456" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("expired"),
    });
    expect(dbMock.clearEmailVerifyToken).toHaveBeenCalledWith(7);
    expect(dbMock.markEmailVerified).not.toHaveBeenCalled();
  });

  it("lets a logged-in user resend after the one-minute cooldown and stores only a digest", async () => {
    dbMock.getUserById.mockResolvedValue(
      createUser({ emailVerifyToken: null as any, emailVerifyExpires: null as any }),
    );
    mailMock.sendPlatformEmail.mockResolvedValue(true);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    const result = await caller.resendVerificationCode();

    expect(result).toEqual({
      success: true,
      message: "Verification code sent",
    });
    expect(dbMock.setEmailVerifyToken).toHaveBeenCalledTimes(1);
    const [, storedCode, issuedExpiry] = dbMock.setEmailVerifyToken.mock.calls[0];
    expect(storedCode).toMatch(/^otc1:[0-9a-f]{64}$/);
    expect(issuedExpiry).toBeInstanceOf(Date);
    expect(mailMock.sendPlatformEmail).toHaveBeenCalledTimes(1);
  });

  it("throttles immediate verification resend without issuing a new credential", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.resendVerificationCode()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(dbMock.setEmailVerifyToken).not.toHaveBeenCalled();
    expect(mailMock.sendPlatformEmail).not.toHaveBeenCalled();
  });

  it("clears the newly issued credential when provider delivery fails", async () => {
    dbMock.getUserById.mockResolvedValue(
      createUser({ emailVerifyToken: null as any, emailVerifyExpires: null as any }),
    );
    mailMock.sendPlatformEmail.mockResolvedValue(false);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.resendVerificationCode()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("Unable to send verification code"),
    });
    expect(dbMock.setEmailVerifyToken).toHaveBeenCalledTimes(1);
    expect(dbMock.clearEmailVerifyToken).toHaveBeenCalledWith(7);
    expect(mailMock.sendPlatformEmail).toHaveBeenCalledTimes(1);
    const procedureAudit = dbMock.createAuditLog.mock.calls.find(
      (c: any[]) => c[0]?.action === "auth.resend_verification",
    );
    expect(procedureAudit).toBeUndefined();
  });

  it("throws INTERNAL_SERVER_ERROR when mail service is not configured", async () => {
    dbMock.getUserById.mockResolvedValue(
      createUser({ emailVerifyToken: null as any, emailVerifyExpires: null as any }),
    );
    mailMock.sendPlatformEmail.mockResolvedValue(false);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.resendVerificationCode()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(dbMock.clearEmailVerifyToken).toHaveBeenCalledWith(7);
  });

  it("throws INTERNAL_SERVER_ERROR when user has no email address", async () => {
    dbMock.getUserById.mockResolvedValue(
      createUser({ email: null as any, emailVerifyToken: null as any, emailVerifyExpires: null as any }),
    );
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.resendVerificationCode()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("No email address on file"),
    });
    expect(mailMock.sendPlatformEmail).not.toHaveBeenCalled();
  });

  it("does not log the verification code in any log output", async () => {
    dbMock.getUserById.mockResolvedValue(
      createUser({ emailVerifyToken: null as any, emailVerifyExpires: null as any }),
    );
    mailMock.sendPlatformEmail.mockResolvedValue(true);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const caller = dropiAuthRouter.createCaller(createAuthContext());
    await caller.resendVerificationCode();

    const storedDigest = String(dbMock.setEmailVerifyToken.mock.calls[0]?.[1] ?? "");
    expect(storedDigest).toMatch(/^otc1:/);

    const allLogs = [
      ...logSpy.mock.calls.map((c) => c.join(" ")),
      ...errorSpy.mock.calls.map((c) => c.join(" ")),
      ...warnSpy.mock.calls.map((c) => c.join(" ")),
    ];

    for (const line of allLogs) {
      expect(line).not.toMatch(/\b\d{6}\b/);
    }
  });

  it("loading state terminates: mutation throws on delivery failure", async () => {
    dbMock.getUserById.mockResolvedValue(
      createUser({ emailVerifyToken: null as any, emailVerifyExpires: null as any }),
    );
    mailMock.sendPlatformEmail.mockResolvedValue(false);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    const promise = caller.resendVerificationCode();
    await expect(promise).rejects.toBeDefined();
  });

  it("rejects unauthenticated resend requests", async () => {
    const caller = dropiAuthRouter.createCaller(createPublicContext());

    await expect(caller.resendVerificationCode()).rejects.toThrow("Please login (10001)");
  });
});
