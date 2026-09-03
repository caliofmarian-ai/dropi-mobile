import {
  decryptLegacyOrEncryptedSecret,
  encryptSensitiveValue,
  isEncryptedEnvelope,
  loadDataEncryptionKeyring,
  needsEncryptionRewrap,
  requireDataEncryptionKeyring,
  type DataEncryptionKeyring,
} from "./security-crypto";

export const WEBHOOK_SIGNING_SECRET_PURPOSE = "webhook-signing-secret";

/**
 * New webhook signing secrets always require the deployment keyring and are
 * persisted as AES-256-GCM envelopes. There is no plaintext write fallback.
 */
export function protectWebhookSigningSecret(
  rawSecret: string,
  keyring: DataEncryptionKeyring = requireDataEncryptionKeyring(),
): string {
  return encryptSensitiveValue(rawSecret, WEBHOOK_SIGNING_SECRET_PURPOSE, keyring);
}

/**
 * Legacy plaintext values remain readable during a controlled rollout so an
 * existing integration is not broken merely because the new keyring has not
 * yet been configured. Encrypted envelopes never downgrade: they require the
 * matching keyring and fail closed when the key is unavailable.
 */
export function revealWebhookSigningSecret(
  storedSecret: string,
  keyring: DataEncryptionKeyring | null = loadDataEncryptionKeyring(),
): string {
  if (!isEncryptedEnvelope(storedSecret)) return storedSecret;
  if (!keyring) {
    throw new Error(
      "DROPi data encryption is required to read this encrypted webhook secret. Configure the deployment keyring.",
    );
  }
  return decryptLegacyOrEncryptedSecret(storedSecret, WEBHOOK_SIGNING_SECRET_PURPOSE, keyring);
}

/**
 * A legacy value is rewrapped opportunistically only when a keyring exists.
 * Without a keyring, reads remain backward-compatible while new encrypted
 * writes stay blocked by protectWebhookSigningSecret().
 */
export function webhookSecretNeedsRewrap(
  storedSecret: string,
  keyring: DataEncryptionKeyring | null = loadDataEncryptionKeyring(),
): boolean {
  if (!keyring) return false;
  return needsEncryptionRewrap(storedSecret, keyring);
}
