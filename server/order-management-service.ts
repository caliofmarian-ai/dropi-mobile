import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  auditLogs,
  orders,
  pilotProfiles,
  products,
  stores,
  users,
} from "../drizzle/schema";
import { createInAppNotification } from "./create-notification";
import { getDb } from "./db";
import {
  assertOrderTransitionAuthorized,
  type OrderActor,
  type OrderStatus,
} from "./order-state-machine";
import { notifyOrderTransition } from "./order-transition-notifications";
import { sendPreferenceAwarePush } from "./preference-aware-push";
import { evaluateMarketplaceListingVisibility, normalizeMarketplaceZone, sameMarketplaceZone } from "../shared/marketplace-policy";

export type MarketplaceOrderLineInput = {
  productId: number;
  quantity: number;
};

export type MarketplaceOrderActor = OrderActor & {
  channel?: "C1" | "C2" | "C3" | "ADMIN" | null;
  zone?: string | null;
};

function toNumber(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function transitionSeverity(status: OrderStatus): "info" | "warning" | "critical" {
  if (status === "fallback") return "critical";
  if (status === "cancelled") return "warning";
  return "info";
}

export async function createMarketplaceOrder(input: {
  actor: MarketplaceOrderActor;
  storeId: number;
  items: MarketplaceOrderLineInput[];
  deliveryAddress: string;
  zone: string;
}): Promise<{ orderId: number; orderUid: string; status: "initiated" }> {
  if (input.actor.dropiRole !== "customer") {
    throw new Error("Only customer accounts can place Marketplace orders.");
  }
  if (!input.actor.isActive) {
    throw new Error("Inactive accounts cannot place orders.");
  }

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const storeRows = await db
    .select()
    .from(stores)
    .where(and(eq(stores.id, input.storeId), eq(stores.status, "active"), eq(stores.type, "internal")))
    .limit(1);
  const store = storeRows[0];
  if (!store) throw new Error("Active Marketplace store not found.");
  const requestedZone = normalizeMarketplaceZone(input.zone);
  if (!sameMarketplaceZone(requestedZone, store.zone)) {
    throw new Error("Selected Marketplace store is outside the requested zone.");
  }

  const normalizedItems = input.items.filter(
    (line) => Number.isSafeInteger(line.productId) && line.productId > 0 && Number.isSafeInteger(line.quantity) && line.quantity > 0,
  );
  if (normalizedItems.length === 0 || normalizedItems.length !== input.items.length) {
    throw new Error("Order items are invalid.");
  }

  const productIds = [...new Set(normalizedItems.map((line) => line.productId))];
  const productRows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, store.id),
        eq(products.status, "approved"),
        eq(products.isActive, true),
        inArray(products.id, productIds),
      ),
    );

  if (productRows.length !== productIds.length) {
    throw new Error("One or more products are unavailable for this store.");
  }

  const productsById = new Map(productRows.map((product) => [product.id, product]));
  let totalAmount = 0;
  let totalWeightGrams = 0;
  const snapshotItems = normalizedItems.map((line) => {
    const product = productsById.get(line.productId)!;
    const visibility = evaluateMarketplaceListingVisibility({
      status: product.status,
      isActive: product.isActive,
      stock: product.stock,
      category: product.category,
      productZone: product.zone,
      storeZone: store.zone,
      requestedZone,
    });
    if (!visibility.purchasable) {
      throw new Error(`${product.name} is not purchasable in the requested Marketplace zone (${visibility.reasons.join(", ")}).`);
    }
    if (product.stock != null && product.stock < line.quantity) {
      throw new Error(`${product.name} does not have enough stock.`);
    }

    const unitPrice = toNumber(product.price);
    const unitWeight = toNumber(product.weight);
    totalAmount += unitPrice * line.quantity;
    totalWeightGrams += unitWeight * line.quantity;

    return {
      productId: product.id,
      name: product.name,
      quantity: line.quantity,
      unitPrice,
      weight: unitWeight / 1000,
    };
  });

  const orderUid = randomUUID();
  const inserted = await db
    .insert(orders)
    .values({
      orderUid,
      customerId: input.actor.id,
      merchantId: store.ownerId,
      status: "initiated",
      items: snapshotItems,
      totalAmount: totalAmount.toFixed(2),
      deliveryAddress: input.deliveryAddress.trim(),
      pickupAddress: store.physicalAddress || store.name,
      zone: requestedZone,
      packageWeight: (totalWeightGrams / 1000).toFixed(2),
    })
    .$returningId();

  const orderId = inserted[0]?.id;
  if (!orderId) throw new Error("Order could not be created.");

  await db.insert(auditLogs).values({
    userId: input.actor.id,
    userRole: input.actor.dropiRole || "customer",
    action: "order.created",
    resourceType: "order",
    resourceId: String(orderId),
    details: { orderUid, storeId: store.id, status: "initiated", itemCount: snapshotItems.length },
    severity: "info",
    channel: input.actor.channel || "C1",
  });

  await sendPreferenceAwarePush({
    userId: store.ownerId,
    preference: "pushOrders",
    message: {
      title: "New Marketplace order",
      body: `${orderUid} is waiting for validation.`,
      data: { type: "order_created", target: "order", orderId, orderUid, status: "initiated" },
      channelId: "orders",
      priority: "high",
    },
  });
  await createInAppNotification({
    userId: store.ownerId,
    title: "New Marketplace order",
    body: `${orderUid} is waiting for validation.`,
    category: "orders",
    metadata: { orderId, orderUid, status: "initiated" },
  });

  return { orderId, orderUid, status: "initiated" };
}

