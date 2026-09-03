import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("IMPL-005 OAuth JWT refresh rotation contract", () => {
  it("issues short-lived access JWTs bound to a persisted session", () => {
    const sessionService = source("server/auth-session.ts");
    const sdk = source("server/_core/sdk.ts");

    expect(sessionService).toContain("ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000");
    expect(sessionService).toContain("REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000");
    expect(sessionService).toContain("sessionId,");
    expect(sessionService).toContain('createHash("sha256")');
    expect(sdk).toContain("sessionId?: number");
    expect(sdk).toContain("getPersistedSessionForToken");
    expect(sdk).toContain("Invalid, revoked, or expired persisted session");
  });

  it("rotates the stored refresh hash atomically and fails replay closed", () => {
    const sessionService = source("server/auth-session.ts");

    expect(sessionService).toContain("and(eq(sessions.id, sessionId), eq(sessions.token, currentHash))");
    expect(sessionService).toContain("Another caller already rotated this token. Replays fail closed.");
    expect(sessionService).not.toContain("token: refreshToken");
  });

  it("exposes refresh and revocation through the existing OAuth API surface", () => {
    const oauth = source("server/_core/oauth.ts");

    expect(oauth).toContain('app.post("/api/auth/refresh"');
    expect(oauth).toContain("rotateRefreshableSession(refreshToken)");
    expect(oauth).toContain("revokeRefreshToken(getRefreshCredential(req))");
    expect(oauth).toContain("refresh_token: issued.session.refreshToken");
    expect(oauth).toContain("REFRESH_COOKIE_NAME");
  });

  it("keeps mobile refresh credentials in SecureStore and rotates before expiry", () => {
    const auth = source("lib/_core/auth.ts");
    const api = source("lib/_core/api.ts");

    expect(auth).toContain("REFRESH_TOKEN_KEY");
    expect(auth).toContain("refreshPromise");
    expect(auth).toContain("/api/auth/refresh");
    expect(auth).toContain("shouldRefreshToken(token)");
    expect(api).toContain("Auth.setSessionCredentials(sessionToken, refreshToken)");
    expect(api).toContain("Auth.getRefreshToken()");
  });
});
