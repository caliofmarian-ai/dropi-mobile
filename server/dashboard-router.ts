import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { auditLogs, orders } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const C1_READ_ROLES = new Set([
  "support_agent",
  "analyst",
  "compliance_officer",
  "fraud_detection",
  "performance_monitor",
  "incident_responder",
]);

function assertC1DashboardAccess(user: { dropiRole?: string | null } | null | undefined) {
  if (!user?.dropiRole || !C1_READ_ROLES.has(user.dropiRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "C1 dashboard read access denied" });
  }
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export const dashboardRouter = router({
  c1OperationsSummary: protectedProcedure.query(async ({ ctx }) => {
    assertC1DashboardAccess(ctx.user as any);
    const db = await getDb();
    if (!db) {
      return {
        availability: "database_unavailable" as const,
        totalOrders: null,
        completedOrders: null,
        completedRevenue: null,
        averageDeliveryMinutes: null,
        completionRate: null,
      };
    }

    const [row] = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        completedOrders: sql<number>`SUM(CASE WHEN ${orders.status} = 'completed' THEN 1 ELSE 0 END)`,
        completedRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} = 'completed' THEN ${orders.totalAmount} ELSE 0 END), 0)`,
        averageDeliveryMinutes: sql<string | null>`AVG(CASE WHEN ${orders.status} = 'completed' AND ${orders.actualTime} IS NOT NULL THEN ${orders.actualTime} END)`,
      })
      .from(orders);

    const totalOrders = asNumber(row?.totalOrders);
    const completedOrders = asNumber(row?.completedOrders);
    const completedRevenue = asNumber(row?.completedRevenue);
    const averageDeliveryMinutes = row?.averageDeliveryMinutes == null ? null : asNumber(row.averageDeliveryMinutes);

    return {
      availability: "available" as const,
      totalOrders,
      completedOrders,
      completedRevenue,
      averageDeliveryMinutes,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : null,
    };
  }),

  c1AuditSummary: protectedProcedure.query(async ({ ctx }) => {
    assertC1DashboardAccess(ctx.user as any);
    const db = await getDb();
    if (!db) {
      return {
        availability: "database_unavailable" as const,
        periodDays: 30,
        totalEvents: null,
        warnings: null,
        critical: null,
        recentAlerts: [],
      };
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [counts] = await db
      .select({
        totalEvents: sql<number>`COUNT(*)`,
        warnings: sql<number>`SUM(CASE WHEN ${auditLogs.severity} = 'warning' THEN 1 ELSE 0 END)`,
        critical: sql<number>`SUM(CASE WHEN ${auditLogs.severity} = 'critical' THEN 1 ELSE 0 END)`,
      })
      .from(auditLogs)
      .where(and(eq(auditLogs.channel, "C1"), gte(auditLogs.createdAt, since)));

    const recent = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        severity: auditLogs.severity,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.channel, "C1"),
          gte(auditLogs.createdAt, since),
          or(eq(auditLogs.severity, "warning"), eq(auditLogs.severity, "critical")),
        ),
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(8);

    return {
      availability: "available" as const,
      periodDays: 30,
      totalEvents: asNumber(counts?.totalEvents),
      warnings: asNumber(counts?.warnings),
      critical: asNumber(counts?.critical),
      recentAlerts: recent.map((event) => ({
        id: event.id,
        title: `${event.action} — ${event.resourceType}${event.resourceId ? ` ${event.resourceId}` : ""}`,
        severity: event.severity,
        occurredAt: event.createdAt.toISOString(),
      })),
    };
  }),
});
