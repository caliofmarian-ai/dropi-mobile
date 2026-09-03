import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

process.env.JWT_SECRET = "test-jwt-secret";

const dbMock = vi.hoisted(() => ({
  getUserByResetToken: vi.fn(),
  clearResetToken: vi.fn(),
  updateUserPassword: vi.fn(),
  createAuditLog: vi.fn(),
  deleteSessionByToken: vi.fn(),
  getUserById: vi.fn(),
  toggleUserActive: vi.fn(),
}));

const mailMock = vi.hoisted(() => ({
  sendPlatformEmail: vi.fn(),
  maskEmail: vi.fn((email: string) => email),
}));

vi.mock("../server/db", () => dbMock);
vi.mock("../server/_core/mail", () => mailMock);

const { adminAuthRouter, dropiAuthRouter } = await import("../server/auth-router");

function canonicalUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    openId: "user-open-id",
    email: "user@example.com",
    name: "User Example",
    loginMethod: "password",
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
    emailVerified: true,
    emailVerifyToken: null,
    emailVerifyExpires: null,
    isAIAgent: false,
    agentMode: null,
    humanPairId: null,
    lastIp: null,
    lastDevice: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    profilePhotoUrl: null,
    ...overrides,
  } as any;
}

function context(user: any = null, sessionToken: string | null = null): TrpcContext {
  return {
    user,
    session: null,
    sessionToken,
    req: {
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("DROPi account lifecycle routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.clearResetToken.mockResolvedValue(undefined);
    dbMock.updateUserPassword.mockResolvedValue(undefined);
    dbMock.createAuditLog.mockResolvedValue(undefined);
    dbMock.deleteSessionByToken.mockResolvedValue(undefined);
    dbMock.toggleUserActive.mockResolvedValue(undefined);
  });

  it("fails closed when a matched reset credential has no expiry", async () => {
    dbMock.getUserByResetToken.mockResolvedValue(
      canonicalUser({ resetToken: "protected", resetTokenExpiry: null }),
    );
    const caller = dropiAuthRouter.createCaller(context());

    await expect(
      caller.resetPassword({ token: "123456", newPassword: "NewPassword1" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("expired"),
    });

    expect(dbMock.clearResetToken).toHaveBeenCalledWith(7);
    expect(dbMock.updateUserPassword).not.toHaveBeenCalled();
  });

  it("replaces the password only for an unexpired recovery credential", async () => {
    dbMock.getUserByResetToken.mockResolvedValue(
      canonicalUser({ resetToken: "protected", resetTokenExpiry: new Date(Date.now() + 60_000) }),
    );
    const caller = dropiAuthRouter.createCaller(context());

    await expect(
      caller.resetPassword({ token: "123456", newPassword: "NewPassword1" }),
    ).resolves.toEqual({ success: true });

    expect(dbMock.updateUserPassword).toHaveBeenCalledTimes(1);
    expect(dbMock.clearResetToken).toHaveBeenCalledWith(7);
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "auth.reset_password",
        details: { sessionsRevoked: true },
      }),
    );
  });

  it("revokes the persisted server session during explicit logout", async () => {
    const caller = dropiAuthRouter.createCaller(context(canonicalUser(), "session-token"));

    await expect(caller.logout()).resolves.toEqual({ success: true });
    expect(dbMock.deleteSessionByToken).toHaveBeenCalledWith("session-token");
  });

  it("prevents an administrator from deactivating their own account", async () => {
    const admin = canonicalUser({
      id: 1,
      role: "admin",
      dropiRole: "system_administrator",
      channel: "ADMIN",
    });
    dbMock.getUserById.mockResolvedValue(admin);
    const caller = adminAuthRouter.createCaller(context(admin, "admin-session"));

    await expect(caller.toggleUserActive({ userId: 1, isActive: false })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(dbMock.toggleUserActive).not.toHaveBeenCalled();
  });

  it("deactivates an existing target through the lifecycle-aware persistence boundary", async () => {
    const admin = canonicalUser({
      id: 1,
      role: "admin",
      dropiRole: "system_administrator",
      channel: "ADMIN",
    });
    dbMock.getUserById.mockResolvedValue(canonicalUser({ id: 22 }));
    const caller = adminAuthRouter.createCaller(context(admin, "admin-session"));

    await expect(caller.toggleUserActive({ userId: 22, isActive: false })).resolves.toEqual({ success: true });
    expect(dbMock.toggleUserActive).toHaveBeenCalledWith(22, false);
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.deactivate_user",
        details: expect.objectContaining({ sessionsRevoked: true }),
      }),
    );
  });
});
