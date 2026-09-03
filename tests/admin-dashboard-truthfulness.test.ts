import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("IMPL-010 Admin dashboard truthfulness", () => {
  it("routes every Admin role through the governed Admin surface", () => {
    const entry = source("app/(tabs)/index.tsx");

    for (const role of [
      "system_administrator",
      "security_officer",
      "audit_manager",
      "configuration_manager",
      "analytics_manager",
      "support_coordinator",
    ]) {
      expect(entry).toContain(`"${role}"`);
    }
    expect(entry).toContain("return <AdminGovernedDashboard role={user.dropiRole} />");
  });

  it("preserves existing governed Admin tools without presenting synthetic metrics", () => {
    const admin = source("components/admin-governed-dashboards.tsx");

    for (const route of [
      "/admin/marketplace-overview",
      "/admin/moderation",
      "/admin/audit-logs",
      "/admin/approvals",
      "/admin/fcm-config",
      "/admin/monitoring",
      "/admin/authority-reports",
    ]) {
      expect(admin).toContain(route);
    }

    for (const demoLiteral of [
      "99.97%",
      "Threat Level\" value=\"LOW",
      "192.168.x.x",
      "v2.4.1",
      "v2.4.0",
      "₱2.1M",
      "4,521",
      "1,247",
      "NPS Score",
      "Open Tickets\" value=\"34",
      "Agents Online\" value=\"8",
      "4.6/5",
    ]) {
      expect(admin).not.toContain(demoLiteral);
    }
  });

  it("fails closed where no governed Admin aggregate exists", () => {
    const admin = source("components/admin-governed-dashboards.tsx");

    expect(admin).toContain("No certified platform-wide uptime");
    expect(admin).toContain("No certified live threat-level");
    expect(admin).toContain("no synthetic compliance score");
    expect(admin).toContain("release/configuration registry");
    expect(admin).toContain("cross-channel analytics read model is not active yet");
    expect(admin).toContain("Support ticket and workforce persistence model is not active yet");
  });
});
