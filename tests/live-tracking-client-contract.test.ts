import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("live-tracking server wiring", () => {
  it("requires an authenticate handshake and delegates ownership to the access contract", () => {
    const text = source("server/live-tracking.ts");
    expect(text).toContain('authMessage.type !== "authenticate"');
    expect(text).toContain("authorizeTrackingSession({");
    expect(text).toContain("target,");
    expect(text).toContain("resourceId: deliveryId");
    expect(text).toContain("mode: authMessage.mode");
  });

  it("does not trust pilotId or customerId from WebSocket query/message input", () => {
    const text = source("server/live-tracking.ts");
    expect(text).not.toContain('searchParams.get("pilotId")');
    expect(text).not.toContain("msg.customerId");
    expect(text).toContain("pilotId: authorization.pilotId");
    expect(text).toContain("authorization.notificationRecipientId");
  });

  it("namespaces equal numeric IDs by order vs b2b target", () => {
    const text = source("server/live-tracking.ts");
    expect(text).toContain('return `${target}:${deliveryId}`');
    expect(text).toContain('target query param must be \'order\' or \'b2b\'');
  });
});

describe("live-tracking client wiring", () => {
  it("subscriber hook authenticates with the stored DROPi session token", () => {
    const text = source("hooks/use-live-tracking.ts");
    expect(text).toContain('AsyncStorage.getItem(TOKEN_KEY)');
    expect(text).toContain('type: "authenticate", mode: "subscriber", token');
    expect(text).toContain("target,");
  });

  it("pilot broadcasting authenticates without accepting a pilotId option", () => {
    const text = source("hooks/use-pilot-broadcasting.ts");
    expect(text).toContain('type: "authenticate", mode: "pilot", token');
    expect(text).not.toContain("pilotId: number;");
    expect(text).not.toContain("customerId?: number;");
    expect(text).not.toContain("customerId }));");
  });

  it("pilot broadcast route has no fallback deliveryId=1 or pilotId route parameter", () => {
    const text = source("app/pilot/broadcast.tsx");
    expect(text).not.toContain('params.deliveryId || "1"');
    expect(text).not.toContain('params.pilotId || "1"');
    expect(text).not.toContain("pilotId, vehicleType");
  });

  it("delivery-partner dashboard no longer contains debug tracking IDs", () => {
    const text = source("app/(tabs)/index.tsx");
    expect(text).not.toContain("deliveryId: '1', pilotId: '1'");
    expect(text).not.toContain("params: { deliveryId: '1' }");
  });

  it("mission inflight actions route using the real B2B mission identifier", () => {
    const text = source("app/mission/[id].tsx");
    expect(text).toContain("deliveryId: String(mission.orderId)");
    expect(text).toContain("target: 'b2b'");
  });
});
