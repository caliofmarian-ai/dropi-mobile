import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { DROPI_TEST_BASE_INBOX } from "../shared/test-role-accounts";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { adminAuthRouter } from "./auth-router";
import { provisionTestRoleAccounts } from "./test-account-provisioning";

const targetProjection = {
  id: users.id,
  name: users.name,
  email: users.email,
  dropiRole: users.dropiRole,
  channel: users.channel,
  zone: users.zone,
  isActive: users.isActive,
  isAIAgent: users.isAIAgent,
  agentMode: users.agentMode,
  humanPairId: users.humanPairId,
} as const;

function assertBaseSuperAdmin(ctx: {
  user?: { email?: string | null } | null;
  session?: { isPhantom?: boolean | null } | null;
}) {
  if (ctx.session?.isPhantom) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Test-account provisioning is unavailable from Phantom Mode.",
    });
  }

  const email = ctx.user?.email?.trim().toLowerCase();
  if (email !== DROPI_TEST_BASE_INBOX) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the base Super Administrator may provision canonical test-role accounts.",
    });
  }
}

/**
 * Operator-facing phantom console surface.
 *
 * It deliberately exposes only the identity/role fields needed by the console;
 * password hashes, reset credentials, verification tokens, device/IP data, and
 * other account-security fields never leave this projection.
 */
export const phantomConsoleRouter = router({
  targets: adminProcedure
    .input(z.object({
      search: z.string().trim().max(120).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(100),
    }).default({ page: 1, limit: 100 }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      const search = input.search?.trim();
      if (search) {
        conditions.push(or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.dropiRole, `%${search}%`),
          like(users.channel, `%${search}%`),
        ));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (input.page - 1) * input.limit;

      const [targets, countRows] = await Promise.all([
        db
          .select(targetProjection)
          .from(users)
          .where(where)
          .orderBy(asc(users.dropiRole), asc(users.isAIAgent), asc(users.id))
          .limit(input.limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(users).where(where),
      ]);

      return { targets, total: Number(countRows[0]?.count ?? 0) };
    }),

  provisionTestAccounts: adminProcedure
    .input(z.object({
      password: z.string().min(12).max(128),
      zone: z.string().trim().min(1).max(120),
    }))
    .mutation(async ({ input, ctx }) => {
      assertBaseSuperAdmin(ctx);

      try {
        const result = await provisionTestRoleAccounts({
          password: input.password,
          zone: input.zone,
        });
        return {
          roles: result.roles,
          humanAccounts: result.humanAccounts,
          aiAccounts: result.aiAccounts,
          pairedAccounts: result.pairedAccounts,
          identitiesIncludingBaseSuperAdmin: result.identitiesIncludingBaseSuperAdmin,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Test-account provisioning failed";
        if (
          message.includes("password must") ||
          message.includes("zone is required") ||
          message.includes("zone must be")
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Test-account provisioning failed" });
      }
    }),

  enter: adminProcedure
    .input(z.object({ targetUserId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (input.targetUserId === ctx.user!.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "System Administrator cannot enter Phantom Mode as the current administrator identity.",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [target] = await db
        .select({ id: users.id, isActive: users.isActive })
        .from(users)
        .where(eq(users.id, input.targetUserId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Target user not found" });
      }
      if (!target.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Inactive accounts cannot be entered through Phantom Mode." });
      }

      // Reuse the canonical phantom-session implementation rather than creating
      // a second session/audit system. The underlying procedure remains the
      // authority for token lifetime, persisted session state, and critical log.
      return adminAuthRouter.createCaller(ctx).phantomLogin(input);
    }),
});
