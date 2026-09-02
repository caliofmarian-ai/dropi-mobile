import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  auditAccessKind,
  extractDecisionMetadata,
  sanitizeAuditInput,
} from "../server/audit-middleware";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("audit access kind distinguishes reads, writes, streams, and unknown calls", () => {
  assert.equal(auditAccessKind("query"), "READ");
  assert.equal(auditAccessKind("mutation"), "WRITE");
  assert.equal(auditAccessKind("subscription"), "STREAM");
  assert.equal(auditAccessKind("unknown"), "UNKNOWN");
});

test("audit input sanitization removes credentials and opaque payload bodies", () => {
  const sanitized = sanitizeAuditInput({
    orderId: 12,
    action: "approve",
    reason: "verified",
    password: "secret",
    currentPassword: "secret",
    newPassword: "secret",
    token: "secret",
    resetToken: "secret",
    apiKey: "secret",
    secret: "secret",
    fileBase64: "large-body",
  });
  assert.deepEqual(sanitized, { orderId: 12, action: "approve", reason: "verified" });
});

test("mutation decisions are structured without inventing free-text semantics", () => {
  const decision = extractDecisionMetadata("mutation", {
    action: "approve",
    newStatus: "completed",
    reason: "verified",
    unrelated: "context",
  });
  assert.deepEqual(decision, {
    action: "approve",
    newStatus: "completed",
    reason: "verified",
  });
  assert.equal(extractDecisionMetadata("query", { action: "read" }), null);
});

test("central tRPC middleware passes procedure type and captures failures with input when available", () => {
  const trpc = source("server/_core/trpc.ts");
  assert.match(trpc, /procedureType = \(\(opts as any\)\.type \|\| "unknown"\)/);
  assert.match(trpc, /procedureType,/);
  assert.match(trpc, /rawInput = await opts\.getRawInput\(\)/);
  assert.match(trpc, /export const protectedProcedure = t\.procedure\.use\(requireUser\)\.use\(auditLog\)/);
  assert.match(trpc, /export const phantomProcedure = t\.procedure\.use\(requireUser\)\.use\(auditAdminLog\)/);
  assert.match(trpc, /\.use\(auditAdminLog\)/);
});

test("central audit persists actor, device, session, access, AI/human and decision metadata", () => {
  const middleware = source("server/audit-middleware.ts");
  assert.match(middleware, /sessionId: ctx\.session\?\.id != null \? String\(ctx\.session\.id\) : null/);
  assert.match(middleware, /deviceInfo/);
  assert.match(middleware, /accessKind: auditAccessKind\(procedureType\)/);
  assert.match(middleware, /actorKind: isAIAction \? "AI_PERSONAL" : "HUMAN"/);
  assert.match(middleware, /decision: extractDecisionMetadata\(procedureType, sanitizedInput\)/);
  assert.match(middleware, /isAIAction,/);
  assert.match(middleware, /phantomAdminId: attribution\.phantomAdminId/);
});

test("legacy authenticated logout no longer bypasses central audit", () => {
  const routers = source("server/routers.ts");
  assert.match(routers, /logout: protectedProcedure\.mutation/);
  assert.doesNotMatch(routers, /logout: publicProcedure\.mutation/);
});

test("identity-bootstrap public auth mutations retain explicit canonical audit events", () => {
  const auth = source("server/auth-router.ts");
  for (const action of ["auth.register", "auth.login", "auth.login_failed", "auth.forgot_password", "auth.reset_password"]) {
    assert.ok(auth.includes(`action: "${action}"`), `${action} must remain explicitly audited`);
  }
});
