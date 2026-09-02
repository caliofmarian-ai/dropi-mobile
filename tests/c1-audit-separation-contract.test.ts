import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("request context carries persisted session attribution", () => {
  const file = source("server/_core/context.ts");
  assert.match(file, /session\?:\s*Session\s*\|\s*null/);
  assert.match(file, /sessionToken\?:\s*string\s*\|\s*null/);
  assert.match(file, /getRequestSessionToken/);
  assert.match(file, /getSessionByToken/);
  assert.match(file, /session,\s*\n\s*sessionToken,/);
});

test("audit middleware uses context session and admin procedures force ADMIN stream", () => {
  const middleware = source("server/audit-middleware.ts");
  const trpc = source("server/_core/trpc.ts");
  assert.match(middleware, /buildAuditAttribution/);
  assert.match(middleware, /ctx\.session/);
  assert.doesNotMatch(middleware, /getSessionByToken/);
  assert.match(trpc, /auditMiddleware\("ADMIN"\)/);
  assert.match(trpc, /\.use\(auditAdminLog\)/);
});

test("audit retrieval is always scoped to one explicit governed channel", () => {
  const audit = source("server/audit-router.ts");
  assert.match(audit, /const auditChannelSchema = z\.enum\(\["C1", "C2", "C3", "ADMIN"\]\)/);
  assert.match(audit, /channel:\s*auditChannelSchema/);
  assert.doesNotMatch(audit, /channel:\s*auditChannelSchema\.optional\(\)/);
  assert.match(audit, /const conditions: any\[\] = \[eq\(auditLogs\.channel, input\.channel as AuditChannel\)\]/);
  assert.match(audit, /phantomMode:\s*z\.boolean\(\)\.optional\(\)/);
  assert.match(audit, /eq\(auditLogs\.isPhantomMode, input\.phantomMode\)/);
});

test("phantom exit restores the persisted administrator rather than trusting target role", () => {
  const auth = source("server/auth-router.ts");
  assert.match(auth, /exitPhantom:\s*phantomProcedure/);
  assert.match(source("server/_core/trpc.ts"), /phantomProcedure = t\.procedure\.use\(requireUser\)\.use\(auditAdminLog\)/);
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

test("audit investigator viewer never defaults to a blended all-channel stream", () => {
  const file = source("app/admin/audit-logs.tsx");
  assert.match(file, /type ChannelFilter = "C1" \| "C2" \| "C3" \| "ADMIN"/);
  assert.match(file, /useState<ChannelFilter>\("C1"\)/);
  assert.match(file, /const filterInput: any = \{ channel \}/);
  assert.match(file, /\{ \.\.\.filterInput, page, limit: 30 \}/);
  assert.match(file, /filterInput\.phantomMode = true/);
  assert.match(file, /const statsInput: any = \{ channel \}/);
  assert.match(file, /trpc\.audit\.getStats\.useQuery\(statsInput/);
  assert.doesNotMatch(file, /logs\.filter\(\(l: any\) => l\.isPhantomMode\)/);
});
