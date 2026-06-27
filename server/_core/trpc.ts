import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logProcedureCall } from "../audit-middleware";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Audit middleware — logs all procedure calls for authenticated users
const auditLog = t.middleware(async (opts) => {
  const startTime = Date.now();
  let success = true;
  let errorMsg: string | undefined;

  try {
    const rawInput = await opts.getRawInput();
    const result = await opts.next(opts);
    if (!result.ok) {
      success = false;
      errorMsg = "procedure_error";
    }
    // Log asynchronously (don't block response)
    logProcedureCall({
      ctx: opts.ctx,
      path: opts.path,
      input: rawInput,
      startTime,
      success,
      error: errorMsg,
    }).catch((e) => console.error("[Audit] Logging failed:", e));
    return result;
  } catch (error: any) {
    success = false;
    errorMsg = error?.message || "unknown_error";
    logProcedureCall({
      ctx: opts.ctx,
      path: opts.path,
      input: undefined,
      startTime,
      success: false,
      error: errorMsg,
    }).catch((e) => console.error("[Audit] Logging failed:", e));
    throw error;
  }
});

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

// Protected procedure: requires authenticated user + audit logging
export const protectedProcedure = t.procedure.use(requireUser).use(auditLog);

// Admin procedure: requires system_administrator dropiRole OR legacy admin role + audit logging
export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const user = ctx.user;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    // Accept both legacy "admin" role and DROPi system_administrator
    const isAdmin = user.role === "admin" || (user as any).dropiRole === "system_administrator";
    if (!isAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: { ...ctx, user },
    });
  }),
).use(auditLog);
