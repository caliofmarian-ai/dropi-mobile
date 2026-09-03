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
const easConfig = JSON.parse(read("eas.json")) as {
  build?: {
    development?: {
      channel?: string;
      android?: { buildType?: string };
    };
  };
};

test("runtime compatibility remains fingerprint-governed", () => {
  assert.match(appConfig, /runtimeVersion:\s*\{\s*policy:\s*["']fingerprint["']\s*,?\s*\}/);
});

test("OTA workflow materializes native projects before publishing", () => {
  const install = "pnpm install --frozen-lockfile";
  const prebuild = "pnpm exec expo prebuild --clean --no-install";
  const publish = "eas update --branch development";

  assert.ok(otaWorkflow.includes(install), "OTA workflow must install the locked dependency graph");
  assert.ok(otaWorkflow.includes(prebuild), "OTA workflow must run a clean full prebuild");
  assert.ok(otaWorkflow.includes(publish), "OTA workflow must publish to the development EAS branch");
  assert.ok(otaWorkflow.indexOf(prebuild) < otaWorkflow.indexOf(publish), "prebuild must run before eas update");
  assert.match(otaWorkflow, /node-version:\s*22\.x/);
  assert.doesNotMatch(otaWorkflow, /eas update[^\n]*--no-wait/);
});

test("development build and OTA stay on the same EAS channel contract", () => {
  assert.equal(easConfig.build?.development?.channel, "development");
  assert.equal(easConfig.build?.development?.android?.buildType, "apk");
  assert.match(androidBuildWorkflow, /node-version:\s*22\.x/);
  assert.match(androidBuildWorkflow, /eas build --profile development --platform android --non-interactive --no-wait/);
  assert.doesNotMatch(otaWorkflow, /eas update[^\n]*--platform\s+android/);
});
