import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("IMPL-008 visual demo role boundary", () => {
  it("derives demo roles from the canonical registry without reusing DB-backed test emails", () => {
    const auth = source("lib/auth-context.tsx");

    expect(auth).toContain('import { TEST_ROLE_IDENTITIES } from "@/shared/test-role-accounts"');
    expect(auth).toContain("TEST_ROLE_IDENTITIES.map((identity, index)");
    expect(auth).toContain('const demoEmail = `visual-demo+${identity.role}@dropi.invalid`;');
    expect(auth).toContain("email: demoEmail");
    expect(auth).not.toContain("email: identity.humanEmail");
    expect(auth).not.toContain("customer@dropi.app");
    expect(auth).not.toContain("pilot@dropi.app");
  });

  it("never manufactures a server token for visual demo mode", () => {
    const auth = source("lib/auth-context.tsx");

    expect(auth).toContain("setToken(null)");
    expect(auth).toContain("await AsyncStorage.removeItem(TOKEN_KEY)");
    expect(auth).toContain("await Auth.removeSessionToken()");
    expect(auth).toContain("id: -(index + 1)");
  });

  it("blocks local role switching for real authenticated and phantom sessions", () => {
    const auth = source("lib/auth-context.tsx");
    expect(auth).toContain("if (!isDemo || !user) return");
  });

  it("tells the tester that Demo Mode is read-only and protected writes require a real test account", () => {
    const login = source("app/login.tsx");

    expect(login).toContain("Visual Demo Mode");
    expect(login).toContain("Read-only testing boundary");
    expect(login).toContain("Demo Mode does not create a server session");
    expect(login).toContain("Use a provisioned test-role account for end-to-end testing");
  });
});
