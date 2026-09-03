from pathlib import Path
import json


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)

# ---- shared policy: add request-shape guard ----
path = Path("shared/security-baseline-policy.ts")
s = path.read_text()
if "export function assertSafeJsonShape" not in s:
    anchor = "export function redactSensitive(value: unknown, depth = 0): unknown {"
    addition = '''export function assertSafeJsonShape(value: unknown, depth = 0): void {
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
    if (/[\\u0000-\\u001F\\u007F]/.test(key)) {
      throw new Error("Control characters are not allowed in request keys.");
    }
    assertSafeJsonShape(item, depth + 1);
  }
}

'''
    s = replace_once(s, anchor, addition + anchor, "request shape policy")
path.write_text(s)

# ---- HTTP middleware: parse-time structural guard ----
path = Path("server/security-http.ts")
s = path.read_text()
s = replace_once(
    s,
    "  SECURITY_GLOBAL_RATE_WINDOW_MS,\n  isAllowedBrowserOrigin,",
    "  SECURITY_GLOBAL_RATE_WINDOW_MS,\n  assertSafeJsonShape,\n  isAllowedBrowserOrigin,",
    "security-http import",
)
if "export function safeRequestShapeMiddleware" not in s:
    anchor = "export function resetSecurityRateLimitStateForTests(): void {"
    addition = '''export function safeRequestShapeMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body != null) assertSafeJsonShape(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      error: "UNSAFE_REQUEST_SHAPE",
      message: error?.message || "Request shape is not allowed.",
    });
  }
}

'''
    s = replace_once(s, anchor, addition + anchor, "request shape middleware")
path.write_text(s)

# ---- server ingress: install request-shape guard after parsers ----
path = Path("server/_core/index.ts")
s = path.read_text()
s = replace_once(
    s,
    "  httpsOnlyMiddleware,\n  securityHeadersMiddleware,\n  strictCorsMiddleware,",
    "  httpsOnlyMiddleware,\n  safeRequestShapeMiddleware,\n  securityHeadersMiddleware,\n  strictCorsMiddleware,",
    "index security import",
)
s = replace_once(
    s,
    '  app.use(express.urlencoded({ limit: SECURITY_BODY_LIMIT, extended: true }));\n\n  registerStorageProxy(app);',
    '  app.use(express.urlencoded({ limit: SECURITY_BODY_LIMIT, extended: true }));\n  app.use(safeRequestShapeMiddleware);\n\n  registerStorageProxy(app);',
    "index request shape install",
)
path.write_text(s)

# ---- audit redaction: recursively remove secrets and never persist raw exception messages ----
path = Path("server/audit-middleware.ts")
s = path.read_text()
if 'from "../shared/security-baseline-policy"' not in s:
    s = replace_once(
        s,
        'import { createAuditLog } from "./db";\n',
        'import { createAuditLog } from "./db";\nimport { redactSensitive } from "../shared/security-baseline-policy";\n',
        "audit redaction import",
    )
old_fn = '''export function sanitizeAuditInput(input: any): Record<string, unknown> | null {
  if (!input || typeof input !== "object") return null;
  const sanitized = { ...input };
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  delete sanitized.resetToken;
  delete sanitized.fileBase64;
  delete sanitized.apiKey;
  delete sanitized.secret;
  return sanitized;
}'''
new_fn = '''export function sanitizeAuditInput(input: any): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return redactSensitive(input) as Record<string, unknown>;
}'''
s = replace_once(s, old_fn, new_fn, "recursive audit redaction")
s = replace_once(
    s,
    '      errorMsg = error?.message || "unknown_error";',
    '      errorMsg = typeof error?.code === "string" ? error.code : (error?.name || "procedure_error");',
    "safe audit error",
)
path.write_text(s)

# ---- schema + migration journal alignment ----
path = Path("drizzle/schema.ts")
s = path.read_text()
s = replace_once(
    s,
    '  secret: varchar("secret", { length: 128 }).notNull(), // HMAC secret for signature verification',
    '  secret: varchar("secret", { length: 512 }).notNull(), // AES-256-GCM envelope containing HMAC secret',
    "webhook secret schema width",
)
path.write_text(s)

path = Path("drizzle/meta/_journal.json")
data = json.loads(path.read_text())
entries = data["entries"]
if not any(entry.get("tag") == "0018_security_secret_envelopes" for entry in entries):
    entries.append({"idx": 18, "version": "5", "when": 1788400000000, "tag": "0018_security_secret_envelopes", "breakpoints": True})
path.write_text(json.dumps(data, indent=2) + "\n")

