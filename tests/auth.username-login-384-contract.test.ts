import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("AUTH-384 username login contract", () => {
  it("adds a unique nullable username and migration", () => {
    const schema = source("drizzle/schema.ts");
    const migration = source("drizzle/0023_usernames.sql");
    const journal = source("drizzle/meta/_journal.json");
    expect(schema).toContain('username: varchar("username", { length: 64 }).unique()');
    expect(migration).toContain('UNIQUE(`username`)');
    expect(journal).toContain('"tag": "0023_usernames"');
  });

  it("provisions deterministic human and AI usernames", () => {
    const registry = source("shared/test-role-accounts.ts");
    const provisioning = source("server/test-account-provisioning.ts");
    expect(registry).toContain('return `${kind}.${role}`');
    expect(provisioning).toContain("username: identity.humanUsername");
    expect(provisioning).toContain("username: identity.aiUsername");
  });

  it("uses normalized email-or-username lookup for login and recovery", () => {
    const auth = source("server/auth-router.ts");
    const db = source("server/db.ts");
    expect(auth).toContain("identifier: z.string().trim().min(3).max(320)");
    expect(auth).toContain("db.getUserByLoginIdentifier(normalizedIdentifier)");
    expect(db).toContain("or(eq(users.email, normalized), eq(users.username, normalized))");
    expect(auth).toContain("forgotPassword: publicProcedure.input(forgotPasswordSchema)");
    expect(auth).toContain("const forgotPasswordSchema = z.union([");
    expect(auth).toContain("z.object({ identifier: z.string().trim().min(3).max(320) })");
    expect(auth).toContain("Always return generic success to prevent account enumeration");
    expect(auth).not.toContain("getUserById(Number(input.identifier))");
  });

  it("updates mobile login wording and transport", () => {
    const screen = source("app/login.tsx");
    const context = source("lib/auth-context.tsx");
    expect(screen).toContain("Email or Username");
    expect(context).toContain('apiCall("dropiAuth.login", { identifier: normalizedIdentifier, password })');
  });
});
