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

  it("supports one-request console input while keeping the CLI fail-closed behind server environment values", () => {
    const service = source("server/test-account-provisioning.ts");
    const router = source("server/phantom-console-router.ts");
    const consoleScreen = source("app/admin/phantom-console.tsx");
    const env = source(".env.example");

    expect(service).toContain("export type ProvisioningConfig");
    expect(service).toContain("config?: ProvisioningConfig");
    expect(service).toContain("requireCliProvisioningConfig");
    expect(service).toContain("DROPI_TEST_ACCOUNT_PROVISIONING");
    expect(env).toContain("DROPI_TEST_ACCOUNT_PROVISIONING=");

    expect(router).toContain("password: z.string().min(12).max(128)");
    expect(router).toContain("zone: z.string().trim().min(1).max(120)");
    expect(router).toContain("provisionTestRoleAccounts({");
    expect(consoleScreen).toContain("No Railway provisioning variables are required for this operator flow.");
    expect(consoleScreen).toContain("JSON.stringify({ json: { password, zone } })");
  });

  it("restricts console provisioning to the real base Super Admin and excludes phantom sessions", () => {
    const router = source("server/phantom-console-router.ts");

    expect(router).toContain("requireBaseSuperAdmin(ctx)");
    expect(router).toContain("ctx.session?.isPhantom");
    expect(router).toContain("DROPI_TEST_BASE_INBOX.toLowerCase()");
    expect(router).toContain("Only the real base Super Administrator");
  });

  it("never persists the operator-entered test password in the audit record", () => {
    const audit = source("server/audit-middleware.ts");
    const consoleScreen = source("app/admin/phantom-console.tsx");

    expect(audit).toContain("delete sanitized.password");
    expect(consoleScreen).toContain("secureTextEntry={!showProvisionPassword}");
    expect(consoleScreen).toContain('setProvisionPassword("")');
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

  it("materializes AI pairing from the persisted human row ID inside one transaction", () => {
    const service = source("server/test-account-provisioning.ts");

    expect(service).toContain("await db.transaction(async (tx) =>");
    expect(service).toContain("const humanId = await reconcileIdentity");
    expect(service).toContain("humanPairId: humanId");
    expect(service).toContain('agentMode: input.kind === "ai" ? ("autonomous" as const) : null');
    expect(service).not.toContain("humanPairId: null, // Will be set after");
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
