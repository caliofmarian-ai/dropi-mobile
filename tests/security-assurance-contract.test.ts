import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const db = read("server/db.ts");
const auth = read("server/auth-router.ts");
const liveTracking = read("server/live-tracking.ts");
const liveAccess = read("server/live-tracking-access.ts");
const operations = read("server/operations-router.ts");
const orderManagement = read("server/order-management-service.ts");
const assurance = read("docs/security/SECURITY_ASSURANCE.md");
const vulnerability = read("docs/security/VULNERABILITY_MANAGEMENT.md");
const dependabot = read(".github/dependabot.yml");

test("user persistence centrally enforces delivery-partner verification invariants", () => {
  assert.match(db, /resolveUserVerificationForCreate\(data\.dropiRole, data\.isVerified\)/);
  assert.match(db, /verificationPatchForRoleChange\(dropiRole\)/);
  assert.doesNotMatch(db, /isVerified:\s*data\.isVerified\s*\?\?\s*true/);
});

test("security-sensitive account identifiers and one-time codes use cryptographic randomness", () => {
  assert.match(db, /randomUUID\(\)/);
  assert.doesNotMatch(db, /Math\.random\(\)/);
  assert.match(auth, /randomInt\(100000, 1_000_000\)/);
  assert.doesNotMatch(auth, /Math\.random\(\)/);
});

test("live tracking authenticates and derives pilot authority server-side", () => {
  assert.match(liveTracking, /first client message MUST authenticate/i);
  assert.match(liveTracking, /authorizeTrackingSession\(/);
  assert.doesNotMatch(liveTracking, /searchParams\.get\(["']pilotId["']\)/);
  assert.match(liveAccess, /candidate\.dropiRole !== "delivery_partner"/);
  assert.match(liveAccess, /!candidate\.isVerified/);
  assert.match(liveAccess, /resource\.assignedPilotId !== user\.id/);
  assert.match(liveAccess, /resource\.customerId === user\.id/);
  assert.match(liveAccess, /resource\.storeOwnerId === user\.id/);
});

test("Marketplace monetary values are server-derived and stock/order creation is transaction-bound", () => {
  assert.match(orderManagement, /export type MarketplaceOrderLineInput = \{\s*productId: number;\s*quantity: number;\s*\};/);
  assert.match(orderManagement, /const unitPrice = toNumber\(product\.price\);/);
  assert.match(orderManagement, /totalAmount \+= unitPrice \* line\.quantity;/);
  assert.match(orderManagement, /db\.transaction\(async \(tx\) =>/);
  assert.match(orderManagement, /status: "initiated"/);
  assert.match(operations, /placeOrder:\s*protectedProcedure/);
});

test("assurance stays factual where payment-provider and external pen-test evidence do not exist", () => {
  assert.match(assurance, /does not claim payment-provider security certification/i);
  assert.match(assurance, /does not certify an external penetration test/i);
  assert.match(vulnerability, /Completing this checklist internally is \*\*not\*\* an external penetration-test attestation/i);
  assert.match(assurance, /actual TLS protocol negotiated/i);
});

test("dependency review is durable for npm and GitHub Actions", () => {
  assert.match(dependabot, /package-ecosystem: "npm"/);
  assert.match(dependabot, /package-ecosystem: "github-actions"/);
  assert.equal((dependabot.match(/interval: "weekly"/g) || []).length, 2);
});
