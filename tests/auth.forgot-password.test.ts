import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const dbMock = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  setResetToken: vi.fn(),
  clearResetToken: vi.fn(),
  createAuditLog: vi.fn(),
}));

const mailMock = vi.hoisted(() => ({
  sendPlatformEmail: vi.fn(),
  maskEmail: vi.fn((email: string) => email),
}));

vi.mock("../server/db", () => dbMock);
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

describe("dropiAuth.forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createAuditLog.mockResolvedValue(undefined);
    dbMock.setResetToken.mockResolvedValue(undefined);
    dbMock.clearResetToken.mockResolvedValue(undefined);
    mailMock.sendPlatformEmail.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a generic success response when the user does not exist", async () => {
    dbMock.getUserByEmail.mockResolvedValue(undefined);
    const caller = dropiAuthRouter.createCaller(createPublicContext());

    const result = await caller.forgotPassword({ email: "missing@example.com" });

    expect(result).toEqual({
      success: true,
      message: "If this email is registered, a 6-digit code has been sent.",
    });
    expect(dbMock.setResetToken).not.toHaveBeenCalled();
    expect(mailMock.sendPlatformEmail).not.toHaveBeenCalled();
  });

  it("clears the stored reset token and fails when email delivery fails", async () => {
    dbMock.getUserByEmail.mockResolvedValue({
      id: 42,
      email: "user@example.com",
      dropiRole: "customer",
      channel: "C1",
      isAIAgent: false,
    });
    mailMock.sendPlatformEmail.mockResolvedValue(false);
    const caller = dropiAuthRouter.createCaller(createPublicContext());

    await expect(caller.forgotPassword({ email: "user@example.com" })).rejects.toThrow(
      "Unable to send reset code right now. Please try again later.",
    );

    expect(dbMock.setResetToken).toHaveBeenCalledTimes(1);
    expect(dbMock.clearResetToken).toHaveBeenCalledWith(42);
  });

  it("keeps the generic success response when the reset email is sent", async () => {
    dbMock.getUserByEmail.mockResolvedValue({
      id: 7,
      email: "user@example.com",
      dropiRole: "customer",
      channel: "C1",
      isAIAgent: false,
    });
    const caller = dropiAuthRouter.createCaller(createPublicContext());

    const result = await caller.forgotPassword({ email: "user@example.com" });

    expect(result).toEqual({
      success: true,
      message: "If this email is registered, a 6-digit code has been sent.",
    });
    expect(dbMock.setResetToken).toHaveBeenCalledTimes(1);
    expect(dbMock.clearResetToken).not.toHaveBeenCalled();
    expect(mailMock.sendPlatformEmail).toHaveBeenCalledTimes(1);
  });

  it("does not log the 6-digit reset code to any console channel", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    dbMock.getUserByEmail.mockResolvedValue({
      id: 5,
      email: "user@example.com",
      dropiRole: "customer",
      channel: "C1",
      isAIAgent: false,
    });
    mailMock.sendPlatformEmail.mockResolvedValue(true);

    const caller = dropiAuthRouter.createCaller(createPublicContext());
    await caller.forgotPassword({ email: "user@example.com" });

    // Capture the actual 6-digit code that was stored in the DB
    const setResetCall = dbMock.setResetToken.mock.calls[0];
    expect(setResetCall).toBeDefined();
    const resetCode = String(setResetCall?.[1] ?? "");
    expect(resetCode).toMatch(/^\d{6}$/);

    // Verify the code never appears in any log output
    const allLoggedStrings = [
      ...consoleSpy.mock.calls,
      ...consoleLogSpy.mock.calls,
      ...consoleWarnSpy.mock.calls,
    ]
      .flat()
      .map(String);

    for (const logged of allLoggedStrings) {
      expect(logged).not.toContain(resetCode);
    }
  });
});
