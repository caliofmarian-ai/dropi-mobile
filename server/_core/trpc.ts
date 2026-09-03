import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AuditChannel } from "../audit-policy";
import { logProcedureCall, type AuditProcedureType } from "../audit-middleware";
import {
  describeRbacDenial,
  evaluateRbacAccess,
  type RbacRequirement,
} from "../rbac-policy";
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

/**
 * Single authorization gate for every authenticated tRPC surface.
 *
 * Authentication only proves who the caller is. This middleware additionally
 * proves that the persisted identity belongs to the canonical DROPi role graph,
 * that its role/channel pairing is valid, that the account is active, and—when
 * requested—that the canonical role grants the required role/channel/permission
 * constraint. AI agents do not receive a bypass; they are evaluated through the
 * exact same graph as human identities.
 */
function rbacMiddleware(
  requirement: RbacRequirement = {},
  forbiddenMessage?: string,
) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const user = ctx.user;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    const decision = evaluateRbacAccess(user, requirement);
    if (!decision.allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: forbiddenMessage ?? describeRbacDenial(decision),
      });
    }

    return next({
      ctx: { ...ctx, user },
    });
  });
}

const requireProtectedRole = rbacMiddleware();
const requireAuditInvestigator = rbacMiddleware(
  {
    roles: ["system_administrator", "audit_manager"],
    channels: ["ADMIN"],
  },
  "Audit Core requires Owner or Auditor authority.",
);
const requireAdmin = rbacMiddleware(
  {
    roles: ["system_administrator"],
    channels: ["ADMIN"],
  },
  NOT_ADMIN_ERR_MSG,
);

/**
 * Canonical authenticated procedure. Every existing protected route inherits
 * role/channel/account validation here, so route authors cannot accidentally
 * create an authentication-only tRPC surface.
 */
export const protectedProcedure = t.procedure.use(requireProtectedRole).use(auditLog);

/**
 * Fine-grained procedure factory for routes that require an explicit canonical
 * role, channel, or permission in addition to the baseline protected contract.
 */
export function rbacProcedure(requirement: RbacRequirement) {
  return t.procedure.use(rbacMiddleware(requirement)).use(auditLog);
}

// Phantom-control operations run while the authenticated identity is the target
// user, but they are administrative control actions and therefore belong to the
// ADMIN audit stream. The target identity is still validated against RBAC.
export const phantomProcedure = t.procedure.use(requireProtectedRole).use(auditAdminLog);

// Canonical full-log investigators: Owner/System Administrator and Audit Manager.
// Every investigator read/export is itself written to the ADMIN audit stream.
export const auditInvestigatorProcedure = t.procedure.use(requireAuditInvestigator).use(auditAdminLog);

// Administrative routes use the same canonical graph rather than a second,
// ad-hoc role check. Legacy platform `role=admin` resolves to the canonical
// System Administrator / ADMIN authority node inside rbac-policy.ts.
export const adminProcedure = t.procedure.use(requireAdmin).use(auditAdminLog);
