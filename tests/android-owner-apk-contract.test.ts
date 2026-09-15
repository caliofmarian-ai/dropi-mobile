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

test("Expo SDK 54 / React Native 0.81 runtime keeps React renderer-compatible", () => {
  const deps = packageJson.dependencies ?? {};
  assert.match(deps.expo ?? "", /^~54\./, "this guard targets the Expo SDK 54 runtime family");
  assert.match(
    deps["react-native"] ?? "",
    /^0\.81\./,
    "this guard targets the React Native 0.81 runtime family",
  );
  assert.equal(
    deps.react,
    "19.1.0",
    "React Native 0.81 uses the React 19.1.0 renderer; a different React runtime causes an incompatible React versions red screen",
  );
  assert.equal(
    deps["react-dom"],
    deps.react,
    "react-dom must stay aligned with the React runtime version",
  );
});