async function notifyReadyPilots(order: typeof orders.$inferSelect): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const availableProfiles = await db
    .select({ userId: pilotProfiles.userId })
    .from(pilotProfiles)
    .where(eq(pilotProfiles.isAvailable, true));
  const ids = [...new Set(availableProfiles.map((profile) => profile.userId))];
  if (ids.length === 0) return 0;

  const eligible = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        inArray(users.id, ids),
        eq(users.dropiRole, "delivery_partner"),
        eq(users.isVerified, true),
        eq(users.isActive, true),
        ...(order.zone ? [eq(users.zone, order.zone)] : []),
      ),
    );

  let recipients = 0;
  for (const pilot of eligible) {
    const message = `Order ${order.orderUid} is READY and available for voluntary acceptance.`;
    await sendPreferenceAwarePush({
      userId: pilot.id,
      preference: "pushMissions",
      message: {
        title: "Delivery available",
        body: message,
        data: { type: "order_ready", target: "order", orderId: order.id, orderUid: order.orderUid, status: "ready" },
        channelId: "missions",
        priority: "high",
      },
    });
    await createInAppNotification({
      userId: pilot.id,
      title: "Delivery available",
      body: message,
      category: "missions",
      metadata: { type: "order_ready", target: "order", orderId: order.id, orderUid: order.orderUid, status: "ready" },
    });
    recipients++;
  }
  return recipients;
}

export async function transitionMarketplaceOrder(input: {
  actor: MarketplaceOrderActor;
  orderId: number;
  newStatus: OrderStatus;
  reason?: string;
}): Promise<{ previousStatus: OrderStatus; status: OrderStatus; pilotId: number | null; readyPilotNotifications: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const rows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  const order = rows[0];
  if (!order) throw new Error("Order not found.");

  const previousStatus = order.status as OrderStatus;
  const authorization = assertOrderTransitionAuthorized(
    {
      customerId: order.customerId,
      merchantId: order.merchantId,
      pilotId: order.pilotId ?? null,
      status: previousStatus,
    },
    input.actor,
    input.newStatus,
  );

  const pilotId = authorization.assignPilotId ?? order.pilotId ?? null;
  const update: Partial<typeof orders.$inferInsert> = { status: input.newStatus };
  if (authorization.assignPilotId) update.pilotId = authorization.assignPilotId;
  if (input.newStatus === "cancelled" || input.newStatus === "fallback") {
    update.cancellationReason = input.reason?.trim() || null;
  }

  await db.update(orders).set(update).where(eq(orders.id, order.id));

  await db.insert(auditLogs).values({
    userId: input.actor.id,
    userRole: authorization.actorKind,
    action: "order.status_transition",
    resourceType: "order",
    resourceId: String(order.id),
    details: {
      orderUid: order.orderUid,
      previousStatus,
      newStatus: input.newStatus,
      reason: input.reason || null,
      pilotId,
    },
    severity: transitionSeverity(input.newStatus),
    channel: input.actor.channel || "C1",
  });

  await notifyOrderTransition({
    orderId: order.id,
    orderUid: order.orderUid,
    previousStatus,
    newStatus: input.newStatus,
    customerId: order.customerId,
    merchantId: order.merchantId,
    pilotId,
    actorUserId: input.actor.id,
  });

  const participantIds = [...new Set([order.customerId, order.merchantId, pilotId].filter((id): id is number => Boolean(id && id !== input.actor.id)))];
  for (const userId of participantIds) {
    await createInAppNotification({
      userId,
      title: `Order ${input.newStatus.replace(/_/g, " ")}`,
      body: `${order.orderUid}: ${previousStatus.replace(/_/g, " ")} → ${input.newStatus.replace(/_/g, " ")}.`,
      category: userId === pilotId ? "missions" : "orders",
      metadata: { orderId: order.id, orderUid: order.orderUid, previousStatus, status: input.newStatus },
    });
  }

  const readyPilotNotifications = input.newStatus === "ready" ? await notifyReadyPilots({ ...order, status: "ready" }) : 0;

  return { previousStatus, status: input.newStatus, pilotId, readyPilotNotifications };
}

export async function getMarketplaceOrderTimeline(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.resourceType, "order"), eq(auditLogs.resourceId, String(orderId))))
    .orderBy(desc(auditLogs.createdAt));
}

export async function listReadyMarketplaceOrders(actor: MarketplaceOrderActor) {
  if (actor.dropiRole !== "delivery_partner" || !actor.isVerified || !actor.isActive) return [];

  const db = await getDb();
  if (!db) return [];
  const filters = [eq(orders.status, "ready")];
  if (actor.zone) filters.push(eq(orders.zone, actor.zone));

  return db.select().from(orders).where(and(...filters)).orderBy(desc(orders.createdAt)).limit(100);
}

export async function listAssignedMarketplaceOrders(actor: MarketplaceOrderActor) {
  if (actor.dropiRole !== "delivery_partner" || !actor.isVerified || !actor.isActive) return [];

  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.pilotId, actor.id),
        inArray(orders.status, ["accepted", "in_execution", "fallback"]),
      ),
    )
    .orderBy(desc(orders.updatedAt))
    .limit(100);
}
