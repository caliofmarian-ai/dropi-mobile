import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

const envMock = vi.hoisted(() => ({
  ENV: {
    appId: "test-app-id",
    cookieSecret: "test-secret-key-must-be-at-least-32-chars!!",
    databaseUrl: "",
    oAuthServerUrl: "",
    ownerOpenId: "",
    isProduction: false,
    forgeApiUrl: "",
    forgeApiKey: "",
  },
}));

vi.mock("../server/db", () => dbMock);
vi.mock("../server/_core/env", () => envMock);

const { sdk } = await import("../server/_core/sdk");

describe("sdk.authenticateRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.upsertUser.mockResolvedValue(undefined);
  });

  it("accepts the mobile Authorization JWT transport without requiring a cookie", async () => {
    const user = {
      id: 11,
      openId: "mobile-open-id",
      email: "mobile@example.com",
      name: "Mobile User",
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
      passwordHash: null,
      resetToken: null,
      resetTokenExpiry: null,
      emailVerified: false,
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
    };
    dbMock.getUserByOpenId.mockResolvedValue(user);
    const token = await sdk.createSessionToken("mobile-open-id", { name: "Mobile User" });

    const authenticated = await sdk.authenticateRequest({
      headers: {
        authorization: ["Bearer", token].join(" "),
      },
    } as any);

    expect(dbMock.getUserByOpenId).toHaveBeenCalledWith("mobile-open-id");
    expect(authenticated).toBe(user);
  });

  it("rejects requests that send neither Authorization JWT nor session cookie", async () => {
    await expect(
      sdk.authenticateRequest({
        headers: {},
      } as any),
    ).rejects.toThrow("Invalid session cookie");
  });
});
