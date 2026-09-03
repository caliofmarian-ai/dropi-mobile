import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AuditChannel } from "../audit-policy";
import { logProcedureCall, type AuditProcedureType } from "../audit-middleware";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

function auditMiddleware(channelOverride?: AuditChannel) {
  return t.middleware(async (opts) => {
    const startTime = Date.now();
    let success = true;
    let errorMsg: string | undefined;
    const procedureType = ((opts as any).type || "unknown") as AuditProcedureType;

    try {
      const rawInput = await opts.getRawInput();
      const result = await opts.next(opts);
      if (!result.ok) {
        success = false;
        errorMsg = "procedure_error";
      }
      logProcedureCall({
        ctx: opts.ctx,
        path: opts.path,
        input: rawInput,
        startTime,
        success,
        error: errorMsg,
        channelOverride,
        procedureType,
      }).catch((e) => console.error("[Audit] Logging failed:", e));
      return result;
    } catch (error: any) {
      success = false;
      errorMsg = typeof error?.code === "string" ? error.code : (error?.name || "procedure_error");
      let rawInput: unknown;
      try {
        rawInput = await opts.getRawInput();
      } catch {
        rawInput = undefined;
      }
      logProcedureCall({
        ctx: opts.ctx,
        path: opts.path,
        input: rawInput,
        startTime,
        success: false,
        error: errorMsg,
        channelOverride,
        procedureType,
      }).catch((e) => console.error("[Audit] Logging failed:", e));
      throw error;
    }
  });
}

const auditLog = auditMiddleware();
const auditAdminLog = auditMiddleware("ADMIN");

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

const requireAuditInvestigator = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const user = ctx.user;
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  if ((user as any).isActive === false) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Inactive accounts cannot access Audit Core." });
  }

  const dropiRole = (user as any).dropiRole;
  const channel = (user as any).channel;
  const isOwner = user.role === "admin" || dropiRole === "system_administrator";
  const isAuditor = dropiRole === "audit_manager" && channel === "ADMIN";
  if (!isOwner && !isAuditor) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Audit Core requires Owner or Auditor authority." });
  }

  return next({
    ctx: { ...ctx, user },
  });
});

export const protectedProcedure = t.procedure.use(requireUser).use(auditLog);

// Phantom-control operations run while the authenticated identity is the target
// user, but they are administrative control actions and therefore belong to the
// ADMIN audit stream. The procedure itself still validates phantom state.
export const phantomProcedure = t.procedure.use(requireUser).use(auditAdminLog);

// Canonical full-log investigators: Owner/System Administrator and Audit Manager.
// Every investigator read/export is itself written to the ADMIN audit stream.
export const auditInvestigatorProcedure = t.procedure.use(requireAuditInvestigator).use(auditAdminLog);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const user = ctx.user;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    const isAdmin = user.role === "admin" || (user as any).dropiRole === "system_administrator";
    if (!isAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: { ...ctx, user },
    });
  }),
).use(auditAdminLog);
