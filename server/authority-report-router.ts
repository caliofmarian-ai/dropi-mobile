import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { auditLogs, b2bDeliveries, deliveries, orders, privacyRetentionRuns } from "../drizzle/schema";
import {
  AUTHORITY_REPORT_DISCLAIMER,
  AUTHORITY_REPORT_TARGETS,
  authorityTemplate,
  csvCell,
  type AuthorityReportTarget,
} from "../shared/authority-report-policy";
import { PRIVACY_RETENTION_POLICIES } from "../shared/privacy-policy";
import { auditInvestigatorProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const authorityTargetSchema = z.enum(AUTHORITY_REPORT_TARGETS);
const auditChannelSchema = z.enum(["C1", "C2", "C3", "ADMIN"]);
const rangeSchema = z.object({
  target: authorityTargetSchema,
  channel: auditChannelSchema,
  from: z.coerce.date(),
  to: z.coerce.date(),
}).refine((value) => value.from <= value.to, {
  message: "Report start date must not be after end date.",
  path: ["from"],
});

type AuthorityPack = Awaited<ReturnType<typeof buildAuthorityEvidencePack>>;

function number(value: unknown) {
  return Number(value || 0);
}

async function groupedCounts(table: any, statusColumn: any, where: any) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({
    status: statusColumn,
    count: sql<number>`count(*)`,
  }).from(table).where(where).groupBy(statusColumn);
  return Object.fromEntries(rows.map((row: any) => [String(row.status), number(row.count)]));
}

export async function buildAuthorityEvidencePack(input: {
  target: AuthorityReportTarget;
  channel: "C1" | "C2" | "C3" | "ADMIN";
  from: Date;
  to: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const template = authorityTemplate(input.target);
  const auditWhere = and(
    eq(auditLogs.channel, input.channel),
    gte(auditLogs.createdAt, input.from),
    lte(auditLogs.createdAt, input.to),
  );
  const safetyWhere = and(
    auditWhere,
    or(
      like(auditLogs.action, "%stop%"),
      like(auditLogs.action, "%fallback%"),
      like(auditLogs.action, "%incident%"),
      like(auditLogs.action, "%emergency%"),
    ),
  );

  const [auditSummaryRows, safetySummaryRows, safetyEvidence, latestRetentionRuns] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      warning: sql<number>`sum(case when ${auditLogs.severity} = 'warning' then 1 else 0 end)`,
      critical: sql<number>`sum(case when ${auditLogs.severity} = 'critical' then 1 else 0 end)`,
      aiActions: sql<number>`sum(case when ${auditLogs.isAIAction} = true then 1 else 0 end)`,
      phantomActions: sql<number>`sum(case when ${auditLogs.isPhantomMode} = true then 1 else 0 end)`,
    }).from(auditLogs).where(auditWhere),
    db.select({
      total: sql<number>`count(*)`,
      warning: sql<number>`sum(case when ${auditLogs.severity} = 'warning' then 1 else 0 end)`,
      critical: sql<number>`sum(case when ${auditLogs.severity} = 'critical' then 1 else 0 end)`,
    }).from(auditLogs).where(safetyWhere),
    db.select({
      id: auditLogs.id,
      createdAt: auditLogs.createdAt,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      severity: auditLogs.severity,
      isAIAction: auditLogs.isAIAction,
      isPhantomMode: auditLogs.isPhantomMode,
    }).from(auditLogs).where(safetyWhere).orderBy(desc(auditLogs.createdAt)).limit(1001),
    db.select({
      id: privacyRetentionRuns.id,
      status: privacyRetentionRuns.status,
      affectedCount: privacyRetentionRuns.affectedCount,
      startedAt: privacyRetentionRuns.startedAt,
      completedAt: privacyRetentionRuns.completedAt,
    }).from(privacyRetentionRuns).orderBy(desc(privacyRetentionRuns.startedAt)).limit(20),
  ]);

  let operationalEvidence: Record<string, unknown>;
  if (input.channel === "C1") {
    const orderWhere = and(gte(orders.createdAt, input.from), lte(orders.createdAt, input.to));
    const deliveryWhere = and(gte(deliveries.createdAt, input.from), lte(deliveries.createdAt, input.to));
    const [orderStatuses, deliveryStatuses] = await Promise.all([
      groupedCounts(orders, orders.status, orderWhere),
      groupedCounts(deliveries, deliveries.status, deliveryWhere),
    ]);
    operationalEvidence = {
      source: "C1 Marketplace orders and delivery execution",
      orderStatuses,
      deliveryStatuses,
    };
  } else if (input.channel === "C2") {
    const b2bWhere = and(gte(b2bDeliveries.createdAt, input.from), lte(b2bDeliveries.createdAt, input.to));
    operationalEvidence = {
      source: "Existing B2B delivery request surface",
      deliveryStatuses: await groupedCounts(b2bDeliveries, b2bDeliveries.status, b2bWhere),
      limitation: "This pack does not claim a COS contract/SLA model that is not yet materialized.",
    };
  } else {
    operationalEvidence = {
      source: "Audit Core only",
      limitation: input.channel === "C3"
        ? "Dedicated C3 operational storage is not yet materialized; no operational counts are invented."
        : "ADMIN is a control/audit channel and does not represent a delivery-order ledger.",
    };
  }

  const auditSummary = auditSummaryRows[0] || {} as any;
  const safetySummary = safetySummaryRows[0] || {} as any;
  const truncated = safetyEvidence.length > 1000;

  return {
    schema: "DROPi_AUTHORITY_EVIDENCE_PACK",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    target: input.target,
    adaptationContext: template.adaptationContext,
    purpose: template.canonicalPurpose,
    disclaimer: AUTHORITY_REPORT_DISCLAIMER,
    scope: {
      channel: input.channel,
      from: input.from.toISOString(),
      to: input.to.toISOString(),
      timezone: "UTC",
    },
    operationalEvidence,
    auditSummary: {
      total: number((auditSummary as any).total),
      warning: number((auditSummary as any).warning),
      critical: number((auditSummary as any).critical),
      aiActions: number((auditSummary as any).aiActions),
      phantomActions: number((auditSummary as any).phantomActions),
    },
    safetySummary: {
      total: number((safetySummary as any).total),
      warning: number((safetySummary as any).warning),
      critical: number((safetySummary as any).critical),
      evidenceRows: truncated ? safetyEvidence.slice(0, 1000) : safetyEvidence,
      truncated,
    },
    privacyAndRetention: {
      policies: PRIVACY_RETENTION_POLICIES,
      latestRetentionRuns,
    },
  };
}

