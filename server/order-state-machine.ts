export const CANONICAL_ORDER_STATES = [
  "initiated",
  "validated",
  "preparing",
  "ready",
  "accepted",
  "in_execution",
  "completed",
] as const;

export const ORDER_STATES = [
  ...CANONICAL_ORDER_STATES,
  "cancelled",
  "fallback",
] as const;

export type OrderStatus = (typeof ORDER_STATES)[number];
export type OrderActorKind = "customer" | "merchant" | "delivery_partner" | "admin";

export type OrderActor = {
  id: number;
  dropiRole?: string | null;
  role?: string | null;
  isVerified?: boolean | null;
  isActive?: boolean | null;
};

export type OrderAccessRecord = {
  customerId: number;
  merchantId: number;
  pilotId: number | null;
  status: OrderStatus;
};

export class OrderTransitionError extends Error {
  constructor(
    public readonly code:
      | "INVALID_TRANSITION"
      | "ROLE_FORBIDDEN"
      | "RESOURCE_FORBIDDEN"
      | "PILOT_NOT_VERIFIED"
      | "ACCOUNT_INACTIVE",
    message: string,
  ) {
    super(message);
    this.name = "OrderTransitionError";
  }
}

type TransitionRule = {
  from: OrderStatus;
  to: OrderStatus;
  actors: readonly OrderActorKind[];
};

/**
 * Canonical happy path:
 * INITIATED → VALIDATED → PREPARING → READY → ACCEPTED → IN_EXECUTION → COMPLETED.
 *
 * Exceptional states never bypass READY:
 * - customer/merchant/admin may cancel before pilot acceptance;
 * - assigned pilot/admin may enter FALLBACK after acceptance/execution;
 * - FALLBACK can be resolved to COMPLETED by assigned pilot or admin, or CANCELLED by admin.
 */
export const ORDER_TRANSITION_RULES: readonly TransitionRule[] = [
  { from: "initiated", to: "validated", actors: ["merchant"] },
  { from: "validated", to: "preparing", actors: ["merchant"] },
  { from: "preparing", to: "ready", actors: ["merchant"] },
  { from: "ready", to: "accepted", actors: ["delivery_partner"] },
  { from: "accepted", to: "in_execution", actors: ["delivery_partner"] },
  { from: "in_execution", to: "completed", actors: ["delivery_partner"] },

  { from: "initiated", to: "cancelled", actors: ["customer", "merchant", "admin"] },
  { from: "validated", to: "cancelled", actors: ["customer", "merchant", "admin"] },
  { from: "preparing", to: "cancelled", actors: ["customer", "merchant", "admin"] },
  { from: "ready", to: "cancelled", actors: ["customer", "merchant", "admin"] },

  { from: "accepted", to: "fallback", actors: ["delivery_partner", "admin"] },
  { from: "in_execution", to: "fallback", actors: ["delivery_partner", "admin"] },
  { from: "fallback", to: "completed", actors: ["delivery_partner", "admin"] },
  { from: "fallback", to: "cancelled", actors: ["admin"] },
] as const;

export function resolveOrderActorKind(actor: OrderActor): OrderActorKind | null {
  if (actor.role === "admin" || actor.dropiRole === "system_administrator") return "admin";
  if (actor.dropiRole === "customer") return "customer";
  if (actor.dropiRole === "merchant") return "merchant";
  if (actor.dropiRole === "delivery_partner") return "delivery_partner";
  return null;
}

export function getAllowedOrderTransitions(status: OrderStatus, actorKind?: OrderActorKind): OrderStatus[] {
  return ORDER_TRANSITION_RULES
    .filter((rule) => rule.from === status && (!actorKind || rule.actors.includes(actorKind)))
    .map((rule) => rule.to);
}

export function assertOrderTransitionAuthorized(
  order: OrderAccessRecord,
  actor: OrderActor,
  newStatus: OrderStatus,
): { actorKind: OrderActorKind; assignPilotId: number | null } {
  if (!actor.isActive) {
    throw new OrderTransitionError("ACCOUNT_INACTIVE", "Inactive accounts cannot change order state.");
  }

  const actorKind = resolveOrderActorKind(actor);
  if (!actorKind) {
    throw new OrderTransitionError("ROLE_FORBIDDEN", "This role cannot change order state.");
  }

  const rule = ORDER_TRANSITION_RULES.find(
    (candidate) => candidate.from === order.status && candidate.to === newStatus,
  );
  if (!rule) {
    throw new OrderTransitionError(
      "INVALID_TRANSITION",
      `Transition ${order.status} → ${newStatus} is not allowed.`,
    );
  }
  if (!rule.actors.includes(actorKind)) {
    throw new OrderTransitionError(
      "ROLE_FORBIDDEN",
      `${actorKind} cannot perform ${order.status} → ${newStatus}.`,
    );
  }

  if (actorKind === "customer" && order.customerId !== actor.id) {
    throw new OrderTransitionError("RESOURCE_FORBIDDEN", "Customer cannot change another customer's order.");
  }
  if (actorKind === "merchant" && order.merchantId !== actor.id) {
    throw new OrderTransitionError("RESOURCE_FORBIDDEN", "Merchant cannot change another merchant's order.");
  }

  if (actorKind === "delivery_partner") {
    if (!actor.isVerified) {
      throw new OrderTransitionError("PILOT_NOT_VERIFIED", "Verified delivery-partner status is required.");
    }

    if (order.status === "ready" && newStatus === "accepted") {
      if (order.pilotId && order.pilotId !== actor.id) {
        throw new OrderTransitionError("RESOURCE_FORBIDDEN", "Order is already assigned to another pilot.");
      }
      return { actorKind, assignPilotId: actor.id };
    }

    if (order.pilotId !== actor.id) {
      throw new OrderTransitionError("RESOURCE_FORBIDDEN", "Only the assigned pilot can execute this order.");
    }
  }

  return { actorKind, assignPilotId: null };
}
