import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("request context carries persisted session attribution", () => {
  const file = source("server/_core/context.ts");
  assert.match(file, /session:\s*Session\s*\|\s*null/);
  assert.match(file, /sessionToken:\s*string\s*\|\s*null/);
  assert.match(file, /getRequestSessionToken/);
  assert.match(file, /getSessionByToken/);
});

test("audit middleware uses context session and admin procedures force ADMIN stream", () => {
  const middleware = source("server/audit-middleware.ts");
  const trpc = source("server/_core/trpc.ts");
  assert.match(middleware, /buildAuditAttribution/);
  assert.match(middleware, /ctx\.session/);
  assert.doesNotMatch(middleware, /getSessionByToken/);
  assert.match(trpc, /channelOverride:\s*"ADMIN"/);
});

test("audit retrieval is always scoped to one explicit channel", () => {
  const db = source("server/db.ts");
  const auth = source("server/auth-router.ts").split("// ===== AUDIT ROUTER =====")[1] || "";
  assert.match(db, /listAuditLogs\(opts:\s*\{\s*channel:\s*AuditChannel/);
  assert.match(db, /phantomMode\?:\s*boolean/);
  assert.match(db, /eq\(auditLogs\.channel,\s*opts\.channel/);
  assert.match(db, /eq\(auditLogs\.isPhantomMode,\s*opts\.phantomMode/);
  assert.match(auth, /channel:\s*z\.enum\(\["C1",\s*"C2",\s*"C3",\s*"ADMIN"\]\),/);
  assert.doesNotMatch(auth, /channel:\s*z\.enum\(\["C1",\s*"C2",\s*"C3",\s*"ADMIN"\]\)\.optional\(\)/);
  assert.match(auth, /phantomMode:\s*z\.boolean\(\)\.optional\(\)/);
});

test("phantom exit restores the persisted administrator rather than trusting target role", () => {
  const auth = source("server/auth-router.ts");
  assert.match(auth, /exitPhantom:\s*protectedProcedure/);
  assert.match(auth, /requirePhantomAdminId\(ctx\.session\)/);
  assert.match(auth, /db\.getUserById\(phantomAdminId\)/);
  assert.match(auth, /db\.deleteSessionByToken\(ctx\.sessionToken\)/);
  assert.match(auth, /db\.createSession\(\{/);
});

test("phantom JWTs are session-bound and use the two-hour phantom lifetime", () => {
  const sdk = source("server/_core/sdk.ts");
  const auth = source("server/auth-router.ts");
  assert.match(sdk, /phantomAdminId\?:\s*number/);
  assert.match(sdk, /getSessionByToken\(sessionCookie/);
  assert.match(sdk, /persistedPhantomSession/);
  assert.match(auth, /expiresInMs:\s*2\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.match(auth, /phantomAdminId:\s*user\.id/);
});

test("C1 domain audit events preserve phantom attribution", () => {
  const p2p = source("server/p2p-router.ts");
  const orders = source("server/order-management-service.ts");
  const operations = source("server/operations-router.ts");
  assert.match(p2p, /buildAuditAttribution\("C1",\s*input\.session\)/);
  assert.match(p2p, /isPhantomMode:\s*attribution\.isPhantomMode/);
  assert.match(orders, /buildAuditAttribution\("C1",\s*input\.auditSession\)/);
  assert.match(orders, /isPhantomMode:\s*attribution\.isPhantomMode/);
  assert.match(operations, /auditSession:\s*ctx\.session/);
});

test("admin audit viewer never defaults to a blended all-channel stream", () => {
  const file = source("app/admin/audit-logs.tsx");
  assert.match(file, /type ChannelFilter = "C1" \| "C2" \| "C3" \| "ADMIN"/);
  assert.match(file, /useState<ChannelFilter>\("C1"\)/);
  assert.match(file, /const queryInput: any = \{ page, limit: 30, channel \}/);
  assert.match(file, /phantomMode = true/);
  assert.match(file, /trpc\.audit\.getStats\.useQuery\(\{ channel \}\)/);
  assert.doesNotMatch(file, /logs\.filter\(\(l: any\) => l\.isPhantomMode\)/);
});
