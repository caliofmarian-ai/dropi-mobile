import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { COOKIE_NAME } from "../shared/const.js";

export function getRequestSessionToken(req: Pick<Request, "headers">): string | null {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) return token;
  }

  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== "string" || !cookieHeader.trim()) return null;
  const parsed = parseCookieHeader(cookieHeader);
  const cookieToken = parsed[COOKIE_NAME];
  return typeof cookieToken === "string" && cookieToken.trim() ? cookieToken.trim() : null;
}
