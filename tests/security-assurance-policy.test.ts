import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveUserVerificationForCreate,
  verificationPatchForRoleChange,
} from "../server/user-verification-policy";

test("delivery partners cannot be created as verified by omission or explicit request", () => {
  assert.equal(resolveUserVerificationForCreate("delivery_partner"), false);
  assert.equal(resolveUserVerificationForCreate("delivery_partner", true), false);
  assert.equal(resolveUserVerificationForCreate("delivery_partner", false), false);
});

test("non-delivery roles retain the existing default and explicit verification semantics", () => {
  assert.equal(resolveUserVerificationForCreate("customer"), true);
  assert.equal(resolveUserVerificationForCreate("merchant", true), true);
  assert.equal(resolveUserVerificationForCreate("merchant", false), false);
});

test("role escalation into delivery_partner invalidates inherited verification", () => {
  assert.deepEqual(verificationPatchForRoleChange("delivery_partner"), { isVerified: false });
  assert.deepEqual(verificationPatchForRoleChange("customer"), {});
  assert.deepEqual(verificationPatchForRoleChange("system_administrator"), {});
});
