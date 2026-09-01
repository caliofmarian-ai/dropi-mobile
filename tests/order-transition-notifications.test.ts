import { describe, expect, it, vi } from "vitest";
import {
  buildOrderTransitionPushPlan,
  notifyOrderTransition,
  type OrderTransitionInput,
} from "../server/order-transition-notifications";

const base: OrderTransitionInput = {
  orderId: 77,
  orderUid: "ORD-77",
  previousStatus: "preparing",
  newStatus: "ready",
  customerId: 10,
  merchantId: 20,
  pilotId: null,
  actorUserId: 20,
};

describe("Marketplace order transition pushes", () => {
  it("notifies non-actor order participants through pushOrders", () => {
    const plan = buildOrderTransitionPushPlan(base);
    expect(plan).toHaveLength(1);
    expect(plan[0].userId).toBe(10);
    expect(plan[0].preference).toBe("pushOrders");
    expect(plan[0].message.data).toMatchObject({ target: "order", orderId: 77, status: "ready" });
  });

  it("uses pushMissions for the assigned pilot but skips the pilot actor", () => {
    const adminPlan = buildOrderTransitionPushPlan({
      ...base,
      previousStatus: "ready",
      newStatus: "accepted",
      pilotId: 30,
      actorUserId: 99,
    });
    expect(adminPlan.find((entry) => entry.userId === 30)?.preference).toBe("pushMissions");

    const pilotPlan = buildOrderTransitionPushPlan({
      ...base,
      previousStatus: "ready",
      newStatus: "accepted",
      pilotId: 30,
      actorUserId: 30,
    });
    expect(pilotPlan.some((entry) => entry.userId === 30)).toBe(false);
  });

  it("marks cancellation, fallback and completion appropriately", () => {
    const cancelled = buildOrderTransitionPushPlan({ ...base, newStatus: "cancelled" });
    expect(cancelled.every((entry) => entry.message.priority === "high")).toBe(true);

    const fallback = buildOrderTransitionPushPlan({ ...base, previousStatus: "in_execution", newStatus: "fallback", pilotId: 30 });
    expect(fallback.every((entry) => entry.message.priority === "high")).toBe(true);

    const completed = buildOrderTransitionPushPlan({ ...base, previousStatus: "in_execution", newStatus: "completed", pilotId: 30 });
    expect(completed.find((entry) => entry.audience === "customer")?.message.priority).toBe("high");
  });

  it("never emits a no-op notification", () => {
    expect(buildOrderTransitionPushPlan({ ...base, previousStatus: "ready", newStatus: "ready" })).toEqual([]);
  });

  it("dispatches the pure plan through the shared preference boundary", async () => {
    const send = vi.fn(async ({ userId, preference }: any) => ({ userId, preference, enabled: true, sent: 1 }));
    const results = await notifyOrderTransition(base, send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(results[0]).toMatchObject({ userId: 10, preference: "pushOrders", sent: 1 });
  });
});
