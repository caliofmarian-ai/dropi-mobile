import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { privacyConsents } from "../drizzle/schema";
import {
  PRIVACY_PURPOSES,
  PRIVACY_RETENTION_POLICIES,
  assertConsentChangeAllowed,
} from "../shared/privacy-policy";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { executeAuthorizedPrivacyRetention, previewPrivacyRetention } from "./privacy-retention-service";
import { buildPrivacySubjectExport, executePrivacyErasure, getPrivacyErasurePreview } from "./privacy-rights-service";

function latestConsentByPurpose(rows: Array<typeof privacyConsents.$inferSelect>) {
  const latest = new Map<string, typeof privacyConsents.$inferSelect>();
  for (const row of rows) {
    if (!latest.has(row.purposeKey)) latest.set(row.purposeKey, row);
  }
  return latest;
}

export const privacyRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const rows = await db
      .select()
      .from(privacyConsents)
      .where(eq(privacyConsents.userId, ctx.user!.id))
      .orderBy(desc(privacyConsents.createdAt));
    const latest = latestConsentByPurpose(rows);

    return {
      purposes: PRIVACY_PURPOSES.map((purpose) => ({
        ...purpose,
        retentionPolicies: purpose.retentionPolicyKeys
          .map((key) => PRIVACY_RETENTION_POLICIES.find((policy) => policy.key === key))
          .filter(Boolean),
        consent: purpose.consentRequired
          ? (() => {
              const row = latest.get(purpose.key);
              return row
                ? {
                    granted: row.granted,
                    purposeVersion: row.purposeVersion,
                    changedAt: row.createdAt,
                  }
                : { granted: false, purposeVersion: purpose.version, changedAt: null };
            })()
          : null,
      })),
      hasConsentControlledPurposes: PRIVACY_PURPOSES.some((purpose) => purpose.consentRequired),
    };
  }),

  setConsent: protectedProcedure
    .input(z.object({
      purposeKey: z.string().min(1).max(100),
      purposeVersion: z.number().int().positive(),
      granted: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const purpose = assertConsentChangeAllowed(input.purposeKey, input.purposeVersion);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(privacyConsents).values({
        userId: ctx.user!.id,
        purposeKey: purpose.key,
        purposeVersion: purpose.version,
        granted: input.granted,
        source: "app",
      });
      return { success: true, purposeKey: purpose.key, granted: input.granted };
    }),

  subjectExport: protectedProcedure.query(async ({ ctx }) =>
    buildPrivacySubjectExport(ctx.user!.id)),

  erasurePreview: protectedProcedure.query(async ({ ctx }) =>
    getPrivacyErasurePreview(ctx.user!.id)),

  eraseAccount: protectedProcedure
    .input(z.object({
      confirm: z.literal("ERASE_MY_DROPI_ACCOUNT"),
      currentPassword: z.string().min(8).max(128).optional(),
    }))
    .mutation(async ({ input, ctx }) => executePrivacyErasure({
      userId: ctx.user!.id,
      currentPassword: input.currentPassword,
    })),

  retentionPolicies: adminProcedure.query(() => ({
    policies: PRIVACY_RETENTION_POLICIES,
  })),

  retentionPreview: adminProcedure.query(async () => previewPrivacyRetention()),

  runRetention: adminProcedure
    .input(z.object({ confirm: z.literal("EXECUTE_AUTHORIZED_RETENTION") }))
    .mutation(async ({ ctx }) => executeAuthorizedPrivacyRetention({ actorId: ctx.user!.id })),
});
