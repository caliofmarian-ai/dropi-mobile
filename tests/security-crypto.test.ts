import test from "node:test";
import assert from "node:assert/strict";
import {
  createDataEncryptionKeyring,
  decryptSensitiveValue,
  encryptSensitiveValue,
  encryptedEnvelopeKeyId,
  isEncryptedEnvelope,
  needsEncryptionRewrap,
} from "../server/security-crypto";
import {
  protectWebhookSigningSecret,
  revealWebhookSigningSecret,
  webhookSecretNeedsRewrap,
} from "../server/webhook-secret-policy";

const keyA = Buffer.alloc(32, 7).toString("base64url");
const keyB = Buffer.alloc(32, 9).toString("base64url");

test("AES-256-GCM envelope encrypts and authenticates a secret", () => {
  const ring = createDataEncryptionKeyring({ activeKeyId: "key-a", keys: { "key-a": keyA } });
  const encrypted = encryptSensitiveValue("whsec_private", "webhook-signing-secret", ring);
  assert.equal(isEncryptedEnvelope(encrypted), true);
  assert.notEqual(encrypted.includes("whsec_private"), true);
  assert.equal(encryptedEnvelopeKeyId(encrypted), "key-a");
  assert.equal(decryptSensitiveValue(encrypted, "webhook-signing-secret", ring), "whsec_private");
  assert.throws(() => decryptSensitiveValue(encrypted, "wrong-purpose", ring));
});

test("rotation keeps old key decrypt-only while new writes use active key", () => {
  const oldRing = createDataEncryptionKeyring({ activeKeyId: "key-a", keys: { "key-a": keyA } });
  const oldEnvelope = encryptSensitiveValue("old-secret", "webhook-signing-secret", oldRing);
  const rotated = createDataEncryptionKeyring({ activeKeyId: "key-b", keys: { "key-a": keyA, "key-b": keyB } });
  assert.equal(decryptSensitiveValue(oldEnvelope, "webhook-signing-secret", rotated), "old-secret");
  assert.equal(needsEncryptionRewrap(oldEnvelope, rotated), true);
  const newEnvelope = encryptSensitiveValue("new-secret", "webhook-signing-secret", rotated);
  assert.equal(encryptedEnvelopeKeyId(newEnvelope), "key-b");
  assert.equal(needsEncryptionRewrap(newEnvelope, rotated), false);
});

test("keyring rejects non-256-bit material and missing active key", () => {
  assert.throws(() => createDataEncryptionKeyring({ activeKeyId: "a", keys: { a: Buffer.alloc(16).toString("base64url") } }), /32 bytes/);
  assert.throws(() => createDataEncryptionKeyring({ activeKeyId: "missing", keys: { a: keyA } }), /not present/);
});

test("legacy webhook secrets remain readable before keyring rollout but cannot be newly protected without a keyring", () => {
  assert.equal(revealWebhookSigningSecret("whsec_legacy", null), "whsec_legacy");
  assert.equal(webhookSecretNeedsRewrap("whsec_legacy", null), false);
  assert.throws(() => protectWebhookSigningSecret("whsec_new", undefined), /data encryption is not configured/);
});

test("encrypted webhook secrets never downgrade to plaintext reads", () => {
  const ring = createDataEncryptionKeyring({ activeKeyId: "key-a", keys: { "key-a": keyA } });
  const encrypted = protectWebhookSigningSecret("whsec_encrypted", ring);
  assert.equal(revealWebhookSigningSecret(encrypted, ring), "whsec_encrypted");
  assert.throws(() => revealWebhookSigningSecret(encrypted, null), /data encryption is required/);
  assert.equal(webhookSecretNeedsRewrap(encrypted, ring), false);
});
