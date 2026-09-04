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

  it("requires an explicit server-only gate, password, and zone", () => {
    const service = source("server/test-account-provisioning.ts");
    const env = source(".env.example");

    for (const variable of [
      "DROPI_TEST_ACCOUNT_PROVISIONING",
      "DROPI_TEST_ACCOUNT_PASSWORD",
      "DROPI_TEST_ACCOUNT_ZONE",
    ]) {
      expect(service).toContain(variable);
      expect(env).toContain(`${variable}=`);
    }

    expect(service).toContain('!== ENABLE_FLAG');
    expect(env).toContain("never expose it through");
  });

  it("never hard-codes or prints the legacy shared test password", () => {
    const combined = [
      source("server/test-account-provisioning.ts"),
      source("scripts/seed-accounts.ts"),
      source("shared/test-role-accounts.ts"),
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

  it("does not provision over the real base Super Admin identity", () => {
    const service = source("server/test-account-provisioning.ts");
    expect(service).toContain("base Super Admin is intentionally untouched");
    expect(service).not.toContain('email: DROPI_TEST_BASE_INBOX');
  });
});
