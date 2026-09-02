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

export type AuditProcedureType = "query" | "mutation" | "subscription" | "unknown";

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
    return input.id?.toString() || input.userId?.toString() || input.orderId?.toString() || input.deliveryId?.toString() || input.targetUserId?.toString() || null;
  }
  return null;
}

export function sanitizeAuditInput(input: any): Record<string, unknown> | null {
  if (!input || typeof input !== "object") return null;
  const sanitized = { ...input };
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  delete sanitized.resetToken;
  delete sanitized.fileBase64;
  delete sanitized.apiKey;
  delete sanitized.secret;
  return sanitized;
}

export function auditAccessKind(procedureType: AuditProcedureType): "READ" | "WRITE" | "STREAM" | "UNKNOWN" {
  if (procedureType === "query") return "READ";
  if (procedureType === "mutation") return "WRITE";
  if (procedureType === "subscription") return "STREAM";
  return "UNKNOWN";
}

export function extractDecisionMetadata(
  procedureType: AuditProcedureType,
  sanitizedInput: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (procedureType !== "mutation" || !sanitizedInput) return null;
  const decision: Record<string, unknown> = {};
  for (const key of ["action", "newStatus", "status", "reason", "note", "decision", "isActive", "channel", "dropiRole"]) {
    if (Object.prototype.hasOwnProperty.call(sanitizedInput, key)) decision[key] = sanitizedInput[key];
  }
  return Object.keys(decision).length > 0 ? decision : null;
}

export async function logProcedureCall(opts: {
  ctx: TrpcContext;
  path: string;
  input: any;
  startTime: number;
  success: boolean;
  error?: string;
  channelOverride?: AuditChannel;
  procedureType?: AuditProcedureType;
}) {
  const { ctx, path, input, startTime, success, error, channelOverride } = opts;
  const procedureType = opts.procedureType ?? "unknown";
  const duration = Date.now() - startTime;
  if (!ctx.user) return;

  let severity: "info" | "warning" | "critical" = "info";
  if (!success) severity = "warning";
  if (path.includes("phantom") || path.includes("changeRole") || path.includes("toggle")) severity = "critical";

  const attribution = buildAuditAttribution(channelOverride ?? (ctx.user as any).channel, ctx.session);
  const sanitizedInput = sanitizeAuditInput(input);
  const isAIAction = Boolean((ctx.user as any).isAIAgent);
  const deviceInfo = ctx.session?.deviceInfo || getUserAgent(ctx.req);

  await createAuditLog({
    userId: ctx.user.id,
    userRole: ctx.user.dropiRole || "user",
    action: path,
    resourceType: extractResourceType(path),
    resourceId: extractResourceId(input),
    severity,
    channel: attribution.channel,
    isAIAction,
    isPhantomMode: attribution.isPhantomMode,
    phantomAdminId: attribution.phantomAdminId,
    ipAddress: getClientIp(ctx.req),
    userAgent: getUserAgent(ctx.req),
    sessionId: ctx.session?.id != null ? String(ctx.session.id) : null,
    duration,
    details: {
      procedureType,
      accessKind: auditAccessKind(procedureType),
      actorKind: isAIAction ? "AI_PERSONAL" : "HUMAN",
      deviceInfo,
      input: sanitizedInput,
      decision: extractDecisionMetadata(procedureType, sanitizedInput),
      success,
      ...(error ? { error } : {}),
    },
  });
}
