/**
 * Tests that OAUTH_SERVER_URL is treated as optional.
 *
 * DROPi uses its own email/password authentication (server/auth-router.ts).
 * The external OAuth service (OAUTH_SERVER_URL) is legacy Manus infrastructure
 * used only for external OAuth login (/api/oauth/callback, /api/oauth/mobile)
 * and cron task sessions — none of which are required for Railway production.
 *
 * When OAUTH_SERVER_URL is absent the SDK must:
 *   - NOT emit console.error (no "ERROR:" in production logs)
 *   - emit console.warn with an explanatory message
 *   - still support JWT signing/verification (email/password auth unaffected)
 */
import { afterAll, describe, expect, it, vi } from "vitest";

// Hoist mocks so they are applied before any module is imported.
const dbMock = vi.hoisted(() => ({
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

const envMock = vi.hoisted(() => ({
  ENV: {
    appId: "test-app-id",
    cookieSecret: "test-secret-key-must-be-at-least-32-chars!!",
    databaseUrl: "",
    oAuthServerUrl: "", // intentionally absent — simulates Railway without OAUTH_SERVER_URL
    ownerOpenId: "",
    isProduction: false,
    forgeApiUrl: "",
    forgeApiKey: "",
  },
}));

vi.mock("../server/db", () => dbMock);
vi.mock("../server/_core/env", () => envMock);

// Capture console output emitted during module initialisation.
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

const { sdk } = await import("../server/_core/sdk");

afterAll(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
  logSpy.mockRestore();
});

describe("SDKServer: OAUTH_SERVER_URL is optional", () => {
  it("does NOT emit console.error when OAUTH_SERVER_URL is absent", () => {
    const oauthErrors = errorSpy.mock.calls.filter((args) =>
      String(args[0]).includes("[OAuth]"),
    );
    expect(oauthErrors).toHaveLength(0);
  });

  it("emits console.warn with an explanatory message when OAUTH_SERVER_URL is absent", () => {
    const oauthWarns = warnSpy.mock.calls.filter((args) =>
      String(args[0]).includes("[OAuth]"),
    );
    expect(oauthWarns.length).toBeGreaterThan(0);
    // Message must not contain 'ERROR:' — that was the misleading production log
    expect(String(oauthWarns[0][0])).not.toContain("ERROR:");
    // Message must indicate email/password auth is unaffected
    expect(String(oauthWarns[0][0])).toContain("email/password");
  });

  it("does NOT log a baseURL when OAUTH_SERVER_URL is absent", () => {
    const oauthLogs = logSpy.mock.calls.filter((args) =>
      String(args[0]).includes("[OAuth]"),
    );
    // We should not log "Initialized with baseURL:" when the URL is empty
    expect(oauthLogs).toHaveLength(0);
  });

  it("JWT session signing works without OAUTH_SERVER_URL (email/password auth unaffected)", async () => {
    const token = await sdk.createSessionToken("user_abc123", { name: "Test User" });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // valid JWT structure
  });

  it("JWT session verification works without OAUTH_SERVER_URL", async () => {
    const token = await sdk.createSessionToken("user_abc123", { name: "Test User" });
    const session = await sdk.verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.openId).toBe("user_abc123");
    expect(session?.name).toBe("Test User");
  });
});
