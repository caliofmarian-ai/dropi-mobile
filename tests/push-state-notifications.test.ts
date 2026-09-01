import { describe, expect, it, vi } from "vitest";
import { sendPreferenceAwarePush } from "../server/preference-aware-push";
import {
  buildB2bTransitionPushPlan,
  notifyB2bDeliveryTransition,
  type B2bTransitionInput,
} from "../server/b2b-transition-notifications";

const baseTransition: B2bTransitionInput = {
  deliveryId: 42,
  trackingCode: "DRP-TEST-42",
  previousStatus: "pending",
  newStatus: "assigned",
  storeOwnerId: 10,
  assignedPilotId: 20,
  actorUserId: 99,
};

describe("sendPreferenceAwarePush", () => {
  it("does not call the push transport when the category is disabled", async () => {
    const sendPush = vi.fn(async () => 1);
    const result = await sendPreferenceAwarePush(
      {
        userId: 10,
        preference: "pushOrders",
        message: { title: "Order update", body: "Changed" },
      },
      {
        isPreferenceEnabled: async () => false,
        sendPush,
      },
    );

    expect(result).toEqual({ userId: 10, preference: "pushOrders", enabled: false, sent: 0 });
    expect(sendPush).not.toHaveBeenCalled();
  });

  it("uses the existing push transport when the category is enabled", async () => {
    const sendPush = vi.fn(async () => 2);
    const result = await sendPreferenceAwarePush(
      {
        userId: 20,
        preference: "pushMissions",
        message: { title: "Mission update", body: "Assigned" },
      },
      {
        isPreferenceEnabled: async () => true,
        sendPush,
      },
    );

    expect(result).toEqual({ userId: 20, preference: "pushMissions", enabled: true, sent: 2 });
    expect(sendPush).toHaveBeenCalledTimes(1);
  });

  it("fails non-fatally if the push provider throws", async () => {
    const result = await sendPreferenceAwarePush(
      {
        userId: 20,
        preference: "pushMissions",
        message: { title: "Mission update", body: "Assigned" },
      },
      {
        isPreferenceEnabled: async () => true,
        sendPush: async () => {
          throw new Error("provider unavailable");
        },
      },
    );

    expect(result.enabled).toBe(true);
    expect(result.sent).toBe(0);
  });
});

describe("B2B transition push policy", () => {
  it("routes store-owner updates through pushOrders and pilot updates through pushMissions", () => {
    const plan = buildB2bTransitionPushPlan(baseTransition);

    expect(plan).toHaveLength(2);
    expect(plan.find((entry) => entry.userId === 10)?.preference).toBe("pushOrders");
    expect(plan.find((entry) => entry.userId === 20)?.preference).toBe("pushMissions");
    expect(plan.every((entry) => entry.message.data?.target === "b2b")).toBe(true);
    expect(plan.every((entry) => entry.message.data?.deliveryId === 42)).toBe(true);
  });

  it("does not push the actor about their own transition", () => {
    const pilotActorPlan = buildB2bTransitionPushPlan({ ...baseTransition, actorUserId: 20 });
    expect(pilotActorPlan.map((entry) => entry.userId)).toEqual([10]);

    const ownerActorPlan = buildB2bTransitionPushPlan({
      ...baseTransition,
      previousStatus: "assigned",
      newStatus: "cancelled",
      actorUserId: 10,
    });
    expect(ownerActorPlan.map((entry) => entry.userId)).toEqual([20]);
  });

  it("does not emit duplicate notifications when owner and pilot ids unexpectedly match", () => {
    const plan = buildB2bTransitionPushPlan({ ...baseTransition, assignedPilotId: 10 });
    expect(plan).toHaveLength(1);
    expect(plan[0].userId).toBe(10);
  });

  it("does not emit a notification for a no-op state change", () => {
    const plan = buildB2bTransitionPushPlan({ ...baseTransition, newStatus: "pending" });
    expect(plan).toEqual([]);
  });

  it("marks assignment, cancellation, and failure as high-priority mission pushes", () => {
    for (const status of ["assigned", "cancelled", "failed"] as const) {
      const previousStatus = status === "assigned" ? "pending" : "in_transit";
      const plan = buildB2bTransitionPushPlan({ ...baseTransition, previousStatus, newStatus: status });
      expect(plan.find((entry) => entry.audience === "pilot")?.message.priority).toBe("high");
    }
  });

  it("dispatches every planned recipient through the preference-aware boundary", async () => {
    const send = vi.fn(async ({ userId, preference }: any) => ({ userId, preference, enabled: true, sent: 1 }));
    const result = await notifyB2bDeliveryTransition(baseTransition, send);

    expect(send).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });
});
