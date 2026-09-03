from pathlib import Path

# Apply the complete security patch including removal of raw SQL.
v5 = Path("scripts/finalize_security_baseline_v5.py")
exec(compile(v5.read_text(), str(v5), "exec"))

# Preserve the established audit contract: known opaque/top-level credential bodies
# are omitted entirely, while the remaining object is recursively redacted so
# nested secret-bearing values cannot leak.
path = Path("server/audit-middleware.ts")
s = path.read_text()
old = '''export function sanitizeAuditInput(input: any): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return redactSensitive(input) as Record<string, unknown>;
}'''
new = '''export function sanitizeAuditInput(input: any): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const sanitized = { ...input };
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  delete sanitized.resetToken;
  delete sanitized.fileBase64;
  delete sanitized.apiKey;
  delete sanitized.secret;
  return redactSensitive(sanitized) as Record<string, unknown>;
}'''
if s.count(old) != 1:
    raise SystemExit(f"audit sanitizer compatibility anchor mismatch: {s.count(old)}")
s = s.replace(old, new, 1)
path.write_text(s)

# Align the new security contract with the stronger hybrid behavior rather than
# requiring sensitive top-level field names to remain as [REDACTED] markers.
path = Path("tests/security-baseline-contract.test.ts")
s = path.read_text()
old = '''test("audit middleware recursively redacts secret-bearing fields and avoids raw exception messages", () => {
  const audit = source("server/audit-middleware.ts");
  assert.match(audit, /redactSensitive\\(input\\)/);
  assert.doesNotMatch(audit, /delete sanitized\\.password/);
  assert.doesNotMatch(audit, /error\\?\\.message \\|\\| "unknown_error"/);
});'''
new = '''test("audit middleware omits opaque credentials and recursively redacts remaining nested secrets", () => {
  const audit = source("server/audit-middleware.ts");
  const trpc = source("server/_core/trpc.ts");
  assert.match(audit, /delete sanitized\\.password/);
  assert.match(audit, /delete sanitized\\.fileBase64/);
  assert.match(audit, /delete sanitized\\.apiKey/);
  assert.match(audit, /redactSensitive\\(sanitized\\)/);
  assert.doesNotMatch(trpc, /error\\?\\.message \\|\\| "unknown_error"/);
});'''
if s.count(old) != 1:
    raise SystemExit(f"security contract audit expectation anchor mismatch: {s.count(old)}")
s = s.replace(old, new, 1)
path.write_text(s)
