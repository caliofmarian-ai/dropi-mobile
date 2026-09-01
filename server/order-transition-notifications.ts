import type { PushMessage } from "./push-notifications";
import {
  sendPreferenceAwarePush,
  type PreferenceAwarePushResult,
  type PushPreferenceKey,
} from "./preference-aware-push";
import type { OrderStatus } from "./order-state-machine";

export type OrderTransitionInput = {
  orderId: number;
  orderUid: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  customerId: number;
  merchantId: number;
  pilotId?: number | null;
  actorUserId?: number | null;
};

export type OrderTransitionPush = {
  userId: number;
  audience: "customer" | "merchant" | "pilot";
  preference: PushPreferenceKey;
  message: PushMessage;
};

type SendTransitionPush = typeof sendPreferenceAwarePush;

const LABELS: Record<OrderStatus, string> = {
  initiated: "Initiated",
  validated: "Validated",
  preparing: "Preparing",
  ready: "Ready",
  accepted: "Accepted",
  in_execution: "In execution",
  completed: "Completed",
  cancelled: "Cancelled",
  fallback: "Fallback active",
};

function data(input: OrderTransitionInput) {
  return {
    type: "order_status",
    target: "order",
    orderId: input.orderId,
    orderUid: input.orderUid,
    previousStatus: input.previousStatus,
    status: input.newStatus,
  };
}

export function buildOrderTransitionPushPlan(input: OrderTransitionInput): OrderTransitionPush[] {
  if (input.previousStatus === input.newStatus) return [];

  const previousLabel = LABELS[input.previousStatus];
  const nextLabel = LABELS[input.newStatus];
  const payload = data(input);
  const plan: OrderTransitionPush[] = [];
  const seen = new Set<number>();

  const add = (entry: OrderTransitionPush) => {
    if (!Number.isSafeInteger(entry.userId) || entry.userId <= 0) return;
    if (entry.userId === input.actorUserId || seen.has(entry.userId)) return;
    seen.add(entry.userId);
    plan.push(entry);
  };

  const urgent = input.newStatus === "cancelled" || input.newStatus === "fallback";

  add({
    userId: input.customerId,
    audience: "customer",
    preference: "pushOrders",
    message: {
      title: `Order ${nextLabel}`,
      body: `${input.orderUid}: ${previousLabel} → ${nextLabel}.`,
      data: payload,
      channelId: "orders",
      priority: urgent || input.newStatus === "completed" ? "high" : "normal",
    },
  });

  add({
    userId: input.merchantId,
    audience: "merchant",
    preference: "pushOrders",
    message: {
      title: `Order ${nextLabel}`,
      body: `${input.orderUid}: ${previousLabel} → ${nextLabel}.`,
      data: payload,
      channelId: "orders",
      priority: urgent ? "high" : "normal",
    },
  });

  if (input.pilotId) {
    add({
      userId: input.pilotId,
      audience: "pilot",
      preference: "pushMissions",
      message: {
        title: `Mission ${nextLabel}`,
        body: `Order ${input.orderUid} is now ${nextLabel}.`,
        data: payload,
        channelId: "missions",
        priority: urgent || input.newStatus === "accepted" ? "high" : "normal",
      },
    });
  }

  return plan;
}

export async function notifyOrderTransition(
  input: OrderTransitionInput,
  sendPush: SendTransitionPush = sendPreferenceAwarePush,
): Promise<PreferenceAwarePushResult[]> {
  const results: PreferenceAwarePushResult[] = [];
  for (const notification of buildOrderTransitionPushPlan(input)) {
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
