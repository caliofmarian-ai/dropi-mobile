import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("IMPL-008 biometric enrollment landing zone", () => {
  it("keeps biometrics fail-closed while OWNER-001 #278 remains unresolved", () => {
    const hook = source("hooks/use-biometric-enrollment.ts");

    expect(hook).toContain("BIOMETRIC_OWNER_DECISION_ISSUE = 278");
    expect(hook).toContain('code: "OWNER_DECISION_PENDING"');
    expect(hook).toContain("available: false");
    expect(hook).toContain("enrolled: false");
    expect(hook).toContain("canEnroll: false");
  });

  it("does not silently add the native local-authentication dependency", () => {
    const packageJson = JSON.parse(source("package.json"));
    const hook = source("hooks/use-biometric-enrollment.ts");

    expect(packageJson.dependencies?.["expo-local-authentication"]).toBeUndefined();
    expect(packageJson.devDependencies?.["expo-local-authentication"]).toBeUndefined();
    expect(hook).not.toContain('from "expo-local-authentication"');
  });

  it("makes the unavailable biometric state truthful on the login screen", () => {
    const login = source("app/login.tsx");

    expect(login).toContain("useBiometricEnrollment");
    expect(login).toContain("Biometric sign-in");
    expect(login).toContain("{biometric.message}");
  });
});
