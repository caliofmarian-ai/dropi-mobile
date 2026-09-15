import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/build-android-apk-github.yml"),
  "utf8",
);

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
) as {
  dependencies?: Record<string, string>;
};

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

test("Expo SDK 54 / React Native 0.81 runtime keeps React on renderer-compatible 19.1.0", () => {
  const deps = packageJson.dependencies ?? {};
  assert.equal(deps.expo, "~54.0.37");
  assert.equal(deps["react-native"], "0.81.5");
  assert.equal(
    deps.react,
    "19.1.0",
    "React must exactly match the React Native 0.81 renderer; 19.1.9 causes an incompatible React versions red screen",
  );
  assert.equal(
    deps["react-dom"],
    "19.1.0",
    "react-dom must stay aligned with React 19.1.0 for this Expo SDK 54 runtime",
  );
});
