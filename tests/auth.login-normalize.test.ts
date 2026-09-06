import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const dbMock = vi.hoisted(() => ({
  getUserByLoginIdentifier: vi.fn(),
  incrementFailedLogin: vi.fn(),
  resetFailedLogin: vi.fn(),
  updateUserLastLogin: vi.fn(),
  createSession: vi.fn(),
  createAuditLog: vi.fn(),
}));
const sdkMock = vi.hoisted(() => ({ sdk: { createSessionToken: vi.fn(), authenticateRequest: vi.fn() } }));
const mailMock = vi.hoisted(() => ({
  sendPlatformEmail: vi.fn(),
  maskEmail: vi.fn((email: string) => email.replace(/(^.).*(@.*$)/, "$1***$2")),
}));
vi.mock("../server/db", () => dbMock);
vi.mock("../server/_core/sdk", () => sdkMock);
vi.mock("../server/_core/mail", () => mailMock);
const { dropiAuthRouter } = await import("../server/auth-router");

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

async function getLookupIdentifier(identifier: string): Promise<string> {
  dbMock.getUserByLoginIdentifier.mockResolvedValue(undefined);
  const caller = dropiAuthRouter.createCaller(createPublicContext());
  await caller.login({ identifier, password: "any" }).catch(() => {});
  const calls = dbMock.getUserByLoginIdentifier.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return String(calls[0]?.[0] ?? "");
}

describe("dropiAuth.login — email or username normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createAuditLog.mockResolvedValue(undefined);
    dbMock.incrementFailedLogin.mockResolvedValue(undefined);
    dbMock.resetFailedLogin.mockResolvedValue(undefined);
    dbMock.updateUserLastLogin.mockResolvedValue(undefined);
    dbMock.createSession.mockResolvedValue(undefined);
    sdkMock.sdk.createSessionToken.mockResolvedValue("jwt-token");
  });

  it("normalizes uppercase email before lookup", async () => {
    expect(await getLookupIdentifier("ADMIN@EXAMPLE.COM")).toBe("admin@example.com");
  });

  it("normalizes mixed-case username before lookup", async () => {
    expect(await getLookupIdentifier("Human.Delivery_Partner")).toBe("human.delivery_partner");
  });

  it("trims either identifier before lookup", async () => {
    expect(await getLookupIdentifier("  human.delivery_partner  ")).toBe("human.delivery_partner");
  });

  it("rejects an empty identifier before DB lookup", async () => {
    const caller = dropiAuthRouter.createCaller(createPublicContext());
    await expect(caller.login({ identifier: "  ", password: "any" })).rejects.toThrow();
    expect(dbMock.getUserByLoginIdentifier).not.toHaveBeenCalled();
  });
});
