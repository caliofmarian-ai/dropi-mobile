import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const missionSource = () => readFileSync("app/mission/[id].tsx", "utf8");

test("mission supervision cannot present demo telemetry as LIVE operational state", () => {
  const mission = missionSource();

  assert.match(mission, /useLiveTracking\(\{/);
  assert.match(mission, /target: "b2b"/);
  assert.match(mission, /Waiting for live telemetry/);
  assert.match(mission, /DROPi will not substitute simulated telemetry/);

  assert.doesNotMatch(mission, /createDemoRoute/);
  assert.doesNotMatch(mission, /<DeliveryMap/);
  assert.doesNotMatch(mission, /Battery: 74%/);
  assert.doesNotMatch(mission, /Alt: 85m/);
  assert.doesNotMatch(mission, /Speed: 65 km\/h/);
  assert.doesNotMatch(mission, /mission\.estimatedTime \* 0\.6/);
  assert.doesNotMatch(mission, /mission\.distance \* 0\.6/);
});

test("mission hooks remain stable across loading and resolved renders", () => {
  const mission = missionSource();
  const mutationHook = mission.indexOf("trpc.b2bDelivery.pilotUpdateStatus.useMutation");
  const trackingHook = mission.indexOf("useLiveTracking({");
  const loadingReturn = mission.indexOf("if (missionQuery.isLoading)");

  assert.ok(mutationHook >= 0, "pilot status mutation hook must exist");
  assert.ok(trackingHook >= 0, "live tracking hook must exist");
  assert.ok(loadingReturn >= 0, "loading guard must exist");
  assert.ok(mutationHook < loadingReturn, "mutation hook must be declared before loading return");
  assert.ok(trackingHook < loadingReturn, "tracking hook must be declared before loading return");
});

test("preflight checklist resets from the resolved mission vehicle", () => {
  const mission = missionSource();

  assert.match(mission, /if \(!vehicleType\) \{/);
  assert.match(mission, /setChecks\(\[\]\)/);
  assert.match(mission, /vehicleType === "drone" \? DRONE_PREFLIGHT : TERRESTRIAL_PREFLIGHT/);
  assert.match(mission, /setChecks\(template\.map/);
  assert.match(mission, /checks\.length > 0 && checks\.every/);
});

test("mission never invents drone authority when vehicle type is missing or unsupported", () => {
  const mission = missionSource();

  assert.match(mission, /isSupportedVehicleType\(mission\?\.vehicleType\)/);
  assert.match(mission, /Vehicle assignment unavailable/);
  assert.match(mission, /supported vehicle type from the server/);
  assert.doesNotMatch(mission, /mission\?\.vehicleType\s*\|\|\s*["']drone["']/);
  assert.doesNotMatch(mission, /mission\.vehicleType\s*\|\|\s*["']drone["']/);
  assert.doesNotMatch(mission, /vehicleType:\s*mission\.vehicleType\s*\|\|/);
  assert.match(mission, /vehicleType \} \} as any/);
});

test("mission state transitions fail closed without a persisted B2B delivery id", () => {
  const mission = missionSource();

  assert.match(mission, /Number\.isSafeInteger\(deliveryId\)/);
  assert.match(mission, /Mission is missing a persisted B2B delivery identifier/);
  assert.doesNotMatch(mission, /if \(!mission\?\.orderId\) return/);
});