# ---- outbound webhook URL policy: HTTPS only and reserved-range denial ----
Path("server/outbound-url-policy.ts").write_text('''import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { sanitizeHttpUrl } from "../shared/security-baseline-policy";

export type ResolvedAddress = { address: string; family: number };
export type AddressResolver = (hostname: string) => Promise<ResolvedAddress[]>;

function ipv4Octets(address: string): number[] | null {
  if (isIP(address) !== 4) return null;
  return address.split(".").map(Number);
}

export function isPrivateOrSpecialIp(address: string): boolean {
  const v4 = ipv4Octets(address);
  if (v4) {
    const [a, b, c] = v4;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("ff")) return true;
    if (lower.startsWith("2001:db8:")) return true;
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice("::ffff:".length);
      return isPrivateOrSpecialIp(mapped);
    }
  }
  return false;
}

async function defaultResolver(hostname: string): Promise<ResolvedAddress[]> {
  return lookup(hostname, { all: true, verbatim: true });
}

export async function validatePublicWebhookUrl(value: string, resolver: AddressResolver = defaultResolver): Promise<string> {
  const normalized = sanitizeHttpUrl(value);
  const parsed = new URL(normalized);
  if (parsed.protocol !== "https:") {
    throw new Error("Webhook endpoints must use HTTPS.");
  }
  const hostname = parsed.hostname.replace(/^\\[|\\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Webhook URL cannot target localhost or local network names.");
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily ? [{ address: hostname, family: literalFamily }] : await resolver(hostname);
  if (addresses.length === 0) throw new Error("Webhook hostname did not resolve to a public address.");
  if (addresses.some(({ address }) => isPrivateOrSpecialIp(address))) {
    throw new Error("Webhook URL resolves to a private, loopback, link-local, documentation, multicast, or reserved address.");
  }
  return parsed.toString();
}
''')

# ---- B2B webhook registration/test: encrypted secret + public HTTPS target ----
path = Path("server/b2b-router.ts")
s = path.read_text()
if 'from "./outbound-url-policy"' not in s:
    s = replace_once(
        s,
        'import { RECEPTION_METHODS, assertB2bTransition } from "../shared/operational-trace-policy";\n',
        'import { RECEPTION_METHODS, assertB2bTransition } from "../shared/operational-trace-policy";\nimport { validatePublicWebhookUrl } from "./outbound-url-policy";\nimport { protectWebhookSigningSecret, revealWebhookSigningSecret } from "./webhook-secret-policy";\n',
        "b2b security imports",
    )
s = replace_once(
    s,
    '      const secret = generateWebhookSecret();\n\n      const result = await db.insert(webhookEndpoints).values({',
    '      const secret = generateWebhookSecret();\n      const validatedUrl = await validatePublicWebhookUrl(input.url);\n      const protectedSecret = protectWebhookSigningSecret(secret);\n\n      const result = await db.insert(webhookEndpoints).values({',
    "webhook register validation",
)
s = replace_once(s, '        url: input.url,\n        events: JSON.stringify(input.events),\n        secret,', '        url: validatedUrl,\n        events: JSON.stringify(input.events),\n        secret: protectedSecret,', "webhook encrypted insert")
s = replace_once(s, '        url: input.url,\n        events: input.events,\n        secret, // Only returned once at creation', '        url: validatedUrl,\n        events: input.events,\n        secret, // Only returned once at creation; persisted value is encrypted', "webhook safe return")
s = replace_once(
    s,
    '      const payloadStr = JSON.stringify(testPayload);\n      const signature = crypto\n        .createHmac("sha256", endpoint[0].secret)',
    '      const payloadStr = JSON.stringify(testPayload);\n      const signingSecret = revealWebhookSigningSecret(endpoint[0].secret);\n      const validatedUrl = await validatePublicWebhookUrl(endpoint[0].url);\n      const signature = crypto\n        .createHmac("sha256", signingSecret)',
    "webhook test secret reveal",
)
s = replace_once(s, '        const response = await fetch(endpoint[0].url, {', '        const response = await fetch(validatedUrl, {', "webhook test public target")
s = replace_once(
    s,
    '          signal: AbortSignal.timeout(10000), // 10s timeout\n        });',
    '          signal: AbortSignal.timeout(10000), // 10s timeout\n          redirect: "error",\n        });',
    "webhook test redirect denial",
)
path.write_text(s)

# ---- webhook send path: revalidate public HTTPS target immediately before network I/O ----
path = Path("server/webhook-trigger.ts")
s = path.read_text()
if 'from "./outbound-url-policy"' not in s:
    s = replace_once(
        s,
        'import { protectWebhookSigningSecret, revealWebhookSigningSecret, webhookSecretNeedsRewrap } from "./webhook-secret-policy";\n',
        'import { protectWebhookSigningSecret, revealWebhookSigningSecret, webhookSecretNeedsRewrap } from "./webhook-secret-policy";\nimport { validatePublicWebhookUrl } from "./outbound-url-policy";\n',
        "webhook trigger URL import",
    )
