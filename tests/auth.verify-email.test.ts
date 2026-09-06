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
    username: null,
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

    await expect(caller.verifyEmail({ code: "123456" })).rejects.toThrow("Verification code is invalid or expired");
    expect(dbMock.clearEmailVerifyToken).toHaveBeenCalledWith(7);
    expect(dbMock.markEmailVerified).not.toHaveBeenCalled();
  });

  it("fails closed and clears a verification credential with an invalid expiry", async () => {
    dbMock.getUserById.mockResolvedValue(createUser({ emailVerifyExpires: new Date("invalid") }));
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.verifyEmail({ code: "123456" })).rejects.toThrow("Verification code is invalid or expired");
    expect(dbMock.clearEmailVerifyToken).toHaveBeenCalledWith(7);
  });

  it("fails closed and clears an expired verification credential", async () => {
    dbMock.getUserById.mockResolvedValue(createUser({ emailVerifyExpires: new Date(Date.now() - 60_000) }));
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.verifyEmail({ code: "123456" })).rejects.toThrow("Verification code is invalid or expired");
    expect(dbMock.clearEmailVerifyToken).toHaveBeenCalledWith(7);
  });

  it("rejects a malformed code without marking the email verified", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.verifyEmail({ code: "000000" })).rejects.toThrow("Invalid verification code");
    expect(dbMock.markEmailVerified).not.toHaveBeenCalled();
  });

  it("returns success without another write when the account is already verified", async () => {
    dbMock.getUserById.mockResolvedValue(createUser({ emailVerified: true }));
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.verifyEmail({ code: "123456" })).resolves.toMatchObject({ success: true });
    expect(dbMock.markEmailVerified).not.toHaveBeenCalled();
  });

  it("resends through the authenticated account email and protects the new code at rest", async () => {
    dbMock.getUserById.mockResolvedValue(createUser({ emailVerifyToken: null, emailVerifyExpires: null }));
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    const result = await caller.resendVerificationEmail();

    expect(result).toMatchObject({ success: true });
    expect(dbMock.setEmailVerifyToken).toHaveBeenCalledWith(
      7,
      expect.stringMatching(/^v1\$/),
      expect.any(Date),
    );
    expect(mailMock.sendPlatformEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com" }),
    );
  });

  it("clears the new verification credential when resend email delivery fails", async () => {
    dbMock.getUserById.mockResolvedValue(createUser({ emailVerifyToken: null, emailVerifyExpires: null }));
    mailMock.sendPlatformEmail.mockResolvedValue(false);
    const caller = dropiAuthRouter.createCaller(createAuthContext());

    await expect(caller.resendVerificationEmail()).rejects.toThrow("Verification email could not be delivered");
    expect(dbMock.clearEmailVerifyToken).toHaveBeenCalledWith(7);
  });

  it("does not expose resend to an unauthenticated caller", async () => {
    const caller = dropiAuthRouter.createCaller(createPublicContext());
    await expect(caller.resendVerificationEmail()).rejects.toThrow();
  });
});
