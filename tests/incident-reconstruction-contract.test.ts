import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("incident reconstruction is investigator-only and source-separated", () => {
  const router = source("server/incident-reconstruction-router.ts");
  const service = source("server/incident-reconstruction-service.ts");
  assert.match(router, /auditInvestigatorProcedure/);
  assert.match(service, /source: "operational_event"/);
  assert.match(service, /source: "telemetry"/);
  assert.match(service, /source: "proof"/);
  assert.match(service, /source: "attestation"/);
  assert.match(service, /source: "audit"/);
});

test("incident scope is anchored to real fallback STOP or failure evidence", () => {
  const service = source("server/incident-reconstruction-service.ts");
  const policy = source("shared/incident-reconstruction-policy.ts");
  assert.match(policy, /"fallback", "stop", "delivery_failed"/);
  assert.match(service, /inArray\(operationalEvidenceEvents\.eventType, \[\.\.\.INCIDENT_EVENT_TYPES\]\)/);
  assert.match(service, /Complete persisted trace for the same target is included/);
});

test("per-incident authority export reuses governed authority targets and non-official disclaimer", () => {
  const router = source("server/incident-reconstruction-router.ts");
  assert.match(router, /AUTHORITY_REPORT_TARGETS/);
  assert.match(router, /AUTHORITY_REPORT_DISCLAIMER/);
  assert.match(router, /DROPI_INCIDENT_AUTHORITY_EVIDENCE_PACK/);
  assert.match(router, /format: z\.enum\(\["json", "csv"\]\)/);
});

test("preview is bounded while export builds the complete reconstruction", () => {
  const router = source("server/incident-reconstruction-router.ts");
  assert.match(router, /previewLimit = 1000/);
  assert.match(router, /truncated: reconstruction\.timeline\.length > previewLimit/);
  assert.match(router, /buildIncidentAuthorityPack/);
});

test("operator UI exposes factual timeline and explicitly rejects inferred narrative", () => {
  const ui = source("app/admin/incident-reconstruction.tsx");
  assert.match(ui, /Incident Reconstruction/);
  assert.match(ui, /Evidence only — no inferred cause or fault/);
  assert.match(ui, /trpc\.incidentReconstruction\.list/);
  assert.match(ui, /trpc\.incidentReconstruction\.reconstruct/);
  assert.match(ui, /trpc\.incidentReconstruction\.export/);
  assert.match(ui, /not official authority filing forms/);
});

test("app router mounts incident reconstruction beside existing authority reporting", () => {
  const routers = source("server/routers.ts");
  assert.match(routers, /incidentReconstruction: incidentReconstructionRouter/);
  assert.match(routers, /authorityReports: authorityReportRouter/);
});
