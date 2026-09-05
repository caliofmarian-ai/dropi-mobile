import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("IMPL-008 governed Phantom Console", () => {
  it("exposes only the operator-safe target projection", () => {
    const router = source("server/phantom-console-router.ts");

    for (const field of [
      "id: users.id",
      "name: users.name",
      "email: users.email",
      "dropiRole: users.dropiRole",
      "channel: users.channel",
      "isActive: users.isActive",
      "isAIAgent: users.isAIAgent",
      "humanPairId: users.humanPairId",
    ]) {
      expect(router).toContain(field);
    }

    expect(router).not.toContain("passwordHash: users.passwordHash");
    expect(router).not.toContain("resetToken: users.resetToken");
    expect(router).not.toContain("emailVerifyToken: users.emailVerifyToken");
    expect(router).not.toContain("lastIp: users.lastIp");
    expect(router).not.toContain("lastDevice: users.lastDevice");
  });

  it("fails closed for self-target and inactive target before delegating to canonical phantom auth", () => {
    const router = source("server/phantom-console-router.ts");

    expect(router).toContain("input.targetUserId === ctx.user!.id");
    expect(router).toContain("Inactive accounts cannot be entered through Phantom Mode.");
    expect(router).toContain("adminAuthRouter.createCaller(ctx).phantomLogin(input)");
  });

  it("uses the hardened facade from the client and preserves canonical phantom exit", () => {
    const auth = source("lib/auth-context.tsx");

    expect(auth).toContain('apiCall("phantomConsole.enter", { targetUserId }, token)');
    expect(auth).toContain('apiCall("adminAuth.exitPhantom", {}, token)');
    expect(auth).toContain("isPhantom");
    expect(auth).toContain("PHANTOM_KEY");
  });

  it("keeps phantom state visibly marked and excludes target notification registration", () => {
    const banner = source("components/phantom-session-banner.tsx");
    const layout = source("app/_layout.tsx");

    expect(banner).toContain("PHANTOM MODE · AUDITED");
    expect(banner).toContain("exitPhantomSession");
    expect(layout).toContain("<PhantomSessionBanner />");
    expect(layout).toContain("!!user && !isPhantom");
    expect(layout).toContain("isDemo || isPhantom");
  });

  it("is reachable only through the System Administrator governed tool set", () => {
    const dashboards = source("components/admin-governed-dashboards.tsx");
    const consoleScreen = source("app/admin/phantom-console.tsx");

    expect(dashboards).toContain('title: "Phantom Login Console"');
    expect(dashboards).toContain('route: "/admin/phantom-console"');
    expect(consoleScreen).toContain('user.dropiRole === "system_administrator"');
    expect(consoleScreen).toContain('user.channel === "ADMIN"');
    expect(consoleScreen).toContain("critical actions are audited");
  });

  it("separates real, canonical test-human, and AI role-agent identities by governed channel", () => {
    const consoleScreen = source("app/admin/phantom-console.tsx");

    expect(consoleScreen).toContain('import { TEST_ROLE_IDENTITIES } from "@/shared/test-role-accounts"');
    expect(consoleScreen).toContain('const CHANNEL_ORDER = ["C1", "C2", "C3", "ADMIN"] as const');
    expect(consoleScreen).toContain('title: "REAL ACCOUNTS"');
    expect(consoleScreen).toContain('title: "TEST HUMAN ACCOUNTS"');
    expect(consoleScreen).toContain('title: "AI ROLE AGENTS"');
    expect(consoleScreen).toContain('if (target.isAIAgent) return "ai"');
    expect(consoleScreen).toContain('TEST_HUMAN_EMAILS.has(normalizedEmail(target.email))');
    expect(consoleScreen).toContain('Human counterpart ID:');
    expect(consoleScreen).toContain('CHANNEL {channelGroup.channel}');
    expect(consoleScreen).not.toContain('title: "AI MIRRORS"');
  });
});
