/**
 * DROPi Audit Middleware — L6 Audit Core
 *
 * Automatically logs authenticated tRPC procedure calls.
 * Each persisted entry belongs to exactly one governed channel.
 * Phantom actions retain the target channel while carrying the real admin ID.
 */

import type { TrpcContext } from "./_core/context";
import { buildAuditAttribution, type AuditChannel } from "./audit-policy";
import { createAuditLog } from "./db";

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
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  delete sanitized.resetToken;
  return sanitized;
}

export async function logProcedureCall(opts: {
  ctx: TrpcContext;
  path: string;
  input: any;
  startTime: number;
  success: boolean;
  error?: string;
  channelOverride?: AuditChannel;
}) {
  const { ctx, path, input, startTime, success, error, channelOverride } = opts;
  const duration = Date.now() - startTime;
  if (!ctx.user) return;

  let severity: "info" | "warning" | "critical" = "info";
  if (!success) severity = "warning";
  if (path.includes("phantom") || path.includes("changeRole") || path.includes("toggle")) severity = "critical";

  const attribution = buildAuditAttribution(channelOverride ?? (ctx.user as any).channel, ctx.session);

  await createAuditLog({
    userId: ctx.user.id,
    userRole: ctx.user.dropiRole || "user",
    action: path,
    resourceType: extractResourceType(path),
    resourceId: extractResourceId(input),
    severity,
    channel: attribution.channel,
    isAIAction: (ctx.user as any).isAIAgent || false,
    isPhantomMode: attribution.isPhantomMode,
    phantomAdminId: attribution.phantomAdminId,
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
