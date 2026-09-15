import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/build-android-apk-github.yml"),
  "utf8",
);

test("owner Android artifact is a standalone release APK", () => {
  assert.match(workflow, /assembleRelease/);
  assert.doesNotMatch(workflow, /assembleDebug/);
  assert.match(workflow, /outputs\/apk\/release/);
  assert.match(workflow, /dropi-standalone-owner-apk/);
});

test("owner Android artifact mechanically proves that the JS bundle is embedded", () => {
  assert.match(workflow, /assets\/index\.android\.bundle/);
  assert.match(workflow, /must not be delivered to the Project Owner/);
});

test("owner Android artifact cannot target a local development API", () => {
  assert.match(workflow, /localhost\|127\\\.0\\\.0\\\.1/);
  assert.match(workflow, /EXPO_PUBLIC_API_BASE_URL/);
  assert.match(workflow, /must use HTTPS/);
});
