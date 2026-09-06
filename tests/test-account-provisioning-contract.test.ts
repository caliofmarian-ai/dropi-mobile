import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("IMPL-008 test-account provisioning contract", () => {
  it("uses one canonical provisioning service rather than a second role list", () => {
    const service = source("server/test-account-provisioning.ts");
    const cli = source("scripts/seed-accounts.ts");

    expect(service).toContain('from "../shared/test-role-accounts"');
    expect(service).toContain("for (const identity of TEST_ROLE_IDENTITIES)");
    expect(service).not.toContain("const roles = [");
    expect(cli).toContain('from "../server/test-account-provisioning"');
    expect(cli).not.toContain("customer@dropi.app");
  });

  it("uses server environment as bootstrap-password and zone authority", () => {
    const service = source("server/test-account-provisioning.ts");
    const router = source("server/phantom-console-router.ts");
    const consoleScreen = source("app/admin/phantom-console.tsx");
    const env = source(".env.example");

    expect(service).toContain("getTestAccountProvisioningStatus");
    expect(service).toContain("requireServerProvisioningConfig");
    expect(service).toContain("DROPI_TEST_ACCOUNT_PROVISIONING");
    expect(service).toContain("DROPI_TEST_ACCOUNT_PASSWORD");
    expect(service).toContain("DROPI_TEST_ACCOUNT_ZONE");
    expect(service).toContain("export async function provisionTestRoleAccounts()");
    expect(env).toContain("DROPI_TEST_ACCOUNT_PROVISIONING=");
    expect(env).toContain("DROPI_TEST_ACCOUNT_PASSWORD=");
    expect(env).toContain("DROPI_TEST_ACCOUNT_ZONE=");

    expect(router).toContain("provisionTestRoleAccounts()");
    expect(router).not.toContain("password: z.string().min(12).max(128)");
    expect(router).not.toContain("zone: z.string().trim().min(1).max(120)");
    expect(consoleScreen).toContain("Railway/server environment provides the bootstrap password for newly created test accounts");
    expect(consoleScreen).toContain("JSON.stringify({ json: {} })");
  });

  it("restricts console provisioning to the real base Super Admin and excludes phantom sessions", () => {
    const router = source("server/phantom-console-router.ts");

    expect(router).toContain("requireBaseSuperAdmin(ctx)");
    expect(router).toContain("ctx.session?.isPhantom");
    expect(router).toContain("DROPI_TEST_BASE_INBOX.toLowerCase()");
    expect(router).toContain("Only the real base Super Administrator");
  });

  it("never asks for or transmits the shared test password from the mobile console", () => {
    const consoleScreen = source("app/admin/phantom-console.tsx");

    expect(consoleScreen).not.toContain("provisionPassword");
    expect(consoleScreen).not.toContain("showProvisionPassword");
    expect(consoleScreen).not.toContain("secureTextEntry");
    expect(consoleScreen).not.toContain("Shared test password");
    expect(consoleScreen).toContain("The mobile app never asks for or transmits the bootstrap password");
  });

  it("never hard-codes or prints the legacy shared test password", () => {
    const combined = [
      source("server/test-account-provisioning.ts"),
      source("scripts/seed-accounts.ts"),
      source("shared/test-role-accounts.ts"),
      source("app/admin/phantom-console.tsx"),
    ].join("\n");

    expect(combined).not.toContain("DROPi2026!");
    expect(combined).not.toContain("DROPiAdmin2026!");
    expect(combined).not.toMatch(/console\.(log|error|warn)\([^)]*password/i);
  });

  it("preserves independent existing passwords and uses bootstrap only when a password is missing", () => {
    const service = source("server/test-account-provisioning.ts");

    expect(service).toContain("passwordWriteForTestAccountReconciliation");
    expect(service).toContain("existing.passwordHash");
    expect(service).toContain("input.bootstrapPasswordHash");
    expect(service).toContain(".set({ ...values, ...credentialValues })");
    expect(service).toContain("passwordHash: input.bootstrapPasswordHash");
    expect(service).not.toContain("Reconciliation may rotate the shared test password");
  });

  it("materializes AI pairing from the persisted human row ID inside one transaction", () => {
    const service = source("server/test-account-provisioning.ts");

    expect(service).toContain("await db.transaction(async (tx) =>");
    expect(service).toContain("const humanId = await reconcileIdentity");
    expect(service).toContain("humanPairId: humanId");
    expect(service).toContain('agentMode: input.kind === "ai" ? ("autonomous" as const) : null');
    expect(service).not.toContain("humanPairId: null, // Will be set after");
  });

  it("never manufactures Delivery Partner verification during test-account reconciliation", () => {
    const service = source("server/test-account-provisioning.ts");
    const operational = source("server/pilot-operational-verification.ts");

    expect(service).toContain('import { syncOperationalPilotVerification } from "./pilot-operational-verification"');
    expect(service).toContain('return role !== "delivery_partner"');
    expect(service).toContain("isVerified: verificationDuringReconciliation(input.role)");
    expect(service).not.toContain("isVerified: true,");
    expect(service).toContain('if (pair.role !== "delivery_partner") continue');
    expect(service).toContain("await syncOperationalPilotVerification(pair.humanId)");
    expect(service).toContain("await syncOperationalPilotVerification(pair.aiId)");
    expect(operational).toContain("hasCurrentOperationalPilotVerification");
    expect(operational).toContain("const verified = hasCurrentOperationalPilotVerification");
  });

  it("revokes stale sessions and push registrations when test identities are reconciled", () => {
    const service = source("server/test-account-provisioning.ts");

    expect(service).toContain("pushTokens, sessions, users");
    expect(service).toContain("tx.delete(sessions).where(eq(sessions.userId, userId))");
    expect(service).toContain("tx.delete(pushTokens).where(eq(pushTokens.userId, userId))");
    expect(service).toContain("await clearStaleDeviceAccess(tx, existing.id)");
  });

  it("does not provision over the real base Super Admin identity", () => {
    const service = source("server/test-account-provisioning.ts");
    expect(service).toContain("base Super Admin is intentionally untouched");
    expect(service).not.toContain('email: DROPI_TEST_BASE_INBOX');
  });
});
