import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import {
  SECURITY_ENCRYPTION_ALGORITHM,
  SECURITY_ENCRYPTION_ENVELOPE_PREFIX,
} from "../shared/security-baseline-policy";

export type DataEncryptionKeyring = {
  activeKeyId: string;
  keys: Map<string, Buffer>;
};

function decodeKey(value: string): Buffer {
  const trimmed = value.trim();
  const key = Buffer.from(trimmed, /^[A-Za-z0-9_-]+$/.test(trimmed) ? "base64url" : "base64");
  if (key.length !== 32) throw new Error("Every DROPi data-encryption key must decode to exactly 32 bytes (AES-256).");
  return key;
}

export function createDataEncryptionKeyring(input: { activeKeyId: string; keys: Record<string, string> }): DataEncryptionKeyring {
  const activeKeyId = input.activeKeyId.trim();
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(activeKeyId)) throw new Error("Active data-encryption key id is invalid.");
  const keys = new Map<string, Buffer>();
  for (const [id, encoded] of Object.entries(input.keys)) {
    if (!/^[A-Za-z0-9._-]{1,64}$/.test(id)) throw new Error(`Invalid data-encryption key id: ${id}`);
    keys.set(id, decodeKey(encoded));
  }
  if (!keys.has(activeKeyId)) throw new Error("Active data-encryption key id is not present in the keyring.");
  return { activeKeyId, keys };
}

export function loadDataEncryptionKeyring(env: NodeJS.ProcessEnv = process.env): DataEncryptionKeyring | null {
  const activeKeyId = env.DROPI_DATA_ENCRYPTION_ACTIVE_KEY_ID?.trim();
  const rawKeys = env.DROPI_DATA_ENCRYPTION_KEYS?.trim();
  if (!activeKeyId && !rawKeys) return null;
  if (!activeKeyId || !rawKeys) throw new Error("Both DROPI_DATA_ENCRYPTION_ACTIVE_KEY_ID and DROPI_DATA_ENCRYPTION_KEYS are required together.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawKeys);
  } catch {
    throw new Error("DROPI_DATA_ENCRYPTION_KEYS must be a JSON object of key-id to base64/base64url 32-byte key.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("DROPI_DATA_ENCRYPTION_KEYS must be a JSON object.");
  }
  return createDataEncryptionKeyring({ activeKeyId, keys: parsed as Record<string, string> });
}

export function requireDataEncryptionKeyring(env: NodeJS.ProcessEnv = process.env): DataEncryptionKeyring {
  const keyring = loadDataEncryptionKeyring(env);
  if (!keyring) {
    throw new Error("DROPi data encryption is not configured. Set DROPI_DATA_ENCRYPTION_ACTIVE_KEY_ID and DROPI_DATA_ENCRYPTION_KEYS in the deployment secret store.");
  }
  return keyring;
}

function aad(purpose: string): Buffer {
  const normalized = purpose.trim();
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(normalized)) throw new Error("Encryption purpose is invalid.");
  return Buffer.from(`DROPi:${normalized}`, "utf8");
}

export function isEncryptedEnvelope(value: string): boolean {
  return value.startsWith(`${SECURITY_ENCRYPTION_ENVELOPE_PREFIX}:`);
}

export function encryptSensitiveValue(value: string, purpose: string, keyring: DataEncryptionKeyring): string {
  const key = keyring.keys.get(keyring.activeKeyId);
  if (!key) throw new Error("Active encryption key is unavailable.");
  const iv = randomBytes(12);
  const cipher = createCipheriv(SECURITY_ENCRYPTION_ALGORITHM, key, iv);
  cipher.setAAD(aad(purpose));
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    SECURITY_ENCRYPTION_ENVELOPE_PREFIX,
    keyring.activeKeyId,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptSensitiveValue(value: string, purpose: string, keyring: DataEncryptionKeyring): string {
  const parts = value.split(":");
  if (parts.length !== 7 || parts.slice(0, 3).join(":") !== SECURITY_ENCRYPTION_ENVELOPE_PREFIX) {
    throw new Error("Stored value is not a DROPi encrypted envelope.");
  }
  const keyId = parts[3];
  const key = keyring.keys.get(keyId);
  if (!key) throw new Error(`Data-encryption key '${keyId}' is unavailable; keep old keys during rotation.`);
  const iv = Buffer.from(parts[4], "base64url");
  const tag = Buffer.from(parts[5], "base64url");
  const ciphertext = Buffer.from(parts[6], "base64url");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Encrypted envelope metadata is invalid.");
  const decipher = createDecipheriv(SECURITY_ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAAD(aad(purpose));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function encryptedEnvelopeKeyId(value: string): string | null {
  if (!isEncryptedEnvelope(value)) return null;
  const parts = value.split(":");
  return parts.length === 7 ? parts[3] || null : null;
}

export function needsEncryptionRewrap(value: string, keyring: DataEncryptionKeyring): boolean {
  const keyId = encryptedEnvelopeKeyId(value);
  return keyId == null || keyId !== keyring.activeKeyId;
}

export function decryptLegacyOrEncryptedSecret(value: string, purpose: string, keyring: DataEncryptionKeyring): string {
  return isEncryptedEnvelope(value) ? decryptSensitiveValue(value, purpose, keyring) : value;
}
