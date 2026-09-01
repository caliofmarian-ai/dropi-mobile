import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("B2B state-transition push integration", () => {
  it("wires the tRPC B2B router through the centralized transition notifier", () => {
    const text = source("server/b2b-router.ts");

    expect(text).toContain('import { notifyB2bDeliveryTransition } from "./b2b-transition-notifications";');
    expect(text.match(/notifyB2bDeliveryTransition\(/g)?.length).toBeGreaterThanOrEqual(3);
    expect(text).toContain("actorUserId: user.id");
    expect(text).toContain("actorUserId: storeResult[0].ownerId");
    expect(text).toContain("actorUserId: ctx.user?.id ?? null");
  });

  it("wires REST partner cancellation through the same notifier", () => {
    const text = source("server/rest-gateway.ts");

    expect(text).toContain('import { notifyB2bDeliveryTransition } from "./b2b-transition-notifications";');
    expect(text).toContain("await notifyB2bDeliveryTransition({");
    expect(text).toContain("actorUserId: store.ownerId");
    expect(text).toContain('newStatus: "cancelled"');
  });

  it("keeps provider-specific sending outside business routers", () => {
    for (const file of ["server/b2b-router.ts", "server/rest-gateway.ts"]) {
      const text = source(file);
      expect(text).not.toContain('from "./push-notifications"');
      expect(text).not.toContain("sendPushToUser(");
    }
  });
});
