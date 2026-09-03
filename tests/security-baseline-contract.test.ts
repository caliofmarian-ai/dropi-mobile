import test from "node:test";
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

test("audit middleware omits opaque credentials and recursively redacts remaining nested secrets", () => {
  const audit = source("server/audit-middleware.ts");
  const trpc = source("server/_core/trpc.ts");
  assert.match(audit, /delete sanitized\.password/);
  assert.match(audit, /delete sanitized\.fileBase64/);
  assert.match(audit, /delete sanitized\.apiKey/);
  assert.match(audit, /redactSensitive\(sanitized\)/);
  assert.doesNotMatch(trpc, /error\?\.message \|\| "unknown_error"/);
});

test("security baseline does not introduce raw SQL execution escape hatches", () => {
  const files = ["server/rest-gateway.ts", "server/b2b-router.ts", "server/db.ts"];
  for (const file of files) {
    const text = source(file);
    assert.doesNotMatch(text, /sql\.raw\s*\(/, file);
    assert.doesNotMatch(text, /unsafe\s*\(/i, file);
  }
});
