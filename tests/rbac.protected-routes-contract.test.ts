import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SERVER_DIR = join(process.cwd(), "server");

function serverTypeScriptFiles(): string[] {
  return readdirSync(SERVER_DIR)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => join(SERVER_DIR, name));
}

describe("protected tRPC route RBAC inheritance contract", () => {
  it("keeps protectedProcedure centralized on the canonical RBAC middleware", () => {
    const trpc = readFileSync(join(SERVER_DIR, "_core", "trpc.ts"), "utf8");

    expect(trpc).toContain("const requireProtectedRole = rbacMiddleware();");
    expect(trpc).toContain(
      "export const protectedProcedure = t.procedure.use(requireProtectedRole).use(auditLog);",
    );
    expect(trpc).toContain(
      "export const phantomProcedure = t.procedure.use(requireProtectedRole).use(auditAdminLog);",
    );
  });

  it("does not allow router files to redefine an authentication-only protectedProcedure", () => {
    for (const file of serverTypeScriptFiles()) {
      const source = readFileSync(file, "utf8");
      if (!source.includes("protectedProcedure")) continue;

      expect(source).not.toMatch(/(?:const|let|var)\s+protectedProcedure\s*=/);
      expect(source).not.toMatch(/export\s+const\s+protectedProcedure\s*=/);
    }
  });
});
