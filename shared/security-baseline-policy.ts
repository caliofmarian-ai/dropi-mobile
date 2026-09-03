export const SECURITY_BODY_LIMIT = "16mb";
export const SECURITY_GLOBAL_RATE_WINDOW_MS = 60_000;
export const SECURITY_GLOBAL_RATE_MAX = 300;
export const SECURITY_AUTH_RATE_MAX = 60;
export const SECURITY_ENCRYPTION_ALGORITHM = "aes-256-gcm" as const;
export const SECURITY_ENCRYPTION_ENVELOPE_PREFIX = "dropi:enc:v1" as const;

export const SENSITIVE_KEY_PATTERN = /(password|passwd|secret|token|authorization|cookie|api.?key|private.?key|credential|database.?url|jwt)/i;

export function parseAllowedOrigins(raw: string | undefined, isProduction: boolean): Set<string> {
  const values = (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/\/$/, ""));
  const origins = new Set(values);
  if (!isProduction) {
    origins.add("http://localhost:8081");
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:8081");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
}

export function isAllowedBrowserOrigin(origin: string | undefined, allowedOrigins: Set<string>): boolean {
  if (!origin) return true;
  return allowedOrigins.has(origin.replace(/\/$/, ""));
}

export function sanitizePlainText(value: string, maxLength: number): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeHttpUrl(value: string): string {
  const trimmed = value.trim();
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP(S) URLs are allowed.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs containing embedded credentials are not allowed.");
  }
  return parsed.toString();
}

export function assertSafeJsonShape(value: unknown, depth = 0): void {
  if (depth > 16) throw new Error("Request nesting exceeds the security limit.");
  if (Array.isArray(value)) {
    if (value.length > 5000) throw new Error("Request array exceeds the security limit.");
    for (const item of value) assertSafeJsonShape(item, depth + 1);
    return;
  }
  if (!value || typeof value !== "object") return;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 2000) throw new Error("Request object exceeds the security limit.");
  for (const [key, item] of entries) {
    if (/^(?:__proto__|prototype|constructor)$/i.test(key)) {
      throw new Error("Unsafe object key is not allowed.");
    }
    if (/[\u0000-\u001F\u007F]/.test(key)) {
      throw new Error("Control characters are not allowed in request keys.");
    }
    assertSafeJsonShape(item, depth + 1);
  }
}

export function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[REDACTED_DEPTH]";
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item, depth + 1));
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : redactSensitive(item, depth + 1);
  }
  return result;
}
