import assert from "node:assert/strict";
import test from "node:test";
import {
  PRIVACY_PURPOSES,
  PRIVACY_RETENTION_POLICIES,
  assertConsentChangeAllowed,
  classifyAuditRetention,
  retentionCutoff,
} from "../shared/privacy-policy";

test("every processing purpose declares a lawful basis, data categories and retention mapping", () => {
  assert.ok(PRIVACY_PURPOSES.length > 0);
  for (const purpose of PRIVACY_PURPOSES) {
    assert.ok(purpose.key.length > 0);
    assert.ok(purpose.dataCategories.length > 0);
    assert.ok(purpose.retentionPolicyKeys.length > 0);
    if (purpose.consentRequired) assert.equal(purpose.lawfulBasis, "consent");
    if (purpose.lawfulBasis !== "consent") assert.equal(purpose.consentRequired, false);
  }
});

test("current required DROPi processing cannot be falsely toggled as consent", () => {
  for (const key of ["account_authentication", "delivery_fulfilment", "platform_security_audit", "operational_auditability"]) {
    assert.throws(() => assertConsentChangeAllowed(key, 1), /not controlled by consent/);
  }
});

test("canonical audit retention windows are preserved exactly and account lifecycle stays deferred", () => {
  const byKey = new Map(PRIVACY_RETENTION_POLICIES.map((policy) => [policy.key, policy]));
  assert.equal(byKey.get("audit_operational_2y")?.retentionDays, 730);
  assert.equal(byKey.get("audit_security_5y")?.retentionDays, 1825);
  assert.equal(byKey.get("audit_financial_10y")?.retentionDays, 3650);
  assert.equal(byKey.get("account_rights_lifecycle")?.retentionDays, null);
  assert.equal(byKey.get("account_rights_lifecycle")?.automatic, false);
  assert.equal(byKey.get("account_rights_lifecycle")?.action, "defer_to_rights_workflow");
});

test("audit evidence receives deterministic retention classes", () => {
  assert.equal(classifyAuditRetention("auth.login_failed"), "security");
  assert.equal(classifyAuditRetention("dropiAuth.logout"), "security");
  assert.equal(classifyAuditRetention("admin.phantom_login"), "security");
  assert.equal(classifyAuditRetention("financial.escrow_released"), "financial");
  assert.equal(classifyAuditRetention("marketplace.product.update"), "operational");
});

test("retention cutoff is deterministic and based only on authorized days", () => {
  const now = new Date("2026-09-02T00:00:00.000Z");
  assert.equal(retentionCutoff(now, 730).toISOString(), "2024-09-02T00:00:00.000Z");
});
