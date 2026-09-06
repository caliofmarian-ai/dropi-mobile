import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("QA-380 governed owner mission fixture contract", () => {
  it("materializes exactly one deterministic drone and one terrestrial READY order", () => {
    const shared = source("shared/owner-qa-mission-fixtures.ts");
    const service = source("server/owner-qa-mission-fixtures.ts");
    expect(shared).toContain('drone: "QA380-C1-DRONE"');
    expect(shared).toContain('terrestrial: "QA380-C1-TERRESTRIAL"');
    expect(service).toContain('status: "ready"');
    expect(service).toContain('vehicleType: "drone"');
    expect(service).toContain('vehicleType: "van"');
    expect(service).toContain("targetPilotId");
  });

  it("resolves canonical TEST HUMAN identities and never hardcodes database user ids", () => {
    const service = source("server/owner-qa-mission-fixtures.ts");
    expect(service).toContain("TEST_ROLE_IDENTITIES");
    expect(service).toContain('REQUIRED_TEST_ROLES = ["customer", "merchant", "delivery_partner"]');
    expect(service).toContain("canonicalHumanEmail");
    expect(service).not.toMatch(/customerId:\s*\d+/);
    expect(service).not.toMatch(/merchantId:\s*\d+/);
    expect(service).not.toMatch(/targetPilotId:\s*\d+/);
  });

  it("isolates QA discovery and direct acceptance to the governed target pilot", () => {
    const orderService = source("server/order-management-service.ts");
    expect(orderService).toContain("canActorSeeOwnerQaMission(row.items, actor.id)");
    expect(orderService).toContain("readOwnerQaMissionMetadata(order.items)");
    expect(orderService).toContain("Owner QA mission is reserved for its governed TEST HUMAN Delivery Partner");
  });

  it("exposes create/status/reset only behind real base Super Admin governance", () => {
    const router = source("server/phantom-console-router.ts");
    expect(router).toContain("ownerQaMissionFixtureStatus: adminProcedure");
    expect(router).toContain("reconcileOwnerQaMissionFixtures: adminProcedure");
    expect(router).toContain("resetOwnerQaMissionFixtures: adminProcedure");
    expect(router).toContain("requireBaseSuperAdmin(ctx)");
  });

  it("keeps runtime fixture cleanup deterministic while retaining permanent audit history", () => {
    const service = source("server/owner-qa-mission-fixtures.ts");
    expect(service).toContain("deleteFixtureRuntimeData");
    expect(service).toContain("flightTelemetrySamples");
    expect(service).toContain("operationalEvidenceEvents");
    expect(service).toContain("deliveryProofAttestations");
    expect(service).toContain("auditHistoryRetained: true");
    expect(service).not.toContain("delete(auditLogs)");
  });

  it("shows owner controls and vehicle-specific QA cards in the real Android UI", () => {
    const consoleScreen = source("app/admin/phantom-console.tsx");
    const radar = source("components/c1-transactional-dashboards.tsx");
    expect(consoleScreen).toContain("Owner Android Mission Acceptance · #380");
    expect(consoleScreen).toContain("Reconcile QA Missions");
    expect(consoleScreen).toContain("Reset QA Missions");
    expect(consoleScreen).toContain("DELIVERY_PARTNER_TEST_USERNAME");
    expect(radar).toContain("OWNER QA");
    expect(radar).toContain("ownerQaLabel");
    expect(radar).toContain("vehicleId");
  });

  it("does not introduce synthetic telemetry into the fixture or Mission Radar path", () => {
    const service = source("server/owner-qa-mission-fixtures.ts");
    const radar = source("components/c1-transactional-dashboards.tsx");
    expect(service).not.toContain("flightTelemetrySamples).values");
    expect(service).not.toContain("speed:");
    expect(service).not.toContain("altitude:");
    expect(radar).not.toContain("createDemoRoute");
  });
});
