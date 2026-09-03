import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("IMPL-010 C1 dashboard live-data contract", () => {
  it("routes all non-transactional C1 roles through the governed live dashboard surface", () => {
    const entry = source("app/(tabs)/index.tsx");

    expect(entry).toContain('import { C1LiveRoleDashboard }');
    for (const role of [
      "support_agent",
      "analyst",
      "compliance_officer",
      "fraud_detection",
      "performance_monitor",
      "incident_responder",
    ]) {
      expect(entry).toContain(`"${role}"`);
    }
    expect(entry).toContain("return <C1LiveRoleDashboard role={user.dropiRole} />");
  });

  it("uses persisted order and audit evidence instead of demo dashboard metrics", () => {
    const router = source("server/dashboard-router.ts");
    const ui = source("components/c1-live-dashboards.tsx");
    const appRouter = source("server/routers.ts");

    expect(router).toContain("orders");
    expect(router).toContain("auditLogs");
    expect(router).toContain('eq(auditLogs.channel, "C1")');
    expect(appRouter).toContain("dashboard: dashboardRouter");
    expect(ui).toContain("trpc.dashboard.c1OperationsSummary.useQuery");
    expect(ui).toContain("trpc.dashboard.c1AuditSummary.useQuery");

    for (const demoLiteral of [
      "TK-001",
      "₱45.2K",
      "97.2%",
      "96.8%",
      "99.9%",
      "230ms",
      "User #4521",
      "DRN-023",
    ]) {
      expect(ui).not.toContain(demoLiteral);
    }
  });

  it("fails closed when a governed persistent source does not exist", () => {
    const ui = source("components/c1-live-dashboards.tsx");

    expect(ui).toContain("does not yet contain a governed Support ticket persistence contract");
    expect(ui).toContain("does not yet contain a governed fraud-case persistence contract");
    expect(ui).toContain("No fallback or demo values are shown");
  });
});