s = replace_once(
    s,
    '  try {\n    const response = await fetch(endpoint.url, {',
    '  try {\n    const validatedUrl = await validatePublicWebhookUrl(endpoint.url);\n    const response = await fetch(validatedUrl, {',
    "webhook send URL validation",
)
s = replace_once(
    s,
    '      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),\n    });',
    '      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),\n      redirect: "error",\n    });',
    "webhook redirect denial",
)
path.write_text(s)

# ---- tests ----
Path("tests/outbound-url-policy.test.ts").write_text('''import test from "node:test";
import assert from "node:assert/strict";
import { isPrivateOrSpecialIp, validatePublicWebhookUrl } from "../server/outbound-url-policy";

test("private, documentation, multicast and reserved IPv4/IPv6 ranges are blocked", () => {
  for (const address of [
    "127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.1.1", "0.0.0.0",
    "192.0.2.10", "198.51.100.10", "203.0.113.10", "224.0.0.1", "::1", "fd00::1", "fe80::1", "ff02::1", "2001:db8::1",
  ]) assert.equal(isPrivateOrSpecialIp(address), true, address);
  assert.equal(isPrivateOrSpecialIp("8.8.8.8"), false);
  assert.equal(isPrivateOrSpecialIp("2606:4700:4700::1111"), false);
});

test("webhook validation requires HTTPS and rejects local/private DNS answers", async () => {
  await assert.rejects(() => validatePublicWebhookUrl("http://8.8.8.8/hook"), /must use HTTPS/);
  await assert.rejects(() => validatePublicWebhookUrl("https://localhost/hook"), /localhost/);
  await assert.rejects(
    () => validatePublicWebhookUrl("https://example.test/hook", async () => [{ address: "10.1.2.3", family: 4 }]),
    /private, loopback, link-local, documentation, multicast, or reserved/,
  );
});

test("webhook validation accepts an HTTPS hostname only when every DNS answer is public", async () => {
  const url = await validatePublicWebhookUrl("https://hooks.example.test/dropi", async () => [
    { address: "8.8.8.8", family: 4 },
    { address: "2606:4700:4700::1111", family: 6 },
  ]);
  assert.equal(url, "https://hooks.example.test/dropi");
});
''')

# Extend baseline policy tests for structural hardening.
path = Path("tests/security-baseline-policy.test.ts")
s = path.read_text()
s = replace_once(s, '  SECURITY_BODY_LIMIT,\n', '  SECURITY_BODY_LIMIT,\n  assertSafeJsonShape,\n', "policy test import")
if 'request-shape guard rejects prototype-pollution' not in s:
    s += '''\n
test("request-shape guard rejects prototype-pollution keys and excessive nesting", () => {
  assert.throws(() => assertSafeJsonShape({ constructor: { prototype: { polluted: true } } }), /Unsafe object key/);
  let value: any = {};
  for (let i = 0; i < 20; i++) value = { nested: value };
  assert.throws(() => assertSafeJsonShape(value), /nesting exceeds/);
  assert.doesNotThrow(() => assertSafeJsonShape({ orderId: 7, nested: ["safe", { status: "READY" }] }));
});
'''
path.write_text(s)

