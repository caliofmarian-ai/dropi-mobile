import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const CANONICAL_ROLES = [
  "customer",
  "merchant",
  "delivery_partner",
  "support_agent",
  "analyst",
  "compliance_officer",
  "fraud_detection",
  "performance_monitor",
  "incident_responder",
  "operations_manager",
  "logistics_coordinator",
  "fleet_manager",
  "c2_compliance_officer",
  "c2_performance_monitor",
  "c2_incident_responder",
  "data_analyst",
  "quality_assurance",
  "emergency_coordinator",
  "dispatch_manager",
  "resource_allocator",
  "communication_officer",
  "c3_data_analyst",
  "incident_commander",
  "system_administrator",
  "security_officer",
  "audit_manager",
  "configuration_manager",
  "analytics_manager",
  "support_coordinator",
] as const;

describe("IMPL-010 final dashboard routing certification", () => {
  it("accounts for all 29 canonical human roles at the governed entry point", () => {
    const entry = source("app/(tabs)/index.tsx");
    expect(CANONICAL_ROLES).toHaveLength(29);
    for (const role of CANONICAL_ROLES) {
      expect(entry).toContain(`"${role}"`);
    }
    expect(entry).toContain("No governed dashboard contract exists for this account role.");
  });

  it("physically removes the legacy mock dashboard bundle", () => {
    const legacyPath = path.join(process.cwd(), "components/legacy-home-screen.tsx");
    expect(fs.existsSync(legacyPath)).toBe(false);
    expect(source("app/(tabs)/index.tsx")).not.toContain("LegacyHomeScreen");
  });

  it("keeps C1 transactional delivery work isolated from C2 B2B missions", () => {
    const c1 = source("components/c1-transactional-dashboards.tsx");
    expect(c1).toContain("availableMarketplaceOrders");
    expect(c1).toContain("myMarketplacePilotOrders");
    expect(c1).not.toContain("myPilotMissions");
    expect(c1).not.toContain("b2bDelivery");
    expect(c1).not.toContain("B2B Missions");
  });

  it("does not expose a fake Operations Manager live path through admin-only B2B procedures", () => {
    const entry = source("app/(tabs)/index.tsx");
    const c2 = source("components/c2-c3-governed-dashboards.tsx");
    expect(entry).toContain('"operations_manager"');
    expect(c2).toContain("B2B admin listing endpoint is restricted to system-administrator authority");
    expect(c2).not.toContain("trpc.b2bDelivery");
  });
});
