import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildAuditExportPayload, serializeAuditCsv } from "../server/audit-router";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const row: any = {
  id: 7,
  userId: 42,
  userRole: "audit_manager",
  action: 'order.status_transition,"quoted"',
  resourceType: "order",
  resourceId: "88",
  details: { reason: 'customer said "ok"' },
  severity: "warning",
  latitude: null,
  longitude: null,
  channel: "C1",
  isAIAction: false,
  isPhantomMode: false,
  phantomAdminId: null,
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
  sessionId: "12",
  duration: 15,
  createdAt: new Date("2026-09-02T15:00:00.000Z"),
};

test("CSV export uses stable columns and RFC-style quote escaping", () => {
  const csv = serializeAuditCsv([row]);
  const lines = csv.split("\n");
  assert.equal(lines.length, 2);
  assert.match(lines[0], /"id","createdAt","channel","userId"/);
  assert.ok(lines[1].includes('"order.status_transition,""quoted"""'));
  assert.ok(lines[1].includes("reason"));
  assert.ok(lines[1].includes("customer said"));
  assert.ok(lines[1].includes('""ok""'));
});

test("JSON export carries channel, filters, truncation and evidence rows", () => {
  const payload = buildAuditExportPayload({
    format: "json",
    channel: "C1",
    filters: { action: "order", severity: "warning" },
    rows: [row],
    truncated: true,
    generatedAt: new Date("2026-09-02T15:30:00.000Z"),
  });
  assert.equal(payload.contentType, "application/json;charset=utf-8");
  assert.match(payload.filename, /^dropi-audit-C1-2026-09-02T15-30-00-000Z\.json$/);
  assert.equal(payload.rowCount, 1);
  assert.equal(payload.truncated, true);
  const parsed = JSON.parse(payload.content);
  assert.equal(parsed.channel, "C1");
  assert.equal(parsed.filters.action, "order");
  assert.equal(parsed.logs[0].id, 7);
});

test("Audit investigator authority is limited to Owner and Auditor and self-audits in ADMIN", () => {
  const trpc = source("server/_core/trpc.ts");
  assert.match(trpc, /dropiRole === "system_administrator"/);
  assert.match(trpc, /dropiRole === "audit_manager" && channel === "ADMIN"/);
  assert.doesNotMatch(trpc, /dropiRole === "security_officer"/);
  assert.match(trpc, /Inactive accounts cannot access Audit Core/);
  assert.match(trpc, /auditInvestigatorProcedure = t\.procedure\.use\(requireAuditInvestigator\)\.use\(auditAdminLog\)/);
});

test("investigator router provides multi-criteria, paginated, channel-scoped JSON/CSV retrieval", () => {
  const router = source("server/audit-router.ts");
  for (const token of ["userId", "action", "severity", "phantomMode", "resourceType", "resourceId", "from", "to", "channel"]) {
    assert.ok(router.includes(token), `${token} filter is required`);
  }
  assert.match(router, /page: z\.number\(\)\.int\(\)\.min\(1\)\.default\(1\)/);
  assert.match(router, /limit: z\.number\(\)\.int\(\)\.min\(1\)\.max\(100\)\.default\(50\)/);
  assert.match(router, /format: z\.enum\(\["json", "csv"\]\)/);
  assert.match(router, /\.limit\(5001\)/);
  assert.match(router, /result\.slice\(0, 5000\)/);
  const exportBlock = router.split("export: auditInvestigatorProcedure")[1] || "";
  assert.match(exportBlock, /\.query\(/);
  assert.doesNotMatch(exportBlock, /\.mutation\(/);
});

test("only the dedicated audit router is mounted", () => {
  const routers = source("server/routers.ts");
  const auth = source("server/auth-router.ts");
  assert.match(routers, /import \{ auditRouter \} from "\.\/audit-router"/);
  assert.doesNotMatch(routers, /auditRouter \} from "\.\/auth-router"/);
  assert.doesNotMatch(auth, /export const auditRouter/);
});

test("investigator UI is real, read-only, role-gated and exports both canonical formats", () => {
  const ui = source("app/admin/audit-logs.tsx");
  assert.match(ui, /user\.dropiRole === "system_administrator" \|\| user\.dropiRole === "audit_manager"/);
  assert.match(ui, /!isDemo/);
  assert.doesNotMatch(ui, /Security Officer/);
  assert.doesNotMatch(ui, /in production/i);
  assert.match(ui, /new Blob\(/);
  assert.match(ui, /Share\.share\(/);
  assert.match(ui, /Export \{format\.toUpperCase\(\)\}/);
  assert.match(ui, /From UTC YYYY-MM-DD/);
  assert.match(ui, /Actor user ID/);
  assert.match(ui, /Resource type/);
});
