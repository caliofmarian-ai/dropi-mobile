import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("account lifecycle persistence contract", () => {
  it("protects new password-reset codes before persistence while retaining expiring legacy lookup", () => {
    const db = source("server/db.ts");

    expect(db).toContain('hashOneTimeCode("password-reset", token)');
    expect(db).toMatch(/resetToken:\s*protectedToken/);
    expect(db).toMatch(/eq\(users\.resetToken, protectedToken\)/);
    expect(db).toMatch(/eq\(users\.resetToken, token\)/);
  });

  it("revokes every user session atomically when password credentials change", () => {
    const db = source("server/db.ts");
    const block = db.split("export async function updateUserPassword")[1]?.split("export async function setResetToken")[0] ?? "";

    expect(block).toContain("db.transaction");
    expect(block).toMatch(/tx\s*\.update\(users\)/);
    expect(block).toMatch(/tx\.delete\(sessions\)\.where\(eq\(sessions\.userId, userId\)\)/);
  });

  it("revokes target sessions in the same transaction as account deactivation", () => {
    const db = source("server/db.ts");
    const block = db.split("export async function toggleUserActive")[1]?.split("export async function changeUserRole")[0] ?? "";

    expect(block).toContain("db.transaction");
    expect(block).toMatch(/tx\.update\(users\)\.set\(\{ isActive \}\)/);
    expect(block).toMatch(/if \(!isActive\)/);
    expect(block).toMatch(/tx\.delete\(sessions\)\.where\(eq\(sessions\.userId, userId\)\)/);
  });

  it("clears email verification credentials after success, expiry, or delivery failure paths", () => {
    const db = source("server/db.ts");
    const auth = source("server/auth-router.ts");

    expect(db).toContain("export async function clearEmailVerifyToken");
    expect(db).toMatch(/emailVerifyToken: null, emailVerifyExpires: null/);
    expect(auth).toMatch(/await db\.clearEmailVerifyToken\(userId\)/);
    expect(auth).toMatch(/await db\.clearEmailVerifyToken\(id\)/);
  });

  it("does not create a persisted session for approval-pending registration", () => {
    const auth = source("server/auth-router.ts");
    expect(auth).toMatch(/let token: string \| null = null/);
    expect(auth).toMatch(/if \(!requiresApproval\) \{[\s\S]*?db\.createSession/);
    expect(auth).not.toContain("token: requiresApproval ? null : token");
  });
});
