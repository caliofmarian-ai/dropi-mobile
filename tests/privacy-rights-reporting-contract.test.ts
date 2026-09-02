import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd());
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("erasure preserves retained evidence instead of deleting the user row or historical orders", () => {
  const service = source("server/privacy-rights-service.ts");
  assert.match(service, /privacyErasureIsAllowed/);
  assert.match(service, /bcrypt\.compare/);
  assert.match(service, /update\(users\)/);
  assert.doesNotMatch(service, /delete\(users\)/);
  assert.doesNotMatch(service, /delete\(orders\)/);
  assert.doesNotMatch(service, /delete\(auditLogs\)/);
  assert.match(service, /redactAuditDetailsForErasure/);
  assert.match(service, /notInArray\(orders\.status/);
  assert.match(service, /notInArray\(b2bDeliveries\.status/);
});

test("subject export excludes third-party B2B contacts and authentication secrets", () => {
  const service = source("server/privacy-rights-service.ts");
  const exportSection = service.slice(service.indexOf("export async function buildPrivacySubjectExport"), service.indexOf("export async function executePrivacyErasure"));
  assert.doesNotMatch(exportSection, /pickupContactName|pickupContactPhone|deliveryContactName|deliveryContactPhone/);
  assert.match(exportSection, /omitSecretsForSubjectExport/);
  assert.match(exportSection, /detailsExcluded: true/);
});

test("authority reports remain investigator-only and channel-scoped", () => {
  const router = source("server/authority-report-router.ts");
  assert.match(router, /auditInvestigatorProcedure/);
  assert.match(router, /channel: auditChannelSchema/);
  assert.match(router, /eq\(auditLogs\.channel, input\.channel\)/);
  assert.match(router, /not an official/i);
  assert.match(router, /Dedicated C3 operational storage is not yet materialized/);
});

test("application router exposes one privacy namespace and one authority-report namespace", () => {
  const routers = source("server/routers.ts");
  assert.match(routers, /privacy: privacyRouter/);
  assert.match(routers, /authorityReports: authorityReportRouter/);
});

test("privacy UI provides subject export and guarded erasure controls", () => {
  const ui = source("app/privacy.tsx");
  assert.match(ui, /Export My Data/);
  assert.match(ui, /ERASE_MY_DROPI_ACCOUNT/);
  assert.match(ui, /erasurePreview/);
});
