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

function createUser() {
  return {
    id: 7,
    openId: "user-open-id",
    email: "user@example.com",
    name: "User Example",
    loginMethod: "email",
    role: "user",
    dropiRole: "customer",
    channel: "C1",
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

  it("lets a logged-in user resend the verification email", async () => {
    dbMock.getUserById.mockResolvedValue(createUser());
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

  it("rejects unauthenticated resend requests", async () => {
    const caller = dropiAuthRouter.createCaller(createPublicContext());

    await expect(caller.resendVerificationCode()).rejects.toThrow("Please login (10001)");
  });
});
