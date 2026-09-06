import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH-379 canonical test-account recovery contract", () => {
  it("reports server provisioning readiness without exposing the secret", () => {
    const service = source("server/test-account-provisioning.ts");
    const router = source("server/phantom-console-router.ts");

    expect(service).toContain("passwordConfigured");
    expect(service).toContain("passwordPolicySatisfied");
    expect(service).toContain("zoneConfigured");
    expect(service).toContain("ready: enabled && passwordConfigured && passwordPolicySatisfied && zoneConfigured");
    expect(router).toContain("testAccountControlStatus");
    expect(router).toContain("getTestAccountProvisioningStatus()");
    expect(router).not.toContain("DROPI_TEST_ACCOUNT_PASSWORD:");
  });

  it("derives the Delivery Partner alias from the canonical role registry", () => {
    const router = source("server/phantom-console-router.ts");
    const registry = source("shared/test-role-accounts.ts");

    expect(router).toContain("TEST_ROLE_IDENTITIES.find");
    expect(router).toContain('identity.role === "delivery_partner"');
    expect(registry).toContain('return `${DROPI_TEST_LOCAL_PART}+${kind}.${role}@${DROPI_TEST_DOMAIN}`');
    expect(router).toContain("baseInbox: DROPI_TEST_BASE_INBOX");
  });

  it("runs the ADMIN recovery probe through the exact public forgot-password procedure", () => {
    const router = source("server/phantom-console-router.ts");
    const auth = source("server/auth-router.ts");

    expect(router).toContain("sendDeliveryPartnerRecoveryProbe");
    expect(router).toContain("dropiAuthRouter.createCaller(ctx).forgotPassword({ email })");
    expect(router).not.toMatch(/resetToken\s*[:=]/);
    expect(auth).toContain("await db.setResetToken(user.id, code, expiry)");
    expect(auth).toContain("db.getUserByLoginIdentifier(normalizedIdentifier)");
    expect(auth).toContain("resolveCanonicalTestRecoveryLabel(normalizedEmail)");
    expect(auth).toContain("const recoveryDeliveryEmail = resolveRecoveryDeliveryEmail(normalizedEmail)");
    expect(auth).toContain("const emailSent = await sendRecoveryEmail(recoveryDeliveryEmail, code, recoveryAccountLabel)");
    expect(auth).toContain("await db.clearResetToken(user.id)");
  });

  it("routes only canonical TEST identities to the governed base inbox", () => {
    const auth = source("server/auth-router.ts");

    expect(auth).toContain("CANONICAL_TEST_ACCOUNT_EMAILS");
    expect(auth).toContain("TEST_ROLE_IDENTITIES.flatMap");
    expect(auth).toContain("? DROPI_TEST_BASE_INBOX");
    expect(auth).toContain(": normalized");
    expect(auth).toContain("recoveryDeliveryRoutedToBaseInbox");
  });

  it("keeps public anti-enumeration behavior intact", () => {
    const auth = source("server/auth-router.ts");

    expect(auth).toContain("Always return generic success to prevent account enumeration");
    expect(auth).toContain('If this account is registered, a 6-digit code has been sent.');
    expect(auth).toContain("Unable to send reset code right now. Please try again later.");
  });

  it("shows only non-secret provider and account readiness in the mobile console", () => {
    const consoleScreen = source("app/admin/phantom-console.tsx");

    expect(consoleScreen).toContain("Canonical test-account control");
    expect(consoleScreen).toContain("Provisioning:");
    expect(consoleScreen).toContain("Mail:");
    expect(consoleScreen).toContain("Delivery Partner recovery diagnostic");
    expect(consoleScreen).toContain("Send real Delivery Partner recovery code");
    expect(consoleScreen).not.toContain("provisionPassword");
    expect(consoleScreen).not.toContain("GMAIL_APP_PASSWORD");
    expect(consoleScreen).not.toContain("RESEND_API_KEY");
    expect(consoleScreen).not.toContain("SMTP_PASS");
  });
});
