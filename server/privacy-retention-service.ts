import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { auditLogs, privacyRetentionRuns, sessions, users } from "../drizzle/schema";
import {
  PRIVACY_RETENTION_POLICIES,
  retentionCutoff,
  type AuditRetentionClass,
} from "../shared/privacy-policy";
import { getDb } from "./db";

export interface RetentionPreview {
  generatedAt: string;
  expiredSessions: number;
  expiredResetCredentials: number;
  expiredVerificationCredentials: number;
  audit: Record<AuditRetentionClass, { retentionDays: number; eligible: number; cutoff: string }>;
  deferredPolicies: string[];
}

async function countRows(query: PromiseLike<Array<{ count: number }>>): Promise<number> {
  const rows = await query;
  return Number(rows[0]?.count || 0);
}

export async function previewPrivacyRetention(now = new Date()): Promise<RetentionPreview> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const operationalPolicy = PRIVACY_RETENTION_POLICIES.find((policy) => policy.key === "audit_operational_2y")!;
  const securityPolicy = PRIVACY_RETENTION_POLICIES.find((policy) => policy.key === "audit_security_5y")!;
  const financialPolicy = PRIVACY_RETENTION_POLICIES.find((policy) => policy.key === "audit_financial_10y")!;

  const operationalCutoff = retentionCutoff(now, operationalPolicy.retentionDays!);
  const securityCutoff = retentionCutoff(now, securityPolicy.retentionDays!);
  const financialCutoff = retentionCutoff(now, financialPolicy.retentionDays!);

  const [
    expiredSessions,
    expiredResetCredentials,
    expiredVerificationCredentials,
    operationalAudit,
    securityAudit,
    financialAudit,
  ] = await Promise.all([
    countRows(db.select({ count: sql<number>`count(*)` }).from(sessions).where(lte(sessions.expiresAt, now))),
    countRows(db.select({ count: sql<number>`count(*)` }).from(users).where(and(
      isNotNull(users.resetToken),
      isNotNull(users.resetTokenExpiry),
      lte(users.resetTokenExpiry, now),
    ))),
    countRows(db.select({ count: sql<number>`count(*)` }).from(users).where(and(
      isNotNull(users.emailVerifyToken),
      isNotNull(users.emailVerifyExpires),
      lte(users.emailVerifyExpires, now),
    ))),
    countRows(db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(and(
      eq(auditLogs.retentionClass, "operational"),
      lte(auditLogs.createdAt, operationalCutoff),
    ))),
    countRows(db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(and(
      eq(auditLogs.retentionClass, "security"),
      lte(auditLogs.createdAt, securityCutoff),
    ))),
    countRows(db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(and(
      eq(auditLogs.retentionClass, "financial"),
      lte(auditLogs.createdAt, financialCutoff),
    ))),
  ]);

  return {
    generatedAt: now.toISOString(),
    expiredSessions,
    expiredResetCredentials,
    expiredVerificationCredentials,
    audit: {
      operational: { retentionDays: operationalPolicy.retentionDays!, eligible: operationalAudit, cutoff: operationalCutoff.toISOString() },
      security: { retentionDays: securityPolicy.retentionDays!, eligible: securityAudit, cutoff: securityCutoff.toISOString() },
      financial: { retentionDays: financialPolicy.retentionDays!, eligible: financialAudit, cutoff: financialCutoff.toISOString() },
    },
    deferredPolicies: PRIVACY_RETENTION_POLICIES.filter((policy) => !policy.automatic).map((policy) => policy.key),
  };
}

export async function executeAuthorizedPrivacyRetention(input: {
  actorId: number;
  now?: Date;
}): Promise<{ preview: RetentionPreview; affected: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = input.now ?? new Date();
  const preview = await previewPrivacyRetention(now);

  await db.delete(sessions).where(lte(sessions.expiresAt, now));

  await db.update(users).set({ resetToken: null, resetTokenExpiry: null }).where(and(
    isNotNull(users.resetToken),
    isNotNull(users.resetTokenExpiry),
    lte(users.resetTokenExpiry, now),
  ));

  await db.update(users).set({ emailVerifyToken: null, emailVerifyExpires: null }).where(and(
    isNotNull(users.emailVerifyToken),
    isNotNull(users.emailVerifyExpires),
    lte(users.emailVerifyExpires, now),
  ));

  for (const retentionClass of ["operational", "security", "financial"] as const) {
    const cutoff = new Date(preview.audit[retentionClass].cutoff);
    await db.delete(auditLogs).where(and(
      eq(auditLogs.retentionClass, retentionClass),
      lte(auditLogs.createdAt, cutoff),
    ));
  }

  const affected =
    preview.expiredSessions +
    preview.expiredResetCredentials +
    preview.expiredVerificationCredentials +
    preview.audit.operational.eligible +
    preview.audit.security.eligible +
    preview.audit.financial.eligible;

  await db.insert(privacyRetentionRuns).values({
    startedBy: input.actorId,
    runMode: "execute",
    status: "completed",
    eligibleCount: affected,
    affectedCount: affected,
    details: preview,
    startedAt: now,
    completedAt: new Date(),
  });

  return { preview, affected };
}
