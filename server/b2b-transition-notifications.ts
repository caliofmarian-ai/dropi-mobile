import type { PushMessage } from "./push-notifications";
import {
  sendPreferenceAwarePush,
  type PreferenceAwarePushResult,
  type PushPreferenceKey,
} from "./preference-aware-push";

export type B2bDeliveryStatus =
  | "pending"
  | "assigned"
  | "pickup_enroute"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "failed";

export type B2bTransitionPush = {
  userId: number;
  audience: "store_owner" | "pilot";
  preference: PushPreferenceKey;
  message: PushMessage;
};

export type B2bTransitionInput = {
  deliveryId: number;
  trackingCode: string;
  previousStatus: B2bDeliveryStatus;
  newStatus: B2bDeliveryStatus;
  storeOwnerId: number;
  assignedPilotId?: number | null;
  actorUserId?: number | null;
};

type SendTransitionPush = typeof sendPreferenceAwarePush;

const STATUS_LABELS: Record<B2bDeliveryStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  pickup_enroute: "En route to pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

function transitionData(input: B2bTransitionInput) {
  return {
    type: "b2b_delivery_status",
    target: "b2b",
    deliveryId: input.deliveryId,
    trackingCode: input.trackingCode,
    previousStatus: input.previousStatus,
    status: input.newStatus,
  };
}

/**
 * Builds the recipient plan without side effects.
 * - Store owners receive delivery/order updates (`pushOrders`).
 * - Assigned pilots receive mission updates (`pushMissions`).
 * - The actor is not pushed about their own action.
 * - A user is never duplicated in one transition.
 */
export function buildB2bTransitionPushPlan(input: B2bTransitionInput): B2bTransitionPush[] {
  if (input.previousStatus === input.newStatus) return [];

  const nextLabel = STATUS_LABELS[input.newStatus];
  const previousLabel = STATUS_LABELS[input.previousStatus];
  const data = transitionData(input);
  const plan: B2bTransitionPush[] = [];
  const plannedUsers = new Set<number>();

  const add = (entry: B2bTransitionPush) => {
    if (!Number.isSafeInteger(entry.userId) || entry.userId <= 0) return;
    if (entry.userId === input.actorUserId || plannedUsers.has(entry.userId)) return;
    plannedUsers.add(entry.userId);
    plan.push(entry);
  };

  add({
    userId: input.storeOwnerId,
    audience: "store_owner",
    preference: "pushOrders",
    message: {
      title: `Delivery ${nextLabel}`,
      body: `${input.trackingCode}: ${previousLabel} → ${nextLabel}.`,
      data,
      channelId: "orders",
      priority: input.newStatus === "cancelled" || input.newStatus === "failed" ? "high" : "normal",
    },
  });

  if (input.assignedPilotId) {
    add({
      userId: input.assignedPilotId,
      audience: "pilot",
      preference: "pushMissions",
      message: {
        title: `Mission ${nextLabel}`,
        body: `Mission ${input.trackingCode} is now ${nextLabel}.`,
        data,
        channelId: "missions",
        priority:
          input.newStatus === "assigned" || input.newStatus === "cancelled" || input.newStatus === "failed"
            ? "high"
            : "normal",
      },
    });
  }

  return plan;
}

/**
 * Dispatches the side-effect-free plan through the preference-aware push helper.
 * Push failures never roll back or reject the already-valid delivery transition.
 */
export async function notifyB2bDeliveryTransition(
  input: B2bTransitionInput,
  sendPush: SendTransitionPush = sendPreferenceAwarePush,
): Promise<PreferenceAwarePushResult[]> {
  const plan = buildB2bTransitionPushPlan(input);
  const results: PreferenceAwarePushResult[] = [];

  for (const notification of plan) {
    results.push(
      await sendPush({
        userId: notification.userId,
        preference: notification.preference,
        message: notification.message,
      }),
    );
  }

  return results;
}
