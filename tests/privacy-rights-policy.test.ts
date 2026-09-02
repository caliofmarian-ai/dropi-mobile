import assert from "node:assert/strict";
import test from "node:test";
import {
  omitSecretsForSubjectExport,
  privacyErasureIsAllowed,
  redactAuditDetailsForErasure,
  totalPrivacyErasureBlockers,
} from "../shared/privacy-rights-policy";

test("erasure is blocked by any active obligation", () => {
  const blockers = { activeOrders: 1, activeDeliveries: 0, activeB2bDeliveries: 0, activeP2pParcels: 0 };
  assert.equal(totalPrivacyErasureBlockers(blockers), 1);
  assert.equal(privacyErasureIsAllowed(blockers), false);
  assert.equal(privacyErasureIsAllowed({ activeOrders: 0, activeDeliveries: 0, activeB2bDeliveries: 0, activeP2pParcels: 0 }), true);
});

test("subject export omits authentication and integration secrets", () => {
  const exported = omitSecretsForSubjectExport({
    id: 7,
    email: "person@example.test",
    passwordHash: "hash",
    resetToken: "reset",
    emailVerifyToken: "verify",
    token: "session",
    keyHash: "key",
    secret: "secret",
  });
  assert.equal(exported.id, 7);
  assert.equal(exported.email, "person@example.test");
  assert.equal("passwordHash" in exported, false);
  assert.equal("resetToken" in exported, false);
  assert.equal("emailVerifyToken" in exported, false);
  assert.equal("token" in exported, false);
  assert.equal("keyHash" in exported, false);
  assert.equal("secret" in exported, false);
});

test("retained audit details remove direct PII keys but preserve operational facts", () => {
  const redacted = redactAuditDetailsForErasure({
    email: "person@example.test",
    deliveryAddress: "private address",
    status: "completed",
    nested: { phone: "+000", transition: "ready->accepted" },
  }) as any;
  assert.equal(redacted.email, "[ERASED]");
  assert.equal(redacted.deliveryAddress, "[ERASED]");
  assert.equal(redacted.status, "completed");
  assert.equal(redacted.nested.phone, "[ERASED]");
  assert.equal(redacted.nested.transition, "ready->accepted");
});
