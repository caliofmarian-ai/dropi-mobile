import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("native API and EAS runtime configuration", () => {
  it("resolves the native API URL from JavaScript env or embedded Expo config", () => {
    const oauth = source("constants/oauth.ts");

    expect(oauth).toContain('import Constants from "expo-constants"');
    expect(oauth).toContain("Constants.expoConfig?.extra?.apiBaseUrl");
    expect(oauth).toContain('trimmed === "$EXPO_PUBLIC_API_BASE_URL"');
    expect(oauth).toContain("normalizeBaseUrl(API_BASE_URL) || getEmbeddedApiBaseUrl()");
  });

  it("uses a release-version runtime so one APK and its development OTA share a stable target", () => {
    const appConfig = source("app.config.ts");

    expect(appConfig).toContain('policy: "appVersion"');
    expect(appConfig).toContain('apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? ""');
    expect(appConfig).not.toContain('policy: "fingerprint"');
  });

  it("does not commit shell-style API placeholders into EAS build profiles", () => {
    const easConfig = JSON.parse(source("eas.json"));

    for (const profileName of ["development", "preview", "production"]) {
      const value = easConfig.build?.[profileName]?.env?.EXPO_PUBLIC_API_BASE_URL;
      expect(value).not.toBe("$EXPO_PUBLIC_API_BASE_URL");
    }
  });

  it("injects the verified GitHub API value into the remote development build profile", () => {
    const buildWorkflow = source(".github/workflows/eas-build-android.yml");

    expect(buildWorkflow).toContain("Materialize runtime configuration into EAS development profile");
    expect(buildWorkflow).toContain("EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL");
    expect(buildWorkflow).toContain("EAS development profile contains a resolved API base URL");
  });

  it("publishes normal phone updates only to the development EAS branch", () => {
    const updateWorkflow = source(".github/workflows/eas-update.yml");

    expect(updateWorkflow).toContain("eas update --branch development");
    expect(updateWorkflow).not.toContain("ota-runtime-diagnostic");
    expect(updateWorkflow).not.toContain("eas update --branch main");
  });
});
