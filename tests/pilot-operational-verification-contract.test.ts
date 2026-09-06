import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("delivery verification uses one current-license policy for status and admin review", () => {
  const router = source("server/delivery-verification-router.ts");
  const policy = source("server/user-verification-policy.ts");

  assert.match(policy, /OPERATIONAL_PILOT_DOCUMENT_TYPES/);
  assert.match(policy, /"driving_license"/);
  assert.match(policy, /"drone_license"/);
  assert.match(policy, /record\.status !== "approved"/);
  assert.match(policy, /expiry\.getTime\(\) > now\.getTime\(\)/);

  assert.match(router, /hasCurrentOperationalPilotVerification/);
  assert.match(router, /isVerified: operationallyVerified/);
  assert.match(router, /isFullyVerified: operationallyVerified/);
  assert.match(router, /syncOperationalPilotVerification\(verification\.userId\)/);
  assert.doesNotMatch(router, /approvedCount/);
  assert.doesNotMatch(router, /at least one approved document/i);
});

test("non-license approval cannot claim or materialize mission authority", () => {
  const router = source("server/delivery-verification-router.ts");

  assert.match(router, /Mission access still requires an approved, unexpired driving or drone license/);
  assert.match(router, /This document does not by itself grant mission access/);
  assert.match(router, /becameOperationallyVerified/);
  assert.doesNotMatch(router, /Your .* verification has been approved\. You can now receive delivery missions/);
});

test("loss or expiry of qualifying evidence forces the pilot offline", () => {
  const service = source("server/pilot-operational-verification.ts");

  assert.match(service, /hasCurrentOperationalPilotVerification/);
  assert.match(service, /set\(\{ isVerified: false \}\)/);
  assert.match(service, /pilotProfiles\)\.set\(\{ isAvailable: false \}\)/);
  assert.match(service, /invalidUserIds/);
});

test("authenticated pilot context reconciles only the current pilot and fails closed", () => {
  const context = source("server/_core/context.ts");

  assert.match(context, /if \(user\?\.dropiRole === "delivery_partner"\)/);
  assert.match(context, /syncOperationalPilotVerification\(user\.id\)/);
  assert.match(context, /isVerified: operationallyVerified/);
  assert.match(context, /isVerified: false/);
  assert.doesNotMatch(context, /refreshOperationalPilotVerificationFlags/);
});

test("live tracking production access resolves operational evidence instead of trusting a stale flag", () => {
  const tracking = source("server/live-tracking-access.ts");

  assert.match(tracking, /isOperationalPilotVerified/);
  assert.match(tracking, /DEFAULT_DEPENDENCIES/);
  assert.match(tracking, /isOperationalPilotVerified,/);
  assert.match(tracking, /approved, unexpired driving or drone license/);
});

test("automatic and COS pilot selection refresh and filter operational eligibility", () => {
  const engine = source("server/pilot-rating-engine.ts");
  const core = source("server/pilot-rating-engine-core.ts");

  assert.match(engine, /refreshOperationalPilotVerificationFlags/);
  assert.match(engine, /verifiedUserIds\.has\(candidate\.userId\)/);
  assert.match(engine, /isOperationalPilotVerified\(pilotUserId\)/);
  assert.match(engine, /approved, unexpired driving or drone license/);
  assert.match(core, /calculateCompositeRating/);
  assert.match(core, /recordAssignment/);
});

test("existing mission, availability and notification gates consume the reconciled materialized flag", () => {
  const b2b = source("server/b2b-router.ts");
  const selection = source("server/pilot-selection-router.ts");
  const orderService = source("server/order-management-service.ts");

  assert.match(b2b, /if \(!user\.isVerified\)/);
  assert.match(selection, /if \(!user\.isVerified\)/);
  assert.match(orderService, /eq\(users\.isVerified, true\)/);
});

test("legacy verification-router surface delegates delivery verification to the governed module", () => {
  const legacySurface = source("server/verification-router.ts");

  assert.match(legacySurface, /export \{ verificationRouter \} from "\.\/delivery-verification-router"/);
  assert.doesNotMatch(legacySurface, /uploadDocument:/);
  assert.doesNotMatch(legacySurface, /documentType: z\.enum\(\["driving_license"/);
  assert.match(legacySurface, /roleApplicationRouter/);
});