export function serializeAuthorityPackCsv(pack: AuthorityPack): string {
  const rows: Array<[string, string, unknown]> = [
    ["meta", "target", pack.target],
    ["meta", "generatedAt", pack.generatedAt],
    ["scope", "channel", pack.scope.channel],
    ["scope", "from", pack.scope.from],
    ["scope", "to", pack.scope.to],
    ["audit", "total", pack.auditSummary.total],
    ["audit", "warning", pack.auditSummary.warning],
    ["audit", "critical", pack.auditSummary.critical],
    ["audit", "aiActions", pack.auditSummary.aiActions],
    ["audit", "phantomActions", pack.auditSummary.phantomActions],
    ["safety", "total", pack.safetySummary.total],
    ["safety", "warning", pack.safetySummary.warning],
    ["safety", "critical", pack.safetySummary.critical],
    ["operational", "evidence", pack.operationalEvidence],
    ["privacy", "retentionPolicies", pack.privacyAndRetention.policies],
    ["meta", "disclaimer", pack.disclaimer],
  ];
  return [
    ["section", "metric", "value"].map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");
}

export const authorityReportRouter = router({
  templates: auditInvestigatorProcedure.query(() => ({
    targets: AUTHORITY_REPORT_TARGETS,
    disclaimer: AUTHORITY_REPORT_DISCLAIMER,
  })),

  preview: auditInvestigatorProcedure.input(rangeSchema).query(async ({ input }) =>
    buildAuthorityEvidencePack(input)),

  export: auditInvestigatorProcedure
    .input(rangeSchema.safeExtend({ format: z.enum(["json", "csv"]) }))
    .query(async ({ input }) => {
      const { format, ...scope } = input;
      const pack = await buildAuthorityEvidencePack(scope);
      const stamp = pack.generatedAt.replace(/[:.]/g, "-");
      if (format === "csv") {
        return {
          filename: `dropi-${pack.target}-${pack.scope.channel}-${stamp}.csv`,
          contentType: "text/csv;charset=utf-8",
          content: serializeAuthorityPackCsv(pack),
          disclaimer: pack.disclaimer,
        };
      }
      return {
        filename: `dropi-${pack.target}-${pack.scope.channel}-${stamp}.json`,
        contentType: "application/json;charset=utf-8",
        content: JSON.stringify(pack, null, 2),
        disclaimer: pack.disclaimer,
      };
    }),
});