Path("tests/security-baseline-contract.test.ts").write_text('''import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("server ingress enforces strict CORS, HTTPS, security headers, rate limits and bounded request bodies", () => {
  const index = source("server/_core/index.ts");
  assert.match(index, /securityHeadersMiddleware/);
  assert.match(index, /httpsOnlyMiddleware/);
  assert.match(index, /strictCorsMiddleware/);
  assert.match(index, /apiRateLimitMiddleware/);
  assert.match(index, /safeRequestShapeMiddleware/);
  assert.match(index, /SECURITY_BODY_LIMIT/);
  assert.doesNotMatch(index, /Access-Control-Allow-Origin.*origin/);
  assert.doesNotMatch(index, /50mb/);
});

test("AES-256-GCM webhook secret envelope is schema-aligned and migration is journaled", () => {
  const policy = source("shared/security-baseline-policy.ts");
  const schema = source("drizzle/schema.ts");
  const journal = source("drizzle/meta/_journal.json");
  assert.match(policy, /aes-256-gcm/);
  assert.match(schema, /secret: varchar\("secret", \{ length: 512 \}\)/);
  assert.match(source("drizzle/0018_security_secret_envelopes.sql"), /varchar\(512\)/);
  assert.match(journal, /0018_security_secret_envelopes/);
});

test("webhook registration encrypts at rest and outbound requests are public-HTTPS validated", () => {
  const b2b = source("server/b2b-router.ts");
  const trigger = source("server/webhook-trigger.ts");
  assert.match(b2b, /protectWebhookSigningSecret\(secret\)/);
  assert.match(b2b, /secret: protectedSecret/);
  assert.match(b2b, /revealWebhookSigningSecret\(endpoint\[0\]\.secret\)/);
  assert.match(b2b, /validatePublicWebhookUrl\(input\.url\)/);
  assert.match(b2b, /redirect: "error"/);
  assert.match(trigger, /validatePublicWebhookUrl\(endpoint\.url\)/);
  assert.match(trigger, /redirect: "error"/);
});

test("audit middleware recursively redacts secret-bearing fields and avoids raw exception messages", () => {
  const audit = source("server/audit-middleware.ts");
  assert.match(audit, /redactSensitive\(input\)/);
  assert.doesNotMatch(audit, /delete sanitized\.password/);
  assert.doesNotMatch(audit, /error\?\.message \|\| "unknown_error"/);
});

test("security baseline does not introduce raw SQL execution escape hatches", () => {
  const files = ["server/rest-gateway.ts", "server/b2b-router.ts", "server/db.ts"];
  for (const file of files) {
    const text = source(file);
    assert.doesNotMatch(text, /sql\.raw\s*\(/, file);
    assert.doesNotMatch(text, /unsafe\s*\(/i, file);
  }
});
''')

Path("docs/security/SECURITY_BASELINE.md").parent.mkdir(parents=True, exist_ok=True)
Path("docs/security/SECURITY_BASELINE.md").write_text('''# DROPi Security Baseline — T1

This document records repository-enforced controls for the canonical T1 security module. It does not convert infrastructure assumptions into compliance claims.

## Repository-enforced controls

- **T1.1 — AES-256 at rest:** application-managed webhook signing secrets use versioned AES-256-GCM envelopes. New writes require a deployment keyring; legacy plaintext secrets are rewrapped on use when the keyring is configured.
- **T1.2 — encryption in transit:** production application traffic is HTTPS-only at the application boundary and HSTS is emitted. The Node process is behind the public ingress and therefore cannot independently attest the external TLS protocol version.
- **T1.3 — rate limiting:** global IP-based API throttling is applied before route execution; B2B API keys retain their per-key limits.
- **T1.4 — input sanitization:** request bodies are bounded and structurally checked against prototype-pollution keys/excessive nesting; user-facing text/URL helpers normalize and bound values.
- **T1.5 — SQL injection prevention:** runtime persistence uses Drizzle parameter binding; security contracts reject raw-SQL escape hatches on high-risk surfaces.
- **T1.6 — XSS prevention:** the API emits restrictive CSP, frame denial, no-sniff and referrer controls; the server does not render user HTML.
- **T1.7 — secure key management:** `DROPI_DATA_ENCRYPTION_ACTIVE_KEY_ID` identifies the active write key and `DROPI_DATA_ENCRYPTION_KEYS` contains a JSON keyring of 32-byte base64/base64url keys. Old keys remain decrypt-only during rotation. Secrets must live in the deployment secret store, never in repository files or logs.

## Deployment requirements that must be verified separately

1. The public ingress must enforce the canonical minimum **TLS 1.3**. HTTPS-only application enforcement is not evidence of the negotiated TLS version.
2. The database/volume provider must provide evidence of **AES-256 encryption at rest** for storage not protected by application-level envelopes.
3. Production must configure the DROPi data-encryption keyring before new encrypted-secret writes are used.

Until those deployment facts are evidenced, this repository must not claim complete T1.1/T1.2 infrastructure compliance.
''')

Path(".github/workflows/validate-security-baseline-pr.yml").write_text('''name: Validate Security Baseline

on:
  pull_request:
    paths:
      - "server/**"
      - "shared/security-baseline-policy.ts"
      - "drizzle/**"
      - "tests/security-*.test.ts"
      - "tests/outbound-url-policy.test.ts"
      - "docs/security/**"
      - ".github/workflows/validate-security-baseline-pr.yml"

jobs:
  security-baseline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 9.12.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Security baseline contracts
        run: node --import tsx --test tests/security-baseline-policy.test.ts tests/security-crypto.test.ts tests/outbound-url-policy.test.ts tests/security-baseline-contract.test.ts
      - name: TypeScript
        run: pnpm check
      - name: Whitespace
        run: git diff --check "${{ github.event.pull_request.base.sha }}" "${{ github.event.pull_request.head.sha }}"
''')
