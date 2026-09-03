import { COOKIE_NAME } from "../../shared/const.js";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
  issueRefreshableSession,
  revokeRefreshToken,
  rotateRefreshableSession,
} from "../auth-session";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return first?.trim() || req.ip || "unknown";
}

function getDeviceInfo(req: Request): string {
  return req.headers["user-agent"]?.slice(0, 255) || "unknown";
}

function getRefreshCredential(req: Request): string | undefined {
  const bodyToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;
  if (bodyToken) return bodyToken;
  if (!req.headers.cookie) return undefined;
  return parseCookieHeader(req.headers.cookie)[REFRESH_COOKIE_NAME];
}

function setRefreshableCookies(
  req: Request,
  res: Response,
  token: string,
  refreshToken: string,
) {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ACCESS_TOKEN_TTL_MS });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

function clearRefreshableCookies(req: Request, res: Response) {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return (
    saved ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

function requirePersistedUserId(user: Awaited<ReturnType<typeof syncUser>>): number {
  const id = (user as any)?.id;
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("OAuth user could not be persisted before session issuance");
  }
  return id;
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

async function exchangeOAuthAndIssueSession(req: Request) {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");
  if (!code || !state) {
    return null;
  }

  const tokenResponse = await sdk.exchangeCodeForToken(code, state);
  const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
  const user = await syncUser(userInfo);
  const session = await issueRefreshableSession({
    userId: requirePersistedUserId(user),
    openId: userInfo.openId!,
    name: userInfo.name || "",
    deviceInfo: getDeviceInfo(req),
    ipAddress: getClientIp(req),
  });
  return { user, session };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    if (!ENV.oAuthServerUrl) {
      res
        .status(503)
        .json({ error: "External OAuth service is not configured. Set OAUTH_SERVER_URL." });
      return;
    }

    if (!getQueryParam(req, "code") || !getQueryParam(req, "state")) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const issued = await exchangeOAuthAndIssueSession(req);
      if (!issued) {
        res.status(400).json({ error: "code and state are required" });
        return;
      }
      setRefreshableCookies(req, res, issued.session.token, issued.session.refreshToken);

      const frontendUrl =
        process.env.EXPO_WEB_PREVIEW_URL ||
        process.env.EXPO_PACKAGER_PROXY_URL ||
        "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {
    if (!ENV.oAuthServerUrl) {
      res
        .status(503)
        .json({ error: "External OAuth service is not configured. Set OAUTH_SERVER_URL." });
      return;
    }

    if (!getQueryParam(req, "code") || !getQueryParam(req, "state")) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const issued = await exchangeOAuthAndIssueSession(req);
      if (!issued) {
        res.status(400).json({ error: "code and state are required" });
        return;
      }
      setRefreshableCookies(req, res, issued.session.token, issued.session.refreshToken);

      res.json({
        app_session_id: issued.session.token,
        refresh_token: issued.session.refreshToken,
        user: buildUserResponse(issued.user),
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    const refreshToken = getRefreshCredential(req);
    if (!refreshToken) {
      clearRefreshableCookies(req, res);
      res.status(401).json({ error: "Refresh token required" });
      return;
    }

    try {
      const rotated = await rotateRefreshableSession(refreshToken);
      if (!rotated) {
        clearRefreshableCookies(req, res);
        res.status(401).json({ error: "Invalid, expired, or already rotated refresh token" });
        return;
      }

      setRefreshableCookies(req, res, rotated.token, rotated.refreshToken);
      res.json({
        app_session_id: rotated.token,
        refresh_token: rotated.refreshToken,
        user: buildUserResponse(rotated.user),
      });
    } catch (error) {
      console.error("[Auth] Refresh failed", error);
      clearRefreshableCookies(req, res);
      res.status(500).json({ error: "Unable to refresh session" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      await revokeRefreshToken(getRefreshCredential(req));
    } catch (error) {
      console.error("[Auth] Session revocation failed during logout", error);
    }
    clearRefreshableCookies(req, res);
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ACCESS_TOKEN_TTL_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
