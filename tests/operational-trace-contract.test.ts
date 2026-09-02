import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("migration and schema persist independent telemetry, custody, proof and attestations", () => {
  const schema = source("drizzle/operational-trace-schema.ts");
  const migration = source("drizzle/0017_operational_evidence_chain.sql");
  for (const table of ["operationalEvidenceEvents", "flightTelemetrySamples", "deliveryProofs", "deliveryProofAttestations"]) {
    assert.match(schema, new RegExp(table));
    assert.match(migration, new RegExp(table));
  }
  assert.match(source("drizzle/meta/_journal.json"), /0017_operational_evidence_chain/);
});

test("C1 completion is proof-backed and pickup/fallback/completion enter operational evidence", () => {
  const service = source("server/order-management-service.ts");
  assert.match(service, /Proof of delivery is required before an order can be completed/);
  assert.match(service, /createDeliveryProofWithDb/);
  assert.match(service, /eventType: "pickup"/);
  assert.match(service, /eventType: "fallback"/);
  assert.match(service, /eventType: "delivery_completed"/);
});

test("live tracking persists accepted telemetry and WebSocket completion is not authoritative", () => {
  const tracking = source("server/live-tracking.ts");
  assert.match(tracking, /recordTelemetrySample/);
  assert.match(tracking, /type: "proof_required"/);
  assert.doesNotMatch(tracking, /type: "completion_confirmed"/);
});

test("pilot C1 UI routes completion through proof capture and no real order screen uses demo route", () => {
  const dashboard = source("app/(tabs)/index.tsx");
  const detail = source("app/order/[id].tsx");
  assert.match(dashboard, /\/pilot\/complete-order/);
  assert.match(dashboard, /Confirm pickup & start delivery/);
  assert.match(source("app/pilot/complete-order.tsx"), /completionProof/);
  assert.doesNotMatch(detail, /createDemoRoute/);
  assert.match(detail, /myOrderTrace/);
  assert.match(detail, /confirmOrderReceipt/);
});

test("B2B lifecycle uses the same operational evidence and requires proof for delivered", () => {
  const b2b = source("server/b2b-router.ts");
  assert.match(b2b, /completionProof/);
  assert.match(b2b, /Proof of delivery is required before a B2B mission can be delivered/);
  assert.match(b2b, /eventType: "pickup"/);
  assert.match(b2b, /eventType: "transfer"/);
  assert.match(b2b, /eventType: "delivery_completed"/);
});

test("artifact policy refuses inline bytes and signer records are attestations, not fake legal signatures", () => {
  const policy = source("shared/operational-trace-policy.ts");
  const schema = source("drizzle/operational-trace-schema.ts");
  assert.match(policy, /never inline\/base64 data/);
  assert.match(schema, /attestationKind/);
  assert.doesNotMatch(schema, /legalSignature|digitalSignature/);
});
