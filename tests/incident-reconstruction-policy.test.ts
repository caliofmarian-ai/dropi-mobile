import test from "node:test";
import assert from "node:assert/strict";
import {
  INCIDENT_EVENT_TYPES,
  INCIDENT_RECONSTRUCTION_DISCLAIMER,
  INCIDENT_TRACE_CHANNELS,
  compareIncidentTimelineItems,
  isIncidentEventType,
} from "../shared/incident-reconstruction-policy";

test("incident anchors are limited to persisted safety/failure evidence", () => {
  assert.deepEqual(INCIDENT_EVENT_TYPES, ["fallback", "stop", "delivery_failed"]);
  assert.equal(isIncidentEventType("fallback"), true);
  assert.equal(isIncidentEventType("delivery_completed"), false);
});

test("reconstruction only advertises channels with materialized operational evidence", () => {
  assert.deepEqual(INCIDENT_TRACE_CHANNELS, ["C1", "C2"]);
});

test("timeline ordering is deterministic and timestamp-first", () => {
  const later = { key: "audit:2", timestamp: "2026-01-01T00:00:02.000Z", source: "audit" as const, kind: "x", actorUserId: null, actorRole: null, severity: null, evidenceHash: null, data: {} };
  const earlier = { key: "operational:1", timestamp: "2026-01-01T00:00:01.000Z", source: "operational_event" as const, kind: "fallback", actorUserId: 1, actorRole: "delivery_partner", severity: "critical", evidenceHash: "hash", data: {} };
  assert.ok(compareIncidentTimelineItems(earlier, later) < 0);
});

test("factual reconstruction disclaimer forbids inferred cause or fault", () => {
  assert.match(INCIDENT_RECONSTRUCTION_DISCLAIMER, /does not infer root cause, fault, legal responsibility/i);
});
