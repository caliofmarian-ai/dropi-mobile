import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import type { TrpcContext } from "../server/_core/context";

process.env.JWT_SECRET = "auth-401-test-secret";

const dbMock = vi.hoisted(() => ({
  getUserByLoginIdentifier: vi.fn(),
  clearResetToken: vi.fn(),
  updateUserPassword: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock("../server/db", () => dbMock);

const { hashOneTimeCode } = await import("../server/account-lifecycle");
const { passwordRecoveryRouter } = await import("../server/password-recovery-router");

function userWithCode(code: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 151,
    email: "dropi.deliveries+human.delivery_partner@gmail.com",
    username: "human.delivery_partner",
    dropiRole: "delivery_partner",
    channel: "C1",
    isAIAgent: false,
    resetToken: hashOneTimeCode("password-reset", code),
    resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
    ...overrides,
  } as any;
}

function context(ip = "127.0.0.1"): TrpcContext {
  return {
    user: null,
    session: null,
    sessionToken: null,
    req: {
      headers: {},
      ip,
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AUTH-401 addressed password recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.clearResetToken.mockResolvedValue(undefined);
    dbMock.updateUserPassword.mockResolvedValue(undefined);
    dbMock.createAuditLog.mockResolvedValue(undefined);
  });

  it("verifies the latest code against the addressed username before password entry", async () => {
    dbMock.getUserByLoginIdentifier.mockResolvedValue(userWithCode("123456"));
    const caller = passwordRecoveryRouter.createCaller(context("127.0.0.11"));

    await expect(caller.verifyResetCode({
      identifier: "HUMAN.DELIVERY_PARTNER",
      token: "123456",
    })).resolves.toEqual({ success: true });

    expect(dbMock.getUserByLoginIdentifier).toHaveBeenCalledWith("human.delivery_partner");
    expect(dbMock.updateUserPassword).not.toHaveBeenCalled();
  });

  it("revalidates the same addressed account and code at the password-changing boundary", async () => {
    dbMock.getUserByLoginIdentifier.mockResolvedValue(userWithCode("234567"));
    const caller = passwordRecoveryRouter.createCaller(context("127.0.0.12"));

    await expect(caller.resetPassword({
      identifier: "human.delivery_partner",
      token: "234567",
      newPassword: "DeliveryPartner2026",
    })).resolves.toEqual({ success: true });

    expect(dbMock.updateUserPassword).toHaveBeenCalledTimes(1);
    const [userId, passwordHash] = dbMock.updateUserPassword.mock.calls[0];
    expect(userId).toBe(151);
    expect(passwordHash).not.toBe("DeliveryPartner2026");
    await expect(bcrypt.compare("DeliveryPartner2026", passwordHash)).resolves.toBe(true);
    expect(dbMock.clearResetToken).toHaveBeenCalledWith(151);
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "auth.reset_password",
      details: expect.objectContaining({
        sessionsRevoked: true,
        addressedRecovery: true,
        recoveryIdentifierType: "username",
      }),
    }));
  });

  it("rejects a stale or wrong code without changing the password", async () => {
    dbMock.getUserByLoginIdentifier.mockResolvedValue(userWithCode("345678"));
    const caller = passwordRecoveryRouter.createCaller(context("127.0.0.13"));

    await expect(caller.verifyResetCode({
      identifier: "human.delivery_partner",
      token: "999999",
    })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid or expired reset code. Use the newest code from your inbox.",
    });

    expect(dbMock.updateUserPassword).not.toHaveBeenCalled();
  });

  it("does not reveal whether the addressed account exists", async () => {
    dbMock.getUserByLoginIdentifier.mockResolvedValue(undefined);
    const caller = passwordRecoveryRouter.createCaller(context("127.0.0.14"));

    await expect(caller.verifyResetCode({
      identifier: "unknown.account",
      token: "456789",
    })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid or expired reset code. Use the newest code from your inbox.",
    });
  });

  it("clears an expired credential and rejects it", async () => {
    dbMock.getUserByLoginIdentifier.mockResolvedValue(userWithCode("567890", {
      resetTokenExpiry: new Date(Date.now() - 1000),
    }));
    const caller = passwordRecoveryRouter.createCaller(context("127.0.0.15"));

    await expect(caller.verifyResetCode({
      identifier: "human.delivery_partner",
      token: "567890",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(dbMock.clearResetToken).toHaveBeenCalledWith(151);
  });

  it("normalizes email addressing exactly like username recovery", async () => {
    dbMock.getUserByLoginIdentifier.mockResolvedValue(userWithCode("678901"));
    const caller = passwordRecoveryRouter.createCaller(context("127.0.0.16"));

    await caller.verifyResetCode({
      identifier: "DROPI.DELIVERIES+HUMAN.DELIVERY_PARTNER@GMAIL.COM",
      token: "678901",
    });

    expect(dbMock.getUserByLoginIdentifier).toHaveBeenCalledWith(
      "dropi.deliveries+human.delivery_partner@gmail.com",
    );
  });

  it("keeps Android on the server-verified code path and explains newest-code semantics", () => {
    const screen = readFileSync(resolve(process.cwd(), "app/forgot-password.tsx"), "utf8");
    const authContext = readFileSync(resolve(process.cwd(), "lib/auth-context.tsx"), "utf8");
    const routers = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

    expect(screen).toContain("await verifyResetCode(identifier, code)");
    expect(screen).toContain("Only the newest code is valid after a resend.");
    expect(screen).not.toContain("Code format accepted. DROPi will verify it securely when you reset your password.");
    expect(authContext).toContain('apiCall("passwordRecovery.verifyResetCode"');
    expect(authContext).toContain('apiCall("passwordRecovery.resetPassword"');
    expect(routers).toContain("passwordRecovery: passwordRecoveryRouter");
  });
});
