/**
 * DROPi Audit Middleware — L6 Audit Core
 * 
 * Automatically logs ALL tRPC procedure calls (protected and admin).
 * Conforms to Blueprint requirement: "Every state change, decision, 
 * and intervention is logged."
 * 
 * AI actions are marked with isAIAction = true.
 * Phantom mode actions are marked with isPhantomMode = true.
 */

import { createAuditLog, getSessionByToken } from "./db";
import type { TrpcContext } from "./_core/context";

function getClientIp(req: any): string {
  return req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req?.ip || "unknown";
}

function getUserAgent(req: any): string {
  return req?.headers?.["user-agent"]?.slice(0, 500) || "unknown";
}

function extractResourceType(path: string): string {
  const parts = path.split(".");
  return parts[0] || "system";
}

function extractResourceId(input: any): string | null {
  if (!input) return null;
  if (typeof input === "object") {
    return input.id?.toString() || input.userId?.toString() || input.orderId?.toString() || input.targetUserId?.toString() || null;
  }
  return null;
}

function sanitizeInput(input: any): Record<string, unknown> | null {
  if (!input) return null;
  const sanitized = { ...input };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  delete sanitized.resetToken;
  return sanitized;
}

/**
 * Log an audit entry for a tRPC procedure call.
 * Called after procedure execution.
 */
export async function logProcedureCall(opts: {
  ctx: TrpcContext;
  path: string;
  input: any;
  startTime: number;
  success: boolean;
  error?: string;
}) {
  const { ctx, path, input, startTime, success, error } = opts;
  const duration = Date.now() - startTime;

  // Skip if no user (public procedures without auth)
  if (!ctx.user) return;

  // Determine severity
  let severity: "info" | "warning" | "critical" = "info";
  if (!success) severity = "warning";
  if (path.includes("phantom") || path.includes("changeRole") || path.includes("toggle")) severity = "critical";

  // Check if this is a phantom session
  let isPhantomMode = false;
  let phantomAdminId: number | null = null;

  // Detect phantom from session token
  const authHeader = ctx.req.headers.authorization || ctx.req.headers.Authorization;
  let token: string | undefined;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  }
  if (token) {
    try {
      const session = await getSessionByToken(token);
      if (session?.isPhantom) {
        isPhantomMode = true;
        phantomAdminId = session.phantomAdminId;
      }
    } catch {
      // Ignore session lookup errors
    }
  }

  await createAuditLog({
    userId: ctx.user.id,
    userRole: ctx.user.dropiRole || "user",
    action: path,
    resourceType: extractResourceType(path),
    resourceId: extractResourceId(input),
    severity,
    channel: (ctx.user as any).channel || null,
    isAIAction: (ctx.user as any).isAIAgent || false,
    isPhantomMode,
    phantomAdminId,
    ipAddress: getClientIp(ctx.req),
    userAgent: getUserAgent(ctx.req),
    duration,
    details: {
      input: sanitizeInput(input),
      success,
      ...(error ? { error } : {}),
    },
  });
}
