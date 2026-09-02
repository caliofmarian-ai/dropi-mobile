import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { auditLogs } from "../drizzle/schema";
import type { AuditChannel } from "./audit-policy";
import { auditInvestigatorProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const auditChannelSchema = z.enum(["C1", "C2", "C3", "ADMIN"]);
const severitySchema = z.enum(["info", "warning", "critical"]);

const auditFiltersSchema = z.object({
  channel: auditChannelSchema,
  userId: z.number().int().positive().optional(),
  action: z.string().trim().min(1).max(255).optional(),
  severity: severitySchema.optional(),
  phantomMode: z.boolean().optional(),
  resourceType: z.string().trim().min(1).max(100).optional(),
  resourceId: z.string().trim().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "Audit start date must not be after end date.",
  path: ["from"],
});

type AuditFilters = z.infer<typeof auditFiltersSchema>;
type AuditRow = typeof auditLogs.$inferSelect;

function buildAuditWhere(input: AuditFilters) {
  const conditions: any[] = [eq(auditLogs.channel, input.channel as AuditChannel)];
  if (input.userId !== undefined) conditions.push(eq(auditLogs.userId, input.userId));
  if (input.action) conditions.push(like(auditLogs.action, `%${input.action}%`));
  if (input.severity) conditions.push(eq(auditLogs.severity, input.severity));
  if (input.phantomMode !== undefined) conditions.push(eq(auditLogs.isPhantomMode, input.phantomMode));
  if (input.resourceType) conditions.push(eq(auditLogs.resourceType, input.resourceType));
  if (input.resourceId) conditions.push(eq(auditLogs.resourceId, input.resourceId));
  if (input.from) conditions.push(gte(auditLogs.createdAt, input.from));
  if (input.to) conditions.push(lte(auditLogs.createdAt, input.to));
  return and(...conditions);
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const CSV_FIELDS: Array<keyof AuditRow> = [
  "id",
  "createdAt",
  "channel",
  "userId",
  "userRole",
  "action",
  "resourceType",
  "resourceId",
  "severity",
  "isAIAction",
  "isPhantomMode",
  "phantomAdminId",
  "ipAddress",
  "userAgent",
  "sessionId",
  "duration",
  "details",
];

export function serializeAuditCsv(rows: AuditRow[]): string {
  const header = CSV_FIELDS.map(csvCell).join(",");
  const body = rows.map((row) => CSV_FIELDS.map((field) => csvCell(row[field])).join(","));
  return [header, ...body].join("\n");
}

export function buildAuditExportPayload(input: {
  format: "json" | "csv";
  channel: AuditChannel;
  filters: Omit<AuditFilters, "channel">;
  rows: AuditRow[];
  truncated: boolean;
  generatedAt?: Date;
}) {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const stamp = generatedAt.replace(/[:.]/g, "-");
  if (input.format === "csv") {
    return {
      filename: `dropi-audit-${input.channel}-${stamp}.csv`,
      contentType: "text/csv;charset=utf-8",
      content: serializeAuditCsv(input.rows),
      rowCount: input.rows.length,
      truncated: input.truncated,
      generatedAt,
    } as const;
  }

  return {
    filename: `dropi-audit-${input.channel}-${stamp}.json`,
    contentType: "application/json;charset=utf-8",
    content: JSON.stringify({
      generatedAt,
      channel: input.channel,
      filters: input.filters,
      rowCount: input.rows.length,
      truncated: input.truncated,
      logs: input.rows,
    }, null, 2),
    rowCount: input.rows.length,
    truncated: input.truncated,
    generatedAt,
  } as const;
}

export const auditRouter = router({
  list: auditInvestigatorProcedure
    .input(auditFiltersSchema.safeExtend({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { logs: [], total: 0 };
      const where = buildAuditWhere(input);
      const offset = (input.page - 1) * input.limit;
      const [logs, countRows] = await Promise.all([
        db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(input.limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
      ]);
      return { logs, total: Number(countRows[0]?.count || 0) };
    }),

  getByUser: auditInvestigatorProcedure
    .input(z.object({
      channel: auditChannelSchema,
      userId: z.number().int().positive(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { logs: [], total: 0 };
      const where = and(eq(auditLogs.channel, input.channel), eq(auditLogs.userId, input.userId));
      const offset = (input.page - 1) * input.limit;
      const [logs, countRows] = await Promise.all([
        db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(input.limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
      ]);
      return { logs, total: Number(countRows[0]?.count || 0) };
    }),

  getByResource: auditInvestigatorProcedure
    .input(z.object({
      channel: auditChannelSchema,
      resourceType: z.string().trim().min(1).max(100),
      resourceId: z.string().trim().min(1).max(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(auditLogs).where(and(
        eq(auditLogs.channel, input.channel),
        eq(auditLogs.resourceType, input.resourceType),
        eq(auditLogs.resourceId, input.resourceId),
      )).orderBy(desc(auditLogs.createdAt));
    }),

  getStats: auditInvestigatorProcedure
    .input(auditFiltersSchema.pick({ channel: true, from: true, to: true }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, warningCount: 0, criticalCount: 0 };
      const conditions: any[] = [eq(auditLogs.channel, input.channel)];
      if (input.from) conditions.push(gte(auditLogs.createdAt, input.from));
      if (input.to) conditions.push(lte(auditLogs.createdAt, input.to));
      const where = and(...conditions);
      const [row] = await db.select({
        total: sql<number>`count(*)`,
        warningCount: sql<number>`sum(case when ${auditLogs.severity} = 'warning' then 1 else 0 end)`,
        criticalCount: sql<number>`sum(case when ${auditLogs.severity} = 'critical' then 1 else 0 end)`,
      }).from(auditLogs).where(where);
      return {
        total: Number(row?.total || 0),
        warningCount: Number(row?.warningCount || 0),
        criticalCount: Number(row?.criticalCount || 0),
      };
    }),

  export: auditInvestigatorProcedure
    .input(auditFiltersSchema.safeExtend({ format: z.enum(["json", "csv"]) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const where = buildAuditWhere(input);
      const result = await db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(5001);
      const truncated = result.length > 5000;
      const rows = truncated ? result.slice(0, 5000) : result;
      const { channel, format, ...filters } = input;
      return buildAuditExportPayload({ format, channel, filters, rows, truncated });
    }),
});
