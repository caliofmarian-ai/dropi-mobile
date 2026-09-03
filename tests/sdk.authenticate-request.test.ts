import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";

const dbMock = vi.hoisted(() => ({
  getDb: vi.fn(),
  getSessionByToken: vi.fn(),
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
    dbMock.getDb.mockResolvedValue(null);
    dbMock.upsertUser.mockResolvedValue(undefined);
  });

  it("accepts the mobile Authorization JWT transport only while its persisted session is valid", async () => {
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
    dbMock.getSessionByToken.mockResolvedValue({
      id: 31,
      userId: user.id,
      token,
      isPhantom: false,
      phantomAdminId: null,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      lastActiveAt: new Date(),
      deviceInfo: null,
      ipAddress: null,
    });

    const authenticated = await sdk.authenticateRequest({
      headers: {
        authorization: ["Bearer", token].join(" "),
      },
    } as any);

    expect(dbMock.getSessionByToken).toHaveBeenCalledWith(token);
    expect(dbMock.getUserByOpenId).toHaveBeenCalledWith("mobile-open-id");
    expect(authenticated).toBe(user);
  });

  it("rejects a valid JWT after its persisted session has been revoked", async () => {
    dbMock.getSessionByToken.mockResolvedValue(undefined);
    const token = await sdk.createSessionToken("revoked-open-id", { name: "Revoked User" });

    await expect(
      sdk.authenticateRequest({
        headers: { authorization: `Bearer ${token}` },
      } as any),
    ).rejects.toThrow("Invalid, revoked, or expired persisted session");
  });

  it("rejects requests that send neither Authorization JWT nor session cookie", async () => {
    await expect(
      sdk.authenticateRequest({
        headers: {},
      } as any),
    ).rejects.toThrow("Invalid session cookie");
  });
});

// ---------------------------------------------------------------------------
// verifySession — JWT claim tolerance
// ---------------------------------------------------------------------------
// Root cause (PR #33 production incident): verifySession was checking
// isNonEmptyString(appId) and isNonEmptyString(name). On Railway, VITE_APP_ID
// is often not set, so signSession embeds appId:"". Users with no display name
// produce name:"". Both caused "[Auth] Session payload missing required fields"
// and the client received "Please login (10001)" after a successful login.
//
// The HMAC-SHA256 signature already guarantees token origin and integrity.
// Only openId (the user-lookup key) must be non-empty.
// ---------------------------------------------------------------------------

describe("sdk.verifySession — JWT claim tolerance", () => {
  it("accepts a valid token with an empty appId (VITE_APP_ID not configured on Railway)", async () => {
    const token = await sdk.signSession({ openId: "dropi_user_123", appId: "", name: "Test User" });
    const session = await sdk.verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.openId).toBe("dropi_user_123");
  });

  it("accepts a valid token with an empty name (user registered without display name)", async () => {
    const token = await sdk.signSession({ openId: "dropi_user_456", appId: "test-app-id", name: "" });
    const session = await sdk.verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.openId).toBe("dropi_user_456");
  });

  it("accepts a valid token where both appId and name are empty", async () => {
    const token = await sdk.signSession({ openId: "dropi_user_789", appId: "", name: "" });
    const session = await sdk.verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.openId).toBe("dropi_user_789");
  });

  it("rejects a token with an empty openId (required for user lookup)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const token = await sdk.signSession({ openId: "", appId: "test-app-id", name: "Test User" });
    const session = await sdk.verifySession(token);
    expect(session).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("openId"));
    warnSpy.mockRestore();
  });

  it("returns null (not throws) for a missing cookie value", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const session = await sdk.verifySession(undefined);
    expect(session).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Missing session cookie"));
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// verifySession — JWT security invariants
// ---------------------------------------------------------------------------
// These tests prove that removing the non-empty appId/name requirement does
// NOT weaken authentication: the HMAC-SHA256 signature is still the enforced
// security boundary. Any token that does not carry a valid signature from
// JWT_SECRET is rejected, regardless of its payload contents.
// ---------------------------------------------------------------------------

describe("sdk.verifySession — JWT security invariants", () => {
  const wrongSecret = new TextEncoder().encode(
    "wrong-secret-key-must-be-at-least-32-chars!!!",
  );

  it("rejects a token signed with the wrong secret (HMAC integrity enforced)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const forgedToken = await new SignJWT({ openId: "dropi_user_999", appId: "", name: "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(wrongSecret);

    const session = await sdk.verifySession(forgedToken);
    expect(session).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Session verification failed"),
      expect.any(String),
    );
    warnSpy.mockRestore();
  });

  it("rejects an expired token (exp claim enforced)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const correctSecret = new TextEncoder().encode(
      "test-secret-key-must-be-at-least-32-chars!!",
    );
    const expiredToken = await new SignJWT({ openId: "dropi_user_exp", appId: "", name: "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .sign(correctSecret);

    const session = await sdk.verifySession(expiredToken);
    expect(session).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Session verification failed"),
      expect.any(String),
    );
    warnSpy.mockRestore();
  });

  it("rejects a malformed (non-JWT) token string", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const session = await sdk.verifySession("not.a.valid.jwt.token");
    expect(session).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Session verification failed"),
      expect.any(String),
    );
    warnSpy.mockRestore();
  });
});
