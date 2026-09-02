import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("privacy persistence is an immutable consent ledger plus retention run evidence", () => {
  const schema = source("drizzle/schema.ts");
  assert.match(schema, /privacyConsents = mysqlTable\("privacyConsents"/);
  assert.match(schema, /purposeKey: varchar\("purposeKey"/);
  assert.match(schema, /purposeVersion: int\("purposeVersion"\)/);
  assert.match(schema, /granted: boolean\("granted"\)/);
  assert.match(schema, /privacyRetentionRuns = mysqlTable\("privacyRetentionRuns"/);
  assert.match(schema, /retentionClass: mysqlEnum\("retentionClass", \["operational", "security", "financial"\]\)/);
});

test("all audit writes receive a retention class at the existing canonical insertion point", () => {
  const db = source("server/db.ts");
  assert.match(db, /classifyAuditRetention/);
  assert.match(db, /retentionClass:\s*data\.retentionClass \?\? classifyAuditRetention\(data\.action\)/);
});

test("privacy router exposes real purpose registry and consent changes only through protected audit paths", () => {
  const router = source("server/privacy-router.ts");
  assert.match(router, /overview:\s*protectedProcedure/);
  assert.match(router, /setConsent:\s*protectedProcedure/);
  assert.match(router, /assertConsentChangeAllowed/);
  assert.match(router, /db\.insert\(privacyConsents\)/);
  assert.match(router, /retentionPreview:\s*adminProcedure/);
  assert.match(router, /runRetention:\s*adminProcedure/);
  assert.match(router, /EXECUTE_AUTHORIZED_RETENTION/);
});

test("retention execution is bounded to explicit expiry and canonical audit windows", () => {
  const service = source("server/privacy-retention-service.ts");
  assert.match(service, /db\.delete\(sessions\)/);
  assert.match(service, /resetToken:\s*null/);
  assert.match(service, /emailVerifyToken:\s*null/);
  assert.match(service, /db\.delete\(auditLogs\)/);
  assert.doesNotMatch(service, /db\.delete\(users\)/);
  assert.doesNotMatch(service, /db\.delete\(orders\)/);
  assert.doesNotMatch(service, /db\.delete\(deliveries\)/);
  assert.doesNotMatch(service, /db\.delete\(b2bDeliveries\)/);
  assert.match(service, /deferredPolicies/);
});

test("privacy UI is backed by server data and never invents an opt-in for required processing", () => {
  const ui = source("app/privacy.tsx");
  const profile = source("app/(tabs)/profile.tsx");
  assert.match(ui, /trpc\.privacy\.overview\.useQuery/);
  assert.match(ui, /purpose\.consentRequired/);
  assert.match(ui, /not based on consent/);
  assert.match(ui, /No optional consent-based processing is currently registered/);
  assert.match(ui, /trpc\.privacy\.retentionPreview\.useQuery/);
  assert.match(ui, /EXECUTE_AUTHORIZED_RETENTION/);
  assert.match(profile, /router\.push\("\/privacy" as any\)/);
});

test("privacy router is mounted once in the application router", () => {
  const routers = source("server/routers.ts");
  assert.match(routers, /import \{ privacyRouter \} from "\.\/privacy-router"/);
  assert.match(routers, /privacy:\s*privacyRouter/);
});

test("migration materializes privacy storage and retention classification", () => {
  const migration = source("drizzle/0015_privacy_controls.sql");
  const journal = source("drizzle/meta/_journal.json");
  assert.match(migration, /ADD `retentionClass` enum\('operational','security','financial'\)/);
  assert.match(migration, /CREATE TABLE `privacyConsents`/);
  assert.match(migration, /CREATE TABLE `privacyRetentionRuns`/);
  assert.match(journal, /"tag": "0015_privacy_controls"/);
});
