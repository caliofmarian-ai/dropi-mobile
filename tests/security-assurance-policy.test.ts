import test from "node:test";
import assert from "node:assert/strict";
import {
  hasCurrentOperationalPilotVerification,
  isCurrentOperationalPilotVerification,
  isOperationalPilotDocumentType,
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

test("only driving and drone licenses are qualifying operational pilot documents", () => {
  assert.equal(isOperationalPilotDocumentType("driving_license"), true);
  assert.equal(isOperationalPilotDocumentType("drone_license"), true);
  assert.equal(isOperationalPilotDocumentType("vehicle_registration"), false);
  assert.equal(isOperationalPilotDocumentType("insurance"), false);
  assert.equal(isOperationalPilotDocumentType("background_check"), false);
  assert.equal(isOperationalPilotDocumentType("other"), false);
});

test("approved non-license evidence never grants operational pilot authority", () => {
  const now = new Date("2026-09-06T12:00:00.000Z");
  for (const documentType of ["vehicle_registration", "insurance", "background_check", "other"]) {
    assert.equal(isCurrentOperationalPilotVerification({ status: "approved", documentType }, now), false);
  }
});

test("approved driving or drone license is current only while unexpired", () => {
  const now = new Date("2026-09-06T12:00:00.000Z");
  assert.equal(
    isCurrentOperationalPilotVerification({ status: "approved", documentType: "driving_license" }, now),
    true,
  );
  assert.equal(
    isCurrentOperationalPilotVerification({
      status: "approved",
      documentType: "drone_license",
      expiryDate: new Date("2027-01-01T00:00:00.000Z"),
    }, now),
    true,
  );
  assert.equal(
    isCurrentOperationalPilotVerification({
      status: "approved",
      documentType: "driving_license",
      expiryDate: new Date("2026-09-06T11:59:59.000Z"),
    }, now),
    false,
  );
  assert.equal(
    isCurrentOperationalPilotVerification({
      status: "rejected",
      documentType: "driving_license",
      expiryDate: new Date("2027-01-01T00:00:00.000Z"),
    }, now),
    false,
  );
});

test("one current qualifying license is sufficient among other non-qualifying evidence", () => {
  const now = new Date("2026-09-06T12:00:00.000Z");
  assert.equal(hasCurrentOperationalPilotVerification([
    { status: "approved", documentType: "insurance" },
    { status: "approved", documentType: "driving_license", expiryDate: "2027-06-01T00:00:00.000Z" },
    { status: "rejected", documentType: "drone_license" },
  ], now), true);

  assert.equal(hasCurrentOperationalPilotVerification([
    { status: "approved", documentType: "insurance" },
    { status: "approved", documentType: "driving_license", expiryDate: "2025-06-01T00:00:00.000Z" },
  ], now), false);
});
