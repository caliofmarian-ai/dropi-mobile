import test from "node:test";
import assert from "node:assert/strict";
import {
  SECURITY_BODY_LIMIT,
  assertSafeJsonShape,
  isAllowedBrowserOrigin,
  parseAllowedOrigins,
  redactSensitive,
  sanitizeHttpUrl,
  sanitizePlainText,
} from "../shared/security-baseline-policy";

test("global body limit remains sufficient for canonical 10MB base64 document upload without retaining 50MB exposure", () => {
  assert.equal(SECURITY_BODY_LIMIT, "16mb");
});

test("production CORS never reflects an unregistered browser origin", () => {
  const allowed = parseAllowedOrigins("https://app.dropi.example,https://admin.dropi.example/", true);
  assert.equal(isAllowedBrowserOrigin(undefined, allowed), true);
  assert.equal(isAllowedBrowserOrigin("https://app.dropi.example", allowed), true);
  assert.equal(isAllowedBrowserOrigin("https://evil.example", allowed), false);
});

test("plain text sanitizer removes control characters and bounds length", () => {
  assert.equal(sanitizePlainText("  hello\u0000world  ", 20), "helloworld");
  assert.equal(sanitizePlainText("123456", 4), "1234");
});

test("URL sanitizer rejects executable schemes and embedded credentials", () => {
  assert.throws(() => sanitizeHttpUrl("javascript:alert(1)"), /HTTP\(S\)/);
  assert.throws(() => sanitizeHttpUrl("https://user:pass@example.com"), /embedded credentials/);
  assert.equal(sanitizeHttpUrl("https://example.com/hook"), "https://example.com/hook");
});

test("recursive redaction removes secret-bearing values without discarding ordinary evidence", () => {
  assert.deepEqual(redactSensitive({ token: "x", nested: { apiKey: "y", orderId: 7 } }), {
    token: "[REDACTED]",
    nested: { apiKey: "[REDACTED]", orderId: 7 },
  });
});


test("request-shape guard rejects prototype-pollution keys and excessive nesting", () => {
  assert.throws(() => assertSafeJsonShape({ constructor: { prototype: { polluted: true } } }), /Unsafe object key/);
  let value: any = {};
  for (let i = 0; i < 20; i++) value = { nested: value };
  assert.throws(() => assertSafeJsonShape(value), /nesting exceeds/);
  assert.doesNotThrow(() => assertSafeJsonShape({ orderId: 7, nested: ["safe", { status: "READY" }] }));
});
