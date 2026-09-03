import { createHash, randomBytes } from "node:crypto";
import * as db from "./db";
import { sdk } from "./_core/sdk";

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_NAME = "app_refresh_id";

export type RefreshableSessionResult = {
  token: string;
  refreshToken: string;
  sessionId: number;
  expiresAt: Date;
};

function createRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function issueRefreshableSession(input: {
  userId: number;
  openId: string;
  name?: string | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
}): Promise<RefreshableSessionResult> {
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const sessionId = await db.createSession({
    userId: input.userId,
    token: hashRefreshToken(refreshToken),
    deviceInfo: input.deviceInfo ?? null,
    ipAddress: input.ipAddress ?? null,
    isPhantom: false,
    phantomAdminId: null,
    expiresAt,
  });
  const token = await sdk.createSessionToken(input.openId, {
    name: input.name || "",
    expiresInMs: ACCESS_TOKEN_TTL_MS,
    sessionId,
  });

  return { token, refreshToken, sessionId, expiresAt };
}

export async function rotateRefreshableSession(
  refreshToken: string,
): Promise<(RefreshableSessionResult & { user: NonNullable<Awaited<ReturnType<typeof db.getUserById>>> }) | null> {
  if (!refreshToken) return null;

  const currentHash = hashRefreshToken(refreshToken);
  const session = await db.getSessionByToken(currentHash);
  if (!session || session.isPhantom) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await db.deleteSessionById(session.id);
    return null;
  }

  const user = await db.getUserById(session.userId);
  if (!user || user.isActive === false) {
    await db.deleteSessionById(session.id);
    return null;
  }

  const nextRefreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const rotated = await db.rotateSessionToken(
    session.id,
    currentHash,
    hashRefreshToken(nextRefreshToken),
    expiresAt,
  );
  if (!rotated) {
    // Another caller already rotated this token. Replays fail closed.
    return null;
  }

  const token = await sdk.createSessionToken(user.openId, {
    name: user.name || "",
    expiresInMs: ACCESS_TOKEN_TTL_MS,
    sessionId: session.id,
  });

  return {
    token,
    refreshToken: nextRefreshToken,
    sessionId: session.id,
    expiresAt,
    user,
  };
}

export async function revokeRefreshToken(refreshToken: string | undefined | null): Promise<void> {
  if (!refreshToken) return;
  await db.deleteSessionByToken(hashRefreshToken(refreshToken));
}
