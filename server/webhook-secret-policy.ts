import {
  decryptLegacyOrEncryptedSecret,
  encryptSensitiveValue,
  needsEncryptionRewrap,
  requireDataEncryptionKeyring,
  type DataEncryptionKeyring,
} from "./security-crypto";

export const WEBHOOK_SIGNING_SECRET_PURPOSE = "webhook-signing-secret";

export function protectWebhookSigningSecret(rawSecret: string, keyring: DataEncryptionKeyring = requireDataEncryptionKeyring()): string {
  return encryptSensitiveValue(rawSecret, WEBHOOK_SIGNING_SECRET_PURPOSE, keyring);
}

export function revealWebhookSigningSecret(storedSecret: string, keyring: DataEncryptionKeyring = requireDataEncryptionKeyring()): string {
  return decryptLegacyOrEncryptedSecret(storedSecret, WEBHOOK_SIGNING_SECRET_PURPOSE, keyring);
}

export function webhookSecretNeedsRewrap(storedSecret: string, keyring: DataEncryptionKeyring = requireDataEncryptionKeyring()): boolean {
  return needsEncryptionRewrap(storedSecret, keyring);
}
