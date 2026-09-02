import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("B2B mission UI cannot advance on failed persistence or timer-driven transition races", () => {
  const mission = source("app/mission/[id].tsx");
  assert.match(mission, /await syncStatusToServer\("assigned"\)/);
  assert.match(mission, /await syncStatusToServer\("pickup_enroute"\)/);
  assert.match(mission, /await syncStatusToServer\("picked_up"\)/);
  assert.match(mission, /await syncStatusToServer\("in_transit"\)/);
  assert.doesNotMatch(mission, /setTimeout\(\(\) => syncStatusToServer/);
  assert.doesNotMatch(mission, /Silent fail — local flow continues/);
  assert.match(mission, /Verification unavailable/);
});

test("STOP and fallback are persisted as distinct factual incident types", () => {
  const mission = source("app/mission/[id].tsx");
  const b2b = source("server/b2b-router.ts");
  assert.match(mission, /incidentType: "stop"/);
  assert.match(mission, /incidentType: "fallback"/);
  assert.match(b2b, /incidentType: z\.enum\(\["stop", "fallback", "failure"\]\)/);
  assert.match(b2b, /eventType: incidentType === "stop" \? "stop" : incidentType === "fallback" \? "fallback" : "delivery_failed"/);
  assert.match(b2b, /resultingStatus: "failed"/);
});

test("B2B successful completion always routes through proof capture", () => {
  const mission = source("app/mission/[id].tsx");
  const proof = source("app/pilot/complete-mission.tsx");
  assert.match(mission, /\/pilot\/complete-mission/);
  assert.doesNotMatch(mission, /syncStatusToServer\("delivered"\)/);
  assert.match(proof, /newStatus: "delivered"/);
  assert.match(proof, /completionProof/);
});
