export const PRIVACY_EXPORT_SCHEMA_VERSION = 1;

export const TERMINAL_ORDER_STATUSES = ["completed", "cancelled"] as const;
export const TERMINAL_DELIVERY_STATUSES = ["completed", "stopped"] as const;
export const TERMINAL_B2B_STATUSES = ["delivered", "cancelled", "failed"] as const;

export interface PrivacyErasureBlockers {
  activeOrders: number;
  activeDeliveries: number;
  activeB2bDeliveries: number;
  activeP2pParcels: number;
}

export function totalPrivacyErasureBlockers(blockers: PrivacyErasureBlockers): number {
  return blockers.activeOrders +
    blockers.activeDeliveries +
    blockers.activeB2bDeliveries +
    blockers.activeP2pParcels;
}

export function privacyErasureIsAllowed(blockers: PrivacyErasureBlockers): boolean {
  return totalPrivacyErasureBlockers(blockers) === 0;
}

const SENSITIVE_EXPORT_KEYS = new Set([
  "passwordHash",
  "resetToken",
  "emailVerifyToken",
  "token",
  "keyHash",
  "apiKey",
  "secret",
]);

export function omitSecretsForSubjectExport<T extends Record<string, unknown>>(row: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (SENSITIVE_EXPORT_KEYS.has(key)) continue;
    result[key] = value;
  }
  return result as Partial<T>;
}

const ERASURE_PII_KEY_PATTERN = /(^|_)(name|email|phone|address|token|secret|password|device|ip|latitude|longitude|lat|lng)($|_)/i;

function normalizePrivacyKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-.\s]+/g, "_")
    .toLowerCase();
}

export function redactAuditDetailsForErasure(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redactAuditDetailsForErasure(item, depth + 1));
  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    output[key] = ERASURE_PII_KEY_PATTERN.test(normalizePrivacyKey(key))
      ? "[ERASED]"
      : redactAuditDetailsForErasure(nested, depth + 1);
  }
  return output;
}

export const PRIVACY_ERASURE_RETENTION_NOTICE = [
  "Account access and direct identifiers are removed when erasure is executed.",
  "Completed operational, audit and financial evidence may remain in pseudonymized form where retention is required or justified.",
  "Owned stores and listings are closed or deactivated once active obligations are resolved.",
  "Active operations must be resolved before erasure can execute.",
] as const;
