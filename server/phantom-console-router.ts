import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import {
  DROPI_TEST_BASE_INBOX,
  TEST_ROLE_IDENTITIES,
} from "../shared/test-role-accounts";
import { adminProcedure, router } from "./_core/trpc";
import { resolveMailTransportConfig } from "./_core/mail";
import { getDb } from "./db";
import { adminAuthRouter, dropiAuthRouter } from "./auth-router";
import {
  getTestAccountProvisioningStatus,
  provisionTestRoleAccounts,
} from "./test-account-provisioning";

const deliveryPartnerTestIdentity = TEST_ROLE_IDENTITIES.find(
  (identity) => identity.role === "delivery_partner",
);

const targetProjection = {
  id: users.id,
  name: users.name,
  email: users.email,
  username: users.username,
  dropiRole: users.dropiRole,
  channel: users.channel,
  zone: users.zone,
  isActive: users.isActive,
  isAIAgent: users.isAIAgent,
  agentMode: users.agentMode,
  humanPairId: users.humanPairId,
} as const;

function requireBaseSuperAdmin(ctx: { user: typeof users.$inferSelect | null; session?: { isPhantom?: boolean | null } | null }) {
  const email = ctx.user?.email?.trim().toLowerCase();
  if (ctx.session?.isPhantom || email !== DROPI_TEST_BASE_INBOX.toLowerCase()) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the real base Super Administrator can provision canonical test-role accounts.",
    });
  }
}

function requireDeliveryPartnerTestEmail(): string {
  if (!deliveryPartnerTestIdentity) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Canonical Delivery Partner test identity is unavailable.",
    });
  }
  return deliveryPartnerTestIdentity.humanEmail;
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
          like(users.username, `%${search}%`),
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

  testAccountControlStatus: adminProcedure.query(async ({ ctx }) => {
    requireBaseSuperAdmin(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const email = requireDeliveryPartnerTestEmail();
    const [deliveryPartner] = await db
      .select({
        id: users.id,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const mailConfig = resolveMailTransportConfig();

    return {
      provisioning: getTestAccountProvisioningStatus(),
      mail: {
        configured: Boolean(mailConfig),
        mode: mailConfig?.mode ?? null,
        from: mailConfig?.from ?? null,
      },
      deliveryPartner: {
        email,
        baseInbox: DROPI_TEST_BASE_INBOX,
        exists: Boolean(deliveryPartner),
        active: Boolean(deliveryPartner?.isActive),
        passwordReady: Boolean(deliveryPartner?.passwordHash),
        emailVerified: Boolean(deliveryPartner?.emailVerified),
      },
    };
  }),

  provisionTestAccounts: adminProcedure
    .input(z.object({}).optional())
    .mutation(async ({ ctx }) => {
      requireBaseSuperAdmin(ctx);
      try {
        const result = await provisionTestRoleAccounts();
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
          message.includes("Test-account provisioning is disabled") ||
          message.includes("Test-account password") ||
          message.includes("test operating zone")
        ) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Test-account provisioning failed" });
      }
    }),

  sendDeliveryPartnerRecoveryProbe: adminProcedure
    .input(z.object({}).optional())
    .mutation(async ({ ctx }) => {
      requireBaseSuperAdmin(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const email = requireDeliveryPartnerTestEmail();
      const [deliveryPartner] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!deliveryPartner) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Canonical Delivery Partner test account is not provisioned. Reconcile test accounts first.",
        });
      }

      // Exercise the exact public recovery implementation. That procedure owns
      // rate limiting, token persistence, provider delivery, failure cleanup and
      // the auth.forgot_password audit event. No recovery code is exposed here.
      await dropiAuthRouter.createCaller(ctx).forgotPassword({ email });
      return {
        accepted: true,
        alias: email,
        baseInbox: DROPI_TEST_BASE_INBOX,
        message: "Recovery request accepted by the canonical password-reset flow. Check the base Gmail inbox.",
      };
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
