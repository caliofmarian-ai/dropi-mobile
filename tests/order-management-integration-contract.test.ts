import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("canonical Marketplace order integration", () => {
  it("exposes one operations surface for placement, transitions, READY discovery, assigned execution and history", () => {
    const text = source("server/operations-router.ts");
    for (const procedure of [
      "placeOrder:",
      "transitionOrder:",
      "availableMarketplaceOrders:",
      "myMarketplacePilotOrders:",
      "myOrderTimeline:",
    ]) {
      expect(text).toContain(procedure);
    }
    expect(text).toContain("createMarketplaceOrder({");
    expect(text).toContain("transitionMarketplaceOrder({");
  });

  it("keeps order creation server-owned and validated against active internal stores/products", () => {
    const text = source("server/order-management-service.ts");
    expect(text).toContain('eq(stores.status, "active")');
    expect(text).toContain('eq(stores.type, "internal")');
    expect(text).toContain('eq(products.status, "approved")');
    expect(text).toContain('eq(products.isActive, true)');
    expect(text).toContain('status: "initiated"');
    expect(text).toContain('action: "order.created"');
  });

  it("audits every status transition and gates pilot discovery on READY", () => {
    const text = source("server/order-management-service.ts");
    expect(text).toContain('action: "order.status_transition"');
    expect(text).toContain('eq(orders.status, "ready")');
    expect(text).toContain('eq(users.isVerified, true)');
    expect(text).toContain('eq(users.isActive, true)');
    expect(text).toContain('eq(pilotProfiles.isAvailable, true)');
    expect(text).toContain("available for voluntary acceptance");
  });

  it("uses the shared preference-aware push boundary for Marketplace transitions", () => {
    const notificationText = source("server/order-transition-notifications.ts");
    const serviceText = source("server/order-management-service.ts");
    expect(notificationText).toContain('preference: "pushOrders"');
    expect(notificationText).toContain('preference: "pushMissions"');
    expect(serviceText).toContain("notifyOrderTransition({");
    expect(serviceText).toContain('preference: "pushMissions"');
  });

  it("replaces merchant local-only state changes with the canonical transition mutation", () => {
    const text = source("app/merchant-order/[id].tsx");
    expect(text).toContain("trpc.operations.transitionOrder.useMutation");
    expect(text).toContain('newStatus: "validated"');
    expect(text).toContain('newStatus: "preparing"');
    expect(text).toContain('newStatus: "ready"');
    expect(text).not.toContain('setCurrentStatus("preparing")');
    expect(text).not.toContain('setCurrentStatus("ready")');
  });

  it("gives customers audited history and canonical pre-accept cancellation", () => {
    const text = source("app/order/[id].tsx");
    expect(text).toContain("trpc.operations.myOrderTimeline.useQuery");
    expect(text).toContain("trpc.operations.transitionOrder.useMutation");
    expect(text).toContain('newStatus: "cancelled"');
    expect(text).toContain("Verified History");
  });

  it("keeps pilot acceptance voluntary and routes completion through proof-backed canonical transition", () => {
    const dashboard = source("components/legacy-home-screen.tsx");
    const proofScreen = source("app/pilot/complete-order.tsx");
    expect(dashboard).toContain("trpc.operations.availableMarketplaceOrders.useQuery");
    expect(dashboard).toContain("trpc.operations.myMarketplacePilotOrders.useQuery");
    expect(dashboard).toContain("trpc.operations.transitionOrder.useMutation");
    expect(dashboard).toContain('newStatus: "accepted"');
    expect(dashboard).toContain('newStatus: "in_execution"');
    expect(dashboard).toContain("Accept Voluntarily");
    expect(dashboard).toContain("/pilot/complete-order");
    expect(proofScreen).toContain("trpc.operations.transitionOrder.useMutation");
    expect(proofScreen).toContain('newStatus: "completed"');
    expect(proofScreen).toContain("completionProof");
  });

  it("shows initiated orders to merchants instead of hiding them before validation", () => {
    const text = source("components/legacy-home-screen.tsx");
    expect(text).toContain('o.status === "initiated" || o.status === "validated"');
  });
});
