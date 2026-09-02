import { and, desc, eq, inArray, not, or } from "drizzle-orm";
import { z } from "zod";
import { b2bDeliveries, deliveries, orders, stores, users } from "../drizzle/schema";
import { deliveryProofAttestations, deliveryProofs } from "../drizzle/operational-trace-schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createMarketplaceOrder,
  getMarketplaceOrderTimeline,
  listAssignedMarketplaceOrders,
  listReadyMarketplaceOrders,
  transitionMarketplaceOrder,
} from "./order-management-service";
import { RECEPTION_METHODS } from "../shared/operational-trace-policy";
import { attestDeliveryProof, getOperationalTrace } from "./operational-trace-service";

const ORDER_STATUS_VALUES = [
  "initiated",
  "validated",
  "preparing",
  "ready",
  "accepted",
  "in_execution",
  "completed",
  "cancelled",
  "fallback",
] as const;

const COMPLETION_PROOF_SCHEMA = z.object({
  receptionMethod: z.enum(RECEPTION_METHODS),
  artifactUrl: z.string().trim().max(1000).optional(),
  artifactHash: z.string().trim().min(8).max(128).optional(),
  notes: z.string().trim().max(1000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

type MobileDeliveryMode = "drone" | "auto" | "van" | "ebike" | "multimodal";
type MobileVehicleType = "drone" | "auto" | "van" | "ebike" | null;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function inferDeliveryMode(orderStatus: string, deliveryRow?: { droneId: string | null } | null): MobileDeliveryMode {
  if (deliveryRow?.droneId) return "drone";
  if (orderStatus === "fallback") return "multimodal";
  return "auto";
}

function inferVehicleType(orderStatus: string, deliveryRow?: { droneId: string | null } | null): MobileVehicleType {
  if (deliveryRow?.droneId) return "drone";
  if (["accepted", "in_execution", "completed", "fallback"].includes(orderStatus)) return "auto";
  return null;
}

function parseOrderItems(raw: unknown): Array<{ name: string; quantity: number; weight?: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (typeof obj.name !== "string") return null;
      return {
        name: obj.name,
        quantity: toNumber(obj.quantity, 1),
        weight: obj.weight != null ? toNumber(obj.weight, 0) : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function toMarketplacePilotCard(
  row: typeof orders.$inferSelect,
  merchantName: string,
) {
  return {
    id: row.id,
    orderId: row.id,
    orderUid: row.orderUid,
    pickupZone: row.pickupAddress || "",
    deliveryZone: row.deliveryAddress || "",
    packageWeight: toNumber(row.packageWeight, 0),
    distance: 0,
    estimatedTime: row.estimatedTime ?? 0,
    merchantName,
    status: row.status,
    vehicleType: "auto" as const,
    deliveryMode: "auto" as const,
  };
}

export const operationsRouter = router({
  placeOrder: protectedProcedure
    .input(
      z.object({
        storeId: z.number().int().positive(),
        items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive() })).min(1),
        deliveryAddress: z.string().trim().min(3).max(1000),
        zone: z.string().trim().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      createMarketplaceOrder({
        actor: ctx.user as any,
        storeId: input.storeId,
        items: input.items,
        deliveryAddress: input.deliveryAddress,
        zone: input.zone,
        auditSession: ctx.session,
      }),
    ),

  transitionOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.number().int().positive(),
        newStatus: z.enum(ORDER_STATUS_VALUES),
        reason: z.string().trim().min(1).max(500).optional(),
        completionProof: COMPLETION_PROOF_SCHEMA.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      transitionMarketplaceOrder({
        actor: ctx.user as any,
        orderId: input.orderId,
        newStatus: input.newStatus,
        reason: input.reason,
        completionProof: input.completionProof,
        auditSession: ctx.session,
      }),
    ),

  availableMarketplaceOrders: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user as any;
    const rows = await listReadyMarketplaceOrders(user);
    if (rows.length === 0) return { orders: [] };

    const db = await getDb();
    if (!db) return { orders: [] };
    const merchantIds = [...new Set(rows.map((row) => row.merchantId))];
    const merchants = await db.select().from(users).where(inArray(users.id, merchantIds));
    const merchantNames = new Map(merchants.map((merchant) => [merchant.id, merchant.name || merchant.email || `Merchant #${merchant.id}`]));

    return {
      orders: rows.map((row) => toMarketplacePilotCard(row, merchantNames.get(row.merchantId) || `Merchant #${row.merchantId}`)),
    };
  }),

  myMarketplacePilotOrders: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user as any;
    const rows = await listAssignedMarketplaceOrders(user);
    if (rows.length === 0) return { orders: [] };

    const db = await getDb();
    if (!db) return { orders: [] };
    const merchantIds = [...new Set(rows.map((row) => row.merchantId))];
    const merchants = await db.select().from(users).where(inArray(users.id, merchantIds));
    const merchantNames = new Map(merchants.map((merchant) => [merchant.id, merchant.name || merchant.email || `Merchant #${merchant.id}`]));

    return {
      orders: rows.map((row) => toMarketplacePilotCard(row, merchantNames.get(row.merchantId) || `Merchant #${row.merchantId}`)),
    };
  }),

  myOrderTimeline: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { events: [] };

      const rows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      const order = rows[0];
      if (!order) return { events: [] };

      const user = ctx.user as any;
      const authorized =
        order.customerId === user.id ||
        order.merchantId === user.id ||
        order.pilotId === user.id ||
        user.role === "admin" ||
        user.dropiRole === "system_administrator";
      if (!authorized) throw new Error("Order timeline not accessible for current user");

      const events = await getMarketplaceOrderTimeline(order.id);
      return {
        events: events.map((event) => ({
          id: event.id,
          action: event.action,
          actorRole: event.userRole,
          details: event.details,
          severity: event.severity,
          createdAt: event.createdAt.toISOString(),
        })),
      };
    }),

  myOrderTrace: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { events: [], telemetry: [], proofs: [] };
      const rows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      const order = rows[0];
      if (!order) throw new Error("Order not found.");
      const user = ctx.user as any;
      const authorized = order.customerId === user.id || order.merchantId === user.id || order.pilotId === user.id || user.role === "admin" || user.dropiRole === "system_administrator" || user.dropiRole === "audit_manager";
      if (!authorized) throw new Error("Operational trace not accessible for current user");
      const trace = await getOperationalTrace("C1", "order", order.id);
      return {
        events: trace.events.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString(), createdAt: event.createdAt.toISOString() })),
        telemetry: trace.telemetry.map((sample) => ({
          id: sample.id,
          pilotUserId: sample.pilotUserId,
          latitude: Number(sample.latitude),
          longitude: Number(sample.longitude),
          speed: Number(sample.speed),
          heading: Number(sample.heading),
          altitude: sample.altitude == null ? null : Number(sample.altitude),
          vehicleType: sample.vehicleType,
          recordedAt: sample.recordedAt.toISOString(),
          evidenceHash: sample.evidenceHash,
        })),
        proofs: trace.proofs.map((proof) => ({
          ...proof,
          completedAt: proof.completedAt.toISOString(),
          createdAt: proof.createdAt.toISOString(),
          latitude: proof.latitude == null ? null : Number(proof.latitude),
          longitude: proof.longitude == null ? null : Number(proof.longitude),
          attestations: proof.attestations.map((attestation) => ({
            ...attestation,
            attestedAt: attestation.attestedAt.toISOString(),
            createdAt: attestation.createdAt.toISOString(),
          })),
        })),
      };
    }),

  confirmOrderReceipt: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive(), proofId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const orderRows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      const order = orderRows[0];
      if (!order || order.customerId !== ctx.user!.id || order.status !== "completed") {
        throw new Error("Only the completed order customer can confirm receipt.");
      }
      const proofRows = await db.select().from(deliveryProofs).where(and(
        eq(deliveryProofs.id, input.proofId),
        eq(deliveryProofs.channel, "C1"),
        eq(deliveryProofs.targetType, "order"),
        eq(deliveryProofs.targetId, order.id),
      )).limit(1);
      if (!proofRows[0]) throw new Error("Delivery proof not found for this order.");
      const existing = await db.select().from(deliveryProofAttestations).where(and(
        eq(deliveryProofAttestations.proofId, input.proofId),
        eq(deliveryProofAttestations.signerUserId, ctx.user!.id),
        eq(deliveryProofAttestations.attestationKind, "recipient_confirmed"),
      )).limit(1);
      if (existing[0]) return { confirmed: true, alreadyConfirmed: true };
      await attestDeliveryProof({
        proofId: input.proofId,
        signerUserId: ctx.user!.id,
        signerRole: ctx.user!.dropiRole || "customer",
        kind: "recipient_confirmed",
      });
      return { confirmed: true, alreadyConfirmed: false };
    }),

  myOrders: protectedProcedure
    .input(
      z
        .object({
          includeCompleted: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { orders: [] };

      const user = ctx.user as any;
      const includeCompleted = input?.includeCompleted ?? true;

      let roleFilter;
      if (user.dropiRole === "customer") {
        roleFilter = eq(orders.customerId, user.id);
      } else if (user.dropiRole === "merchant") {
        roleFilter = eq(orders.merchantId, user.id);
      } else {
        return { orders: [] };
      }

      const filters: any[] = [roleFilter];
      if (!includeCompleted) {
        filters.push(not(inArray(orders.status, ["completed", "cancelled"])));
      }

      const orderRows = await db
        .select()
        .from(orders)
        .where(and(...filters))
        .orderBy(desc(orders.createdAt))
        .limit(100);

      if (orderRows.length === 0) return { orders: [] };

      const orderIds = orderRows.map((row) => row.id);
      const merchantIds = [...new Set(orderRows.map((row) => row.merchantId))];
      const pilotIds = [...new Set(orderRows.map((row) => row.pilotId).filter((id): id is number => typeof id === "number"))];
      const userIds = [...new Set([...merchantIds, ...pilotIds])];

      const [userRows, deliveryRows] = await Promise.all([
        userIds.length > 0 ? db.select().from(users).where(inArray(users.id, userIds)) : Promise.resolve([]),
        db.select().from(deliveries).where(inArray(deliveries.orderId, orderIds)).orderBy(desc(deliveries.updatedAt)),
      ]);

      const namesByUserId = new Map<number, string>();
      for (const userRow of userRows) {
        namesByUserId.set(userRow.id, userRow.name || userRow.email || `User #${userRow.id}`);
      }

      const deliveryByOrderId = new Map<number, (typeof deliveryRows)[number]>();
      for (const deliveryRow of deliveryRows) {
        if (!deliveryByOrderId.has(deliveryRow.orderId)) {
          deliveryByOrderId.set(deliveryRow.orderId, deliveryRow);
        }
      }

      return {
        orders: orderRows.map((row) => {
          const deliveryRow = deliveryByOrderId.get(row.id);
          const deliveryMode = inferDeliveryMode(row.status, deliveryRow);
          const vehicleType = inferVehicleType(row.status, deliveryRow);
          return {
            id: row.id,
            orderUid: row.orderUid,
            customerId: row.customerId,
            merchantId: row.merchantId,
            merchantName: namesByUserId.get(row.merchantId) || `Merchant #${row.merchantId}`,
            pilotId: row.pilotId,
            pilotName: row.pilotId ? namesByUserId.get(row.pilotId) || null : null,
            status: row.status,
            items: parseOrderItems(row.items),
            totalAmount: toNumber(row.totalAmount, 0),
            deliveryAddress: row.deliveryAddress || "",
            pickupAddress: row.pickupAddress || "",
            zone: row.zone || "",
            estimatedTime: row.estimatedTime ?? 0,
            packageWeight: toNumber(row.packageWeight, 0),
            createdAt: row.createdAt.toISOString(),
            deliveryMode,
            fallbackMode: row.status === "fallback" ? "auto" : null,
            receptionType: null as string | null,
            vehicleId: deliveryRow?.droneId || null,
            vehicleType,
          };
        }),
      };
    }),

  myOrderById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const row = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
      if (row.length === 0) return null;
      const orderRow = row[0];

      const user = ctx.user as any;
      const isOwner =
        orderRow.customerId === user.id ||
        orderRow.merchantId === user.id ||
        orderRow.pilotId === user.id ||
        user.role === "admin" ||
        user.dropiRole === "system_administrator";

      if (!isOwner) {
        throw new Error("Order not accessible for current user");
      }

      const [merchant, pilot, deliveryRow] = await Promise.all([
        db.select().from(users).where(eq(users.id, orderRow.merchantId)).limit(1),
        orderRow.pilotId ? db.select().from(users).where(eq(users.id, orderRow.pilotId)).limit(1) : Promise.resolve([]),
        db.select().from(deliveries).where(eq(deliveries.orderId, orderRow.id)).orderBy(desc(deliveries.updatedAt)).limit(1),
      ]);

      const delivery = deliveryRow[0];
      const deliveryMode = inferDeliveryMode(orderRow.status, delivery);
      const vehicleType = inferVehicleType(orderRow.status, delivery);

      return {
        id: orderRow.id,
        orderUid: orderRow.orderUid,
        customerId: orderRow.customerId,
        merchantId: orderRow.merchantId,
        merchantName: merchant[0]?.name || merchant[0]?.email || `Merchant #${orderRow.merchantId}`,
        pilotId: orderRow.pilotId,
        pilotName: pilot[0]?.name || pilot[0]?.email || null,
        status: orderRow.status,
        items: parseOrderItems(orderRow.items),
        totalAmount: toNumber(orderRow.totalAmount, 0),
        deliveryAddress: orderRow.deliveryAddress || "",
        pickupAddress: orderRow.pickupAddress || "",
        zone: orderRow.zone || "",
        estimatedTime: orderRow.estimatedTime ?? 0,
        packageWeight: toNumber(orderRow.packageWeight, 0),
        createdAt: orderRow.createdAt.toISOString(),
        deliveryMode,
        fallbackMode: orderRow.status === "fallback" ? "auto" : null,
        receptionType: null as string | null,
        vehicleId: delivery?.droneId || null,
        vehicleType,
      };
    }),

  myPilotMissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { missions: [] };

    const user = ctx.user as any;
    const isAdmin = user.role === "admin" || user.dropiRole === "system_administrator";
    if (!isAdmin && user.dropiRole !== "delivery_partner") return { missions: [] };

    const rows = await db
      .select()
      .from(b2bDeliveries)
      .where(
        and(
          inArray(b2bDeliveries.status, ["pending", "assigned", "pickup_enroute", "picked_up", "in_transit"]),
          or(eq(b2bDeliveries.assignedPilotId, user.id), eq(b2bDeliveries.status, "pending")),
        ),
      )
      .orderBy(desc(b2bDeliveries.createdAt))
      .limit(100);

    if (rows.length === 0) return { missions: [] };

    const storeIds = [...new Set(rows.map((row) => row.storeId))];
    const storeRows = await db.select().from(stores).where(inArray(stores.id, storeIds));
    const storeNameById = new Map(storeRows.map((store) => [store.id, store.name]));

    return {
      missions: rows.map((row) => {
        const mode: MobileDeliveryMode = row.deliveryMode === "drone" || row.preferredMode === "drone" ? "drone" : "auto";
        const vehicleType: Exclude<MobileVehicleType, null> = mode === "drone" ? "drone" : "auto";
        const status =
          row.status === "pending"
            ? "available"
            : row.status === "in_transit" || row.status === "picked_up" || row.status === "pickup_enroute"
              ? "in_progress"
              : "accepted";

        return {
          id: row.id,
          orderId: row.id,
          pickupZone: row.pickupAddress,
          deliveryZone: row.deliveryAddress,
          packageWeight: row.packageWeight ? row.packageWeight / 1000 : 0,
          distance: 0,
          estimatedTime: 0,
          merchantName: storeNameById.get(row.storeId) || `Store #${row.storeId}`,
          status,
          vehicleType,
          deliveryMode: mode,
        };
      }),
    };
  }),

  myPilotMissionById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const user = ctx.user as any;
      const isAdmin = user.role === "admin" || user.dropiRole === "system_administrator";
      if (!isAdmin && user.dropiRole !== "delivery_partner") return null;

      const rows = await db.select().from(b2bDeliveries).where(eq(b2bDeliveries.id, input.id)).limit(1);
      if (rows.length === 0) return null;
      const row = rows[0];

      if (!isAdmin && row.assignedPilotId && row.assignedPilotId !== user.id) {
        throw new Error("Mission not accessible for current user");
      }

      const storeRows = await db.select().from(stores).where(eq(stores.id, row.storeId)).limit(1);

      const mode: MobileDeliveryMode = row.deliveryMode === "drone" || row.preferredMode === "drone" ? "drone" : "auto";
      const vehicleType: Exclude<MobileVehicleType, null> = mode === "drone" ? "drone" : "auto";
      const status =
        row.status === "pending"
          ? "available"
          : row.status === "in_transit" || row.status === "picked_up" || row.status === "pickup_enroute"
            ? "in_progress"
            : "accepted";

      return {
        id: row.id,
        orderId: row.id,
        pickupZone: row.pickupAddress,
        deliveryZone: row.deliveryAddress,
        packageWeight: row.packageWeight ? row.packageWeight / 1000 : 0,
        distance: 0,
        estimatedTime: 0,
        merchantName: storeRows[0]?.name || `Store #${row.storeId}`,
        status,
        vehicleType,
        deliveryMode: mode,
      };
    }),

  myPilotMissionHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { missions: [] };

    const user = ctx.user as any;
    if (user.dropiRole !== "delivery_partner") return { missions: [] };

    const rows = await db
      .select()
      .from(b2bDeliveries)
      .where(and(eq(b2bDeliveries.assignedPilotId, user.id), inArray(b2bDeliveries.status, ["delivered", "failed", "cancelled"])))
      .orderBy(desc(b2bDeliveries.updatedAt))
      .limit(100);

    if (rows.length === 0) return { missions: [] };

    const storeIds = [...new Set(rows.map((row) => row.storeId))];
    const storeRows = await db.select().from(stores).where(inArray(stores.id, storeIds));
    const storeNameById = new Map(storeRows.map((store) => [store.id, store.name]));

    return {
      missions: rows.map((row) => ({
        id: row.id,
        merchantName: storeNameById.get(row.storeId) || `Store #${row.storeId}`,
        pickupZone: row.pickupAddress,
        deliveryZone: row.deliveryAddress,
        distance: 0,
        time: row.actualDeliveryAt && row.actualPickupAt ? `${Math.max(1, Math.round((row.actualDeliveryAt.getTime() - row.actualPickupAt.getTime()) / 60000))} min` : "—",
        date: row.updatedAt.toISOString(),
        status: row.status,
      })),
    };
  }),

  orderStatusValues: protectedProcedure.query(() => ({ values: ORDER_STATUS_VALUES })),
});
