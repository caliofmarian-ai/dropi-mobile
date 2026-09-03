import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const otaWorkflow = read(".github/workflows/eas-update.yml");
const androidBuildWorkflow = read(".github/workflows/eas-build-android.yml");
const appConfig = read("app.config.ts");
const oauthConfig = read("constants/oauth.ts");
const easConfig = JSON.parse(read("eas.json")) as {
  build?: Record<string, {
    channel?: string;
    env?: Record<string, string>;
    android?: { buildType?: string };
  }>;
};

function appVersion(): string {
  const match = appConfig.match(/\bversion:\s*["']([^"']+)["']/);
  assert.ok(match, "app.config.ts must define a release version");
  return match[1];
}

test("runtime compatibility is governed by the release app version", () => {
  assert.match(appConfig, /runtimeVersion:\s*\{\s*policy:\s*["']appVersion["']\s*,?\s*\}/);
  assert.doesNotMatch(appConfig, /policy:\s*["']fingerprint["']/);
  assert.match(appVersion(), /^\d+\.\d+\.\d+$/);
  assert.notEqual(appVersion(), "1.0.0", "the incompatible legacy 1.0.0 runtime must not be reused");
});

test("development OTA publishes without recomputing a fingerprint runtime", () => {
  const install = "pnpm install --frozen-lockfile";
  const publish = "eas update --branch development";

  assert.ok(otaWorkflow.includes(install), "OTA workflow must install the locked dependency graph");
  assert.ok(otaWorkflow.includes(publish), "OTA workflow must publish to the development EAS branch");
  assert.ok(!otaWorkflow.includes("expo prebuild --clean"), "appVersion OTA must not synthesize a fingerprint runtime");
  assert.match(otaWorkflow, /node-version:\s*22\.x/);
  assert.match(otaWorkflow, /Validate generated Expo public config/);
  assert.doesNotMatch(otaWorkflow, /ota-runtime-diagnostic/);
  assert.doesNotMatch(otaWorkflow, /eas update[^\n]*--branch\s+main/);
});

test("development build and OTA share one EAS channel and API configuration contract", () => {
  assert.equal(easConfig.build?.development?.channel, "development");
  assert.equal(easConfig.build?.development?.android?.buildType, "apk");
  assert.match(androidBuildWorkflow, /node-version:\s*22\.x/);
  assert.match(androidBuildWorkflow, /Materialize runtime configuration into EAS development profile/);
  assert.match(androidBuildWorkflow, /EXPO_PUBLIC_API_BASE_URL: process\.env\.EXPO_PUBLIC_API_BASE_URL/);
  assert.match(androidBuildWorkflow, /Validate generated Expo public config/);
  assert.match(androidBuildWorkflow, /eas build --profile development --platform android --non-interactive --no-wait/);
});

test("committed EAS profiles contain no unresolved shell-style API placeholders", () => {
  for (const profileName of ["development", "preview", "production"]) {
    const value = easConfig.build?.[profileName]?.env?.EXPO_PUBLIC_API_BASE_URL;
    assert.notEqual(value, "$EXPO_PUBLIC_API_BASE_URL");
  }
});

test("native API resolution can fall back to the Expo config embedded in the binary", () => {
  assert.match(oauthConfig, /import Constants from ["']expo-constants["']/);
  assert.match(oauthConfig, /Constants\.expoConfig\?\.extra\?\.apiBaseUrl/);
  assert.match(oauthConfig, /trimmed === ["']\$EXPO_PUBLIC_API_BASE_URL["']/);
  assert.match(oauthConfig, /normalizeBaseUrl\(API_BASE_URL\) \|\| getEmbeddedApiBaseUrl\(\)/);
});
