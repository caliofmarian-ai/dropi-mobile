import type { NextFunction, Request, Response } from "express";
import {
  SECURITY_AUTH_RATE_MAX,
  SECURITY_GLOBAL_RATE_MAX,
  SECURITY_GLOBAL_RATE_WINDOW_MS,
  isAllowedBrowserOrigin,
  parseAllowedOrigins,
} from "../shared/security-baseline-policy";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 20_000;

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function rateClass(req: Request): { name: string; max: number } {
  const path = req.path || req.originalUrl || "";
  if (/auth|login|register|password|verify/i.test(path)) return { name: "auth", max: SECURITY_AUTH_RATE_MAX };
  return { name: "api", max: SECURITY_GLOBAL_RATE_MAX };
}

function consumeRateBucket(key: string, max: number, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    if (rateBuckets.size >= MAX_BUCKETS) {
      for (const [candidate, value] of rateBuckets) {
        if (now >= value.resetAt) rateBuckets.delete(candidate);
        if (rateBuckets.size < MAX_BUCKETS) break;
      }
    }
    rateBuckets.set(key, { count: 1, resetAt: now + SECURITY_GLOBAL_RATE_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function securityHeadersMiddleware(isProduction: boolean) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    if (isProduction) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  };
}

export function httpsOnlyMiddleware(isProduction: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isProduction) return next();
    const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim().toLowerCase();
    const secure = req.secure || forwardedProto === "https";
    if (secure) return next();
    res.status(426).json({ error: "HTTPS_REQUIRED", message: "DROPi API accepts production traffic only over HTTPS." });
  };
}

export function strictCorsMiddleware(input: { isProduction: boolean; allowedOriginsRaw?: string }) {
  const allowedOrigins = parseAllowedOrigins(input.allowedOriginsRaw, input.isProduction);
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
    if (!isAllowedBrowserOrigin(origin, allowedOrigins)) {
      res.status(403).json({ error: "ORIGIN_NOT_ALLOWED", message: "Browser origin is not allowed for this DROPi API." });
      return;
    }
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-DROPi-API-Key");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  };
}

export function apiRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/api/health" || req.path === "/health") return next();
  const category = rateClass(req);
  const key = `${category.name}:${clientIp(req)}`;
  const result = consumeRateBucket(key, category.max);
  if (result.allowed) return next();
  res.setHeader("Retry-After", String(result.retryAfterSeconds));
  res.status(429).json({ error: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Retry later.", retryAfter: result.retryAfterSeconds });
}

export function resetSecurityRateLimitStateForTests(): void {
  rateBuckets.clear();
}
