import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("IMPL-010 C2/C3 dashboard channel boundaries", () => {
  it("routes every C3 role to the governed EOC-unavailable surface", () => {
    const entry = source("app/(tabs)/index.tsx");

    for (const role of [
      "emergency_coordinator",
      "dispatch_manager",
      "resource_allocator",
      "communication_officer",
      "c3_data_analyst",
      "incident_commander",
    ]) {
      expect(entry).toContain(`"${role}"`);
    }
    expect(entry).toContain("return <C2C3GovernedDashboard role={user.dropiRole} />");
  });

  it("never presents C2/B2B data as C3 emergency evidence", () => {
    const governed = source("components/c2-c3-governed-dashboards.tsx");

    expect(governed).toContain("C2/B2B operational data is intentionally not reused as C3 emergency data");
    expect(governed).not.toContain("trpc.b2bDelivery");
    expect(governed).not.toContain("ACTIVE OPERATIONS");
    expect(governed).not.toContain("Medical Emergency — Zone 7");
    expect(governed).not.toContain("DECLARE ALL-CLEAR");
  });

  it("fails closed for every C2 role until COS tenancy and authorization are materialized", () => {
    const entry = source("app/(tabs)/index.tsx");
    const governed = source("components/c2-c3-governed-dashboards.tsx");

    for (const role of [
      "operations_manager",
      "logistics_coordinator",
      "fleet_manager",
      "c2_compliance_officer",
      "c2_performance_monitor",
      "c2_incident_responder",
      "data_analyst",
      "quality_assurance",
    ]) {
      expect(entry).toContain(`"${role}"`);
    }

    expect(governed).toContain("not fabricated");
    expect(governed).toContain("B2B admin listing endpoint is restricted to system-administrator authority");
    expect(governed).toContain("BATCH-009");
    expect(governed).not.toContain("trpc.b2bDelivery");
  });

  it("keeps C1 delivery-partner UI isolated from B2B/C2 missions", () => {
    const c1 = source("components/c1-transactional-dashboards.tsx");
    expect(c1).toContain("Marketplace missions available");
    expect(c1).not.toContain("myPilotMissions");
    expect(c1).not.toContain("B2B Missions");
    expect(c1).not.toContain("target: \"b2b\"");
  });
});
