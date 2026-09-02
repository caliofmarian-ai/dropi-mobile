/**
 * DROPi B2B Logistic API Router — Sprint E
 *
 * Implements Blueprint section 9.2: Logistic API for external B2B partners.
 * 
 * Features:
 * - API Key management (generate, revoke, list) per external store
 * - B2B delivery request lifecycle (create, status, cancel, estimate, list)
 * - Webhook endpoint management (register, test, list, delete)
 * - Webhook delivery logs for debugging
 * 
 * Authentication: API Key in header X-DROPi-API-Key (SHA-256 hashed in DB)
 * Rate limiting: configurable per API key (default 100 req/min)
 * Delivery estimates: marked "informativă, non-contractuală" — NOT SLA/guarantee
 * 
 * All mutations auto-audited via protectedProcedure middleware.
 */

import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { stores, apiKeys, webhookEndpoints, b2bDeliveries, webhookLogs, apiRequestLogs } from "../drizzle/schema";
import { eq, and, desc, sql, like } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { notifyOwner } from "./_core/notification";
import { triggerWebhooks, buildWebhookPayload, getWebhookEvents } from "./webhook-trigger";
import { onB2bDeliveryCompleted, onB2bDeliveryFailed } from "./pilot-rating-hooks";
import { notifyB2bDeliveryTransition } from "./b2b-transition-notifications";
import { appendOperationalEventWithDb, createDeliveryProofWithDb } from "./operational-trace-service";
import { RECEPTION_METHODS, assertB2bTransition } from "../shared/operational-trace-policy";

// ===== HELPERS =====

/** Generate a cryptographically secure API key with dropi_ prefix */
function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const raw = `dropi_${randomBytes}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.substring(0, 12); // "dropi_xxxxxx"
  return { raw, hash, prefix };
}

/** Generate a webhook signing secret */
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

/** Generate a unique tracking code */
function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `DRP-${timestamp}-${random}`;
}

/** Calculate delivery estimate (informative, non-contractual) */
function calculateEstimate(input: {
  pickupAddress: string;
  deliveryAddress: string;
  packageWeight?: number;
  preferredMode?: string;
  urgency?: string;
}): { estimatedMinutes: number; estimatedPrice: number; currency: string; mode: string; disclaimer: string } {
  // Simple estimation logic — in production this would use geocoding + route calculation
  const baseMinutes = input.urgency === "express" ? 30 : input.urgency === "scheduled" ? 120 : 60;
  const basePrice = input.urgency === "express" ? 25.0 : input.urgency === "scheduled" ? 12.0 : 15.0;

  // Weight surcharge
  const weightKg = (input.packageWeight || 1000) / 1000;
  const weightSurcharge = weightKg > 2 ? (weightKg - 2) * 2.5 : 0;

  // Mode selection
  let mode = "terrestrial";
  if (input.preferredMode === "drone" && weightKg <= 2) {
    mode = "drone";
  } else if (input.preferredMode === "any" && weightKg <= 2) {
    mode = "drone"; // Prefer drone if eligible
  }

  const estimatedPrice = Math.round((basePrice + weightSurcharge) * 100) / 100;

  return {
    estimatedMinutes: baseMinutes,
    estimatedPrice,
    currency: "RON",
    mode,
    disclaimer: "Estimare informativă, non-contractuală. Timpul și prețul final pot varia în funcție de condițiile reale de trafic și disponibilitatea piloților.",
  };
}

// ===== API KEY ROUTER =====
export const apiKeyRouter = router({
  /** Generate a new API key for the merchant's external store */
  generate: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      rateLimit: z.number().min(10).max(1000).optional(),
      expiresInDays: z.number().min(1).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      // Find the merchant's external store
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) {
        throw new Error("No external store found. Only external stores can use the Logistic API.");
      }

      const store = storeResult[0];

      // Check active key count (max 5 per store)
      const activeKeys = await db.select({ count: sql<number>`count(*)` })
        .from(apiKeys)
        .where(and(eq(apiKeys.storeId, store.id), eq(apiKeys.isActive, true)));

      if ((activeKeys[0]?.count || 0) >= 5) {
        throw new Error("Maximum 5 active API keys per store. Revoke an existing key first.");
      }

      const { raw, hash, prefix } = generateApiKey();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      await db.insert(apiKeys).values({
        storeId: store.id,
        keyHash: hash,
        keyPrefix: prefix,
        name: input.name,
        rateLimit: input.rateLimit || 100,
        expiresAt,
      });

      // Notify owner about new API key generation
      await notifyOwner({
        title: "New B2B API Key Generated",
        content: `Store "${store.name}" generated a new API key: ${input.name} (prefix: ${prefix})`,
      });

      return {
        apiKey: raw, // Only returned once at creation — never stored in plaintext
        prefix,
        name: input.name,
        rateLimit: input.rateLimit || 100,
        expiresAt: expiresAt?.toISOString() || null,
        warning: "Save this API key securely. It will not be shown again.",
      };
    }),

  /** Revoke an API key */
  revoke: protectedProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) throw new Error("No external store found");

      const key = await db.select().from(apiKeys)
        .where(and(eq(apiKeys.id, input.keyId), eq(apiKeys.storeId, storeResult[0].id)))
        .limit(1);

      if (key.length === 0) throw new Error("API key not found");
      if (!key[0].isActive) throw new Error("API key already revoked");

      await db.update(apiKeys)
        .set({ isActive: false, revokedAt: new Date() })
        .where(eq(apiKeys.id, input.keyId));

      return { success: true, message: "API key revoked successfully" };
    }),

  /** List all API keys for the merchant's store (without hashes) */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const user = ctx.user as any;
    const storeResult = await db.select().from(stores)
      .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
      .limit(1);

    if (storeResult.length === 0) return [];

    const keys = await db.select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      isActive: apiKeys.isActive,
      rateLimit: apiKeys.rateLimit,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    }).from(apiKeys)
      .where(eq(apiKeys.storeId, storeResult[0].id))
      .orderBy(desc(apiKeys.createdAt));

    return keys;
  }),
});

// ===== B2B DELIVERY ROUTER =====
export const b2bDeliveryRouter = router({
  /** Create a new B2B delivery request */
  request: protectedProcedure
    .input(z.object({
      externalOrderId: z.string().min(1).max(200),
      pickup: z.object({
        address: z.string().min(1),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        readyAt: z.string().optional(), // ISO timestamp
      }),
      delivery: z.object({
        address: z.string().min(1),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        notes: z.string().optional(),
      }),
      package: z.object({
        weight: z.number().min(1).max(50000).optional(), // grams
        dimensions: z.object({
          l: z.number().min(1).max(200),
          w: z.number().min(1).max(200),
          h: z.number().min(1).max(200),
        }).optional(),
        fragile: z.boolean().optional(),
        description: z.string().optional(),
      }).optional(),
      preferences: z.object({
        preferredMode: z.enum(["drone", "terrestrial", "any"]).optional(),
        urgency: z.enum(["standard", "express", "scheduled"]).optional(),
        scheduledAt: z.string().optional(), // ISO timestamp
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) throw new Error("No external store found");
      const store = storeResult[0];

      if (store.status !== "active") {
        throw new Error("Store must be active to create delivery requests");
      }

      const trackingCode = generateTrackingCode();

      // Calculate estimate for the quoted price
      const estimate = calculateEstimate({
        pickupAddress: input.pickup.address,
        deliveryAddress: input.delivery.address,
        packageWeight: input.package?.weight,
        preferredMode: input.preferences?.preferredMode,
        urgency: input.preferences?.urgency,
      });

      const result = await db.insert(b2bDeliveries).values({
        storeId: store.id,
        externalOrderId: input.externalOrderId,
        trackingCode,
        status: "pending",
        pickupAddress: input.pickup.address,
        pickupContactName: input.pickup.contactName || null,
        pickupContactPhone: input.pickup.contactPhone || null,
        pickupReadyAt: input.pickup.readyAt ? new Date(input.pickup.readyAt) : null,
        deliveryAddress: input.delivery.address,
        deliveryContactName: input.delivery.contactName || null,
        deliveryContactPhone: input.delivery.contactPhone || null,
        deliveryNotes: input.delivery.notes || null,
        packageWeight: input.package?.weight || null,
        packageDimensionsL: input.package?.dimensions?.l || null,
        packageDimensionsW: input.package?.dimensions?.w || null,
        packageDimensionsH: input.package?.dimensions?.h || null,
        packageFragile: input.package?.fragile || false,
        packageDescription: input.package?.description || null,
        preferredMode: (input.preferences?.preferredMode as any) || "any",
        urgency: (input.preferences?.urgency as any) || "standard",
        scheduledAt: input.preferences?.scheduledAt ? new Date(input.preferences.scheduledAt) : null,
        quotedPrice: String(estimate.estimatedPrice),
        currency: "RON",
      });

      // Create in-app notification for store owner about new delivery
      try {
        const { createInAppNotification } = await import("./create-notification");
        await createInAppNotification({
          userId: user.id,
          title: "\uD83D\uDCE6 Delivery Nou\u0103 Creat\u0103",
          body: `Comanda ${trackingCode} a fost \xeenregistrat\u0103. Pre\u021b estimat: ${estimate.estimatedPrice} RON. Mod: ${estimate.mode}.`,
          category: "orders",
          metadata: { deliveryId: result[0].insertId, trackingCode, mode: estimate.mode },
        });
      } catch (e) { /* silent */ }

      return {
        deliveryId: result[0].insertId,
        trackingCode,
        status: "pending",
        quotedPrice: estimate.estimatedPrice,
        currency: "RON",
        estimatedMinutes: estimate.estimatedMinutes,
        mode: estimate.mode,
        disclaimer: estimate.disclaimer,
      };
    }),

  /** Get delivery status by ID or tracking code */
  getStatus: protectedProcedure
    .input(z.object({
      deliveryId: z.number().optional(),
      trackingCode: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      if (!input.deliveryId && !input.trackingCode) {
        throw new Error("Provide either deliveryId or trackingCode");
      }

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) throw new Error("No external store found");

      let delivery;
      if (input.deliveryId) {
        const result = await db.select().from(b2bDeliveries)
          .where(and(eq(b2bDeliveries.id, input.deliveryId), eq(b2bDeliveries.storeId, storeResult[0].id)))
          .limit(1);
        delivery = result[0];
      } else if (input.trackingCode) {
        const result = await db.select().from(b2bDeliveries)
          .where(and(eq(b2bDeliveries.trackingCode, input.trackingCode), eq(b2bDeliveries.storeId, storeResult[0].id)))
          .limit(1);
        delivery = result[0];
      }

      if (!delivery) throw new Error("Delivery not found");

      return {
        id: delivery.id,
        externalOrderId: delivery.externalOrderId,
        trackingCode: delivery.trackingCode,
        status: delivery.status,
        pickupAddress: delivery.pickupAddress,
        deliveryAddress: delivery.deliveryAddress,
        deliveryMode: delivery.deliveryMode,
        estimatedArrival: delivery.estimatedArrival?.toISOString() || null,
        actualPickupAt: delivery.actualPickupAt?.toISOString() || null,
        actualDeliveryAt: delivery.actualDeliveryAt?.toISOString() || null,
        quotedPrice: delivery.quotedPrice,
        finalPrice: delivery.finalPrice,
        currency: delivery.currency,
        cancelledBy: delivery.cancelledBy,
        cancellationReason: delivery.cancellationReason,
        createdAt: delivery.createdAt.toISOString(),
        updatedAt: delivery.updatedAt.toISOString(),
      };
    }),

  /** Cancel a pending/assigned delivery */
  cancel: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      reason: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) throw new Error("No external store found");

      const delivery = await db.select().from(b2bDeliveries)
        .where(and(eq(b2bDeliveries.id, input.deliveryId), eq(b2bDeliveries.storeId, storeResult[0].id)))
        .limit(1);

      if (delivery.length === 0) throw new Error("Delivery not found");

      const cancellableStatuses = ["pending", "assigned", "pickup_enroute"];
      if (!cancellableStatuses.includes(delivery[0].status)) {
        throw new Error(`Cannot cancel delivery in status "${delivery[0].status}". Only pending, assigned, or pickup_enroute deliveries can be cancelled.`);
      }

      const previousStatus = delivery[0].status;

      await db.update(b2bDeliveries)
        .set({
          status: "cancelled",
          cancelledBy: "partner",
          cancellationReason: input.reason,
        })
        .where(eq(b2bDeliveries.id, input.deliveryId));

      // Trigger webhooks for cancellation
      const events = getWebhookEvents("cancelled");
      const payload = buildWebhookPayload(
        "delivery.cancelled",
        { id: input.deliveryId, externalOrderId: delivery[0].externalOrderId, trackingCode: delivery[0].trackingCode, status: "cancelled" },
        previousStatus,
        { cancelledBy: "partner", reason: input.reason }
      );
      for (const event of events) {
        triggerWebhooks(storeResult[0].id, input.deliveryId, event, { ...payload, event });
      }

      await notifyB2bDeliveryTransition({
        deliveryId: delivery[0].id,
        trackingCode: delivery[0].trackingCode,
        previousStatus,
        newStatus: "cancelled",
        storeOwnerId: storeResult[0].ownerId,
        assignedPilotId: delivery[0].assignedPilotId,
        actorUserId: storeResult[0].ownerId,
      });

      return { success: true, message: "Delivery cancelled successfully" };
    }),

  /** Get a non-contractual delivery estimate */
  estimate: protectedProcedure
    .input(z.object({
      pickupAddress: z.string().min(1),
      deliveryAddress: z.string().min(1),
      packageWeight: z.number().optional(),
      preferredMode: z.enum(["drone", "terrestrial", "any"]).optional(),
      urgency: z.enum(["standard", "express", "scheduled"]).optional(),
    }))
    .query(async ({ input }) => {
      const estimate = calculateEstimate({
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        packageWeight: input.packageWeight,
        preferredMode: input.preferredMode,
        urgency: input.urgency,
      });

      return {
        ...estimate,
        note: "Această estimare este informativă și non-contractuală. Prețul și timpul final pot diferi.",
      };
    }),

  /** List deliveries for the merchant's store */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "assigned", "pickup_enroute", "picked_up", "in_transit", "delivered", "cancelled", "failed"]).optional(),
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(100).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { deliveries: [], total: 0 };

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) return { deliveries: [], total: 0 };

      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      const conditions = [eq(b2bDeliveries.storeId, storeResult[0].id)];
      if (input?.status) {
        conditions.push(eq(b2bDeliveries.status, input.status));
      }

      const where = and(...conditions);
      const deliveries = await db.select().from(b2bDeliveries)
        .where(where)
        .orderBy(desc(b2bDeliveries.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(b2bDeliveries).where(where);

      return {
        deliveries: deliveries.map((d) => ({
          id: d.id,
          externalOrderId: d.externalOrderId,
          trackingCode: d.trackingCode,
          status: d.status,
          pickupAddress: d.pickupAddress,
          deliveryAddress: d.deliveryAddress,
          deliveryMode: d.deliveryMode,
          quotedPrice: d.quotedPrice,
          finalPrice: d.finalPrice,
          currency: d.currency,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
        total: countResult[0]?.count || 0,
      };
    }),

  /**
   * Pilot-facing status update — validates pilot identity and enforces forward-only transitions.
   * Triggers webhooks automatically on each status change.
   */
  pilotUpdateStatus: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      newStatus: z.enum(["assigned", "pickup_enroute", "picked_up", "in_transit", "delivered", "failed"]),
      estimatedArrival: z.string().optional(),
      failureReason: z.string().trim().max(1000).optional(),
      incidentType: z.enum(["stop", "fallback", "failure"]).optional(),
      completionProof: z.object({
        receptionMethod: z.enum(RECEPTION_METHODS),
        artifactUrl: z.string().trim().max(1000).optional(),
        artifactHash: z.string().trim().min(8).max(128).optional(),
        notes: z.string().trim().max(1000).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user as any;
      if (!user) throw new Error("Authentication required");
      if (user.dropiRole !== "delivery_partner") {
        throw new Error("Only delivery partners can update delivery mission status.");
      }

      // Sprint 6A Guard: Block unverified/inactive delivery partners before DB access.
      if (!user.isVerified) {
        throw new Error("Your account is not yet verified. Please submit your documents and wait for admin approval before accepting missions.");
      }
      if (!user.isActive) {
        throw new Error("Your account is inactive. Please contact support.");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const delivery = await db.select().from(b2bDeliveries)
        .where(eq(b2bDeliveries.id, input.deliveryId))
        .limit(1);

      if (delivery.length === 0) throw new Error("Delivery not found");

      // A delivery already assigned to a pilot can only be mutated by that pilot.
      if (delivery[0].assignedPilotId && delivery[0].assignedPilotId !== user.id) {
        throw new Error("This delivery is assigned to another pilot.");
      }

      // Custody evidence must be contiguous; pilots cannot skip operational stages.
      assertB2bTransition(delivery[0].status, input.newStatus, { allowFailure: true });

      const previousStatus = delivery[0].status;
      if (input.newStatus === "failed" && !input.failureReason?.trim()) {
        throw new Error("A factual failure reason is required for STOP, fallback, or failed delivery evidence.");
      }
      const incidentType = input.incidentType ?? "failure";
      if (input.newStatus === "delivered" && !input.completionProof) {
        throw new Error("Proof of delivery is required before a B2B mission can be delivered.");
      }
      const updateData: Record<string, any> = { status: input.newStatus };

      // Assign pilot on first acceptance
      if (input.newStatus === "assigned" && !delivery[0].assignedPilotId) {
        updateData.assignedPilotId = user.id;
        updateData.deliveryMode = delivery[0].preferredMode === "drone" ? "drone" : "terrestrial";
      }

      if (input.estimatedArrival) updateData.estimatedArrival = new Date(input.estimatedArrival);
      if (input.newStatus === "picked_up") updateData.actualPickupAt = new Date();
      if (input.newStatus === "delivered") updateData.actualDeliveryAt = new Date();
      if (input.newStatus === "failed" && input.failureReason) {
        updateData.cancellationReason = input.failureReason;
        updateData.cancelledBy = "pilot";
      }

      await db.transaction(async (tx) => {
        await tx.update(b2bDeliveries).set(updateData).where(eq(b2bDeliveries.id, input.deliveryId));
        if (input.newStatus === "assigned") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "assignment", custodyToUserId: user.id,
            details: { trackingCode: delivery[0].trackingCode, previousStatus },
          });
        }
        if (input.newStatus === "pickup_enroute") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "execution_started", custodyToUserId: user.id,
            details: { trackingCode: delivery[0].trackingCode, previousStatus },
          });
        }
        if (input.newStatus === "picked_up") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "pickup", custodyToUserId: user.id,
            details: { trackingCode: delivery[0].trackingCode, previousStatus },
          });
        }
        if (input.newStatus === "in_transit") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "transfer", custodyToUserId: user.id,
            details: { trackingCode: delivery[0].trackingCode, previousStatus },
          });
        }
        if (input.newStatus === "delivered" && input.completionProof) {
          const proof = await createDeliveryProofWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, recordedByUserId: user.id, recordedByRole: "delivery_partner", proof: input.completionProof });
          await appendOperationalEventWithDb(tx, {
            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "delivery_completed", custodyFromUserId: user.id,
            latitude: input.completionProof.latitude ?? null, longitude: input.completionProof.longitude ?? null,
            details: { trackingCode: delivery[0].trackingCode, proofId: proof.proofId, receptionMethod: input.completionProof.receptionMethod },
          });
        }
        if (input.newStatus === "failed") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2",
            targetType: "b2b",
            targetId: delivery[0].id,
            actorUserId: user.id,
            actorRole: "delivery_partner",
            eventType: incidentType === "stop" ? "stop" : incidentType === "fallback" ? "fallback" : "delivery_failed",
            custodyFromUserId: user.id,
            details: {
              trackingCode: delivery[0].trackingCode,
              reason: input.failureReason!.trim(),
              incidentType,
              resultingStatus: "failed",
            },
          });
        }
      });

      // Trigger rating hooks based on status
      if (input.newStatus === "delivered" && delivery[0].assignedPilotId) {
        onB2bDeliveryCompleted(delivery[0].id, delivery[0].assignedPilotId);
      } else if (input.newStatus === "failed" && delivery[0].assignedPilotId) {
        onB2bDeliveryFailed(delivery[0].id, delivery[0].assignedPilotId, input.failureReason);
      }

      // Trigger webhooks
      const events = getWebhookEvents(input.newStatus);
      const webhookPayload = buildWebhookPayload(
        events[0],
        {
          id: delivery[0].id,
          externalOrderId: delivery[0].externalOrderId,
          trackingCode: delivery[0].trackingCode,
          status: input.newStatus,
        },
        previousStatus,
        {
          estimatedArrival: input.estimatedArrival || delivery[0].estimatedArrival?.toISOString(),
          pilotId: user.id,
          deliveryMode: updateData.deliveryMode || delivery[0].deliveryMode,
        }
      );

      for (const event of events) {
        triggerWebhooks(delivery[0].storeId, delivery[0].id, event, { ...webhookPayload, event });
      }

      // Notify store owner
      const storeResult = await db.select().from(stores)
        .where(eq(stores.id, delivery[0].storeId))
        .limit(1);

      if (storeResult.length > 0) {
        notifyOwner({
          title: "B2B Delivery Update",
          content: `Delivery ${delivery[0].trackingCode}: ${previousStatus} \u2192 ${input.newStatus} (Store: ${storeResult[0].name})`,
        });

        // Create in-app notification for store owner
        try {
          const { createInAppNotification } = await import("./create-notification");
          await createInAppNotification({
            userId: storeResult[0].ownerId,
            title: `\uD83D\uDE9A Delivery: ${input.newStatus.replace(/_/g, " ")}`,
            body: `Comanda ${delivery[0].trackingCode} a trecut de la ${previousStatus.replace(/_/g, " ")} la ${input.newStatus.replace(/_/g, " ")}.`,
            category: "missions",
            metadata: { deliveryId: delivery[0].id, trackingCode: delivery[0].trackingCode, status: input.newStatus },
          });
        } catch (e) { /* silent */ }

        await notifyB2bDeliveryTransition({
          deliveryId: delivery[0].id,
          trackingCode: delivery[0].trackingCode,
          previousStatus,
          newStatus: input.newStatus,
          storeOwnerId: storeResult[0].ownerId,
          assignedPilotId: (updateData.assignedPilotId as number | undefined) ?? delivery[0].assignedPilotId ?? user.id,
          actorUserId: user.id,
        });
      }

      return {
        success: true,
        message: `Status updated: ${previousStatus} → ${input.newStatus}`,
        webhooksTriggered: events.length,
      };
    }),

  /**
   * Update delivery status (admin/system/pilot use).
   * Triggers webhooks for all subscribed endpoints.
   */
  updateStatus: adminProcedure
    .input(z.object({
      deliveryId: z.number(),
      newStatus: z.enum(["pending", "assigned", "pickup_enroute", "picked_up", "in_transit", "delivered", "cancelled", "failed"]),
      pilotId: z.number().optional(),
      estimatedArrival: z.string().optional(),
      finalPrice: z.string().optional(),
      cancellationReason: z.string().optional(),
      cancelledBy: z.enum(["system", "pilot"]).optional(),
      incidentType: z.enum(["stop", "fallback", "failure"]).optional(),
      completionProof: z.object({
        receptionMethod: z.enum(RECEPTION_METHODS),
        artifactUrl: z.string().trim().max(1000).optional(),
        artifactHash: z.string().trim().min(8).max(128).optional(),
        notes: z.string().trim().max(1000).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const delivery = await db.select().from(b2bDeliveries)
        .where(eq(b2bDeliveries.id, input.deliveryId))
        .limit(1);

      if (delivery.length === 0) throw new Error("Delivery not found");

      const previousStatus = delivery[0].status;
      if (previousStatus === input.newStatus) {
        return { success: true, message: "Status unchanged" };
      }
      assertB2bTransition(previousStatus, input.newStatus, { allowFailure: true, allowCancellation: true });
      if ((input.newStatus === "failed" || input.newStatus === "cancelled") && !input.cancellationReason?.trim()) {
        throw new Error("A factual reason is required for failed or cancelled operational evidence.");
      }
      const incidentType = input.incidentType ?? "failure";
      if (input.newStatus === "delivered" && !input.completionProof) {
        throw new Error("Proof of delivery is required before a B2B mission can be delivered.");
      }

      // Build update payload
      const updateData: Record<string, any> = { status: input.newStatus };

      if (input.pilotId) updateData.assignedPilotId = input.pilotId;
      if (input.estimatedArrival) updateData.estimatedArrival = new Date(input.estimatedArrival);
      if (input.finalPrice) updateData.finalPrice = input.finalPrice;
      if (input.cancellationReason) updateData.cancellationReason = input.cancellationReason;
      if (input.cancelledBy) updateData.cancelledBy = input.cancelledBy;

      // Set timestamps based on status
      if (input.newStatus === "picked_up") updateData.actualPickupAt = new Date();
      if (input.newStatus === "delivered") updateData.actualDeliveryAt = new Date();
      if (input.newStatus === "assigned" && input.pilotId) {
        updateData.deliveryMode = delivery[0].preferredMode === "drone" ? "drone" : "terrestrial";
      }

      await db.transaction(async (tx) => {
        await tx.update(b2bDeliveries).set(updateData).where(eq(b2bDeliveries.id, input.deliveryId));
        const actorId = ctx.user!.id;
        const actorRole = ctx.user!.dropiRole || "system_administrator";
        if (input.newStatus === "assigned") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "assignment", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });
        }
        if (input.newStatus === "pickup_enroute") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "execution_started", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });
        }
        if (input.newStatus === "picked_up") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "pickup", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });
        }
        if (input.newStatus === "in_transit") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "transfer", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });
        }
        if (input.newStatus === "delivered" && input.completionProof) {
          const proof = await createDeliveryProofWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, recordedByUserId: actorId, recordedByRole: actorRole, proof: input.completionProof });
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "delivery_completed", custodyFromUserId: pilotId, latitude: input.completionProof.latitude ?? null, longitude: input.completionProof.longitude ?? null, details: { trackingCode: delivery[0].trackingCode, proofId: proof.proofId, receptionMethod: input.completionProof.receptionMethod } });
        }
        if (input.newStatus === "failed" || input.newStatus === "cancelled") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2",
            targetType: "b2b",
            targetId: delivery[0].id,
            actorUserId: actorId,
            actorRole,
            eventType: incidentType === "stop" ? "stop" : incidentType === "fallback" ? "fallback" : "delivery_failed",
            custodyFromUserId: pilotId,
            details: {
              trackingCode: delivery[0].trackingCode,
              terminalStatus: input.newStatus,
              reason: input.cancellationReason!.trim(),
              incidentType,
              resultingStatus: input.newStatus,
            },
          });
        }
      });

      // Trigger rating hooks based on status
      const pilotId = input.pilotId || delivery[0].assignedPilotId;
      if (input.newStatus === "delivered" && pilotId) {
        onB2bDeliveryCompleted(delivery[0].id, pilotId);
      } else if (input.newStatus === "failed" && pilotId) {
        onB2bDeliveryFailed(delivery[0].id, pilotId, input.cancellationReason);
      }

      // Trigger webhooks
      const events = getWebhookEvents(input.newStatus);
      const webhookPayload = buildWebhookPayload(
        events[0], // Primary event
        {
          id: delivery[0].id,
          externalOrderId: delivery[0].externalOrderId,
          trackingCode: delivery[0].trackingCode,
          status: input.newStatus,
        },
        previousStatus,
        {
          estimatedArrival: input.estimatedArrival || delivery[0].estimatedArrival?.toISOString(),
          pilotId: input.pilotId || delivery[0].assignedPilotId,
          deliveryMode: updateData.deliveryMode || delivery[0].deliveryMode,
        }
      );

      for (const event of events) {
        triggerWebhooks(delivery[0].storeId, delivery[0].id, event, { ...webhookPayload, event });
      }

      const transitionStore = await db.select().from(stores)
        .where(eq(stores.id, delivery[0].storeId))
        .limit(1);
      if (transitionStore.length > 0) {
        await notifyB2bDeliveryTransition({
          deliveryId: delivery[0].id,
          trackingCode: delivery[0].trackingCode,
          previousStatus,
          newStatus: input.newStatus,
          storeOwnerId: transitionStore[0].ownerId,
          assignedPilotId: pilotId,
          actorUserId: ctx.user?.id ?? null,
        });
      }

      return {
        success: true,
        message: `Delivery status updated: ${previousStatus} → ${input.newStatus}`,
        webhooksTriggered: events.length,
      };
    }),

  /**
   * Admin/Dispatch list — returns all B2B deliveries across all stores.
   * Used by C2 Operations Manager and C3 Emergency Coordinator dispatch panels.
   */
  adminList: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "assigned", "pickup_enroute", "picked_up", "in_transit", "delivered", "cancelled", "failed"]).optional(),
      priority: z.enum(["normal", "urgent", "emergency"]).optional(),
      limit: z.number().min(1).max(100).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { deliveries: [], total: 0 };

      const limit = input?.limit || 50;
      const conditions: any[] = [];
      if (input?.status) {
        conditions.push(eq(b2bDeliveries.status, input.status));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const deliveries = await db.select().from(b2bDeliveries)
        .where(where)
        .orderBy(desc(b2bDeliveries.createdAt))
        .limit(limit);

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(b2bDeliveries).where(where);

      return {
        deliveries: deliveries.map((d) => ({
          id: d.id,
          storeId: d.storeId,
          externalOrderId: d.externalOrderId,
          trackingCode: d.trackingCode,
          status: d.status,
          pickupAddress: d.pickupAddress,
          deliveryAddress: d.deliveryAddress,
          deliveryMode: d.deliveryMode,
          quotedPrice: d.quotedPrice,
          assignedPilotId: d.assignedPilotId,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
        total: countResult[0]?.count || 0,
      };
    }),

  /**
   * Admin assign pilot to a B2B delivery (dispatch action).
   */
  assignPilot: adminProcedure
    .input(z.object({
      deliveryId: z.number(),
      pilotId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const delivery = await db.select().from(b2bDeliveries)
        .where(eq(b2bDeliveries.id, input.deliveryId))
        .limit(1);

      if (delivery.length === 0) throw new Error("Delivery not found");
      if (delivery[0].status !== "pending") throw new Error("Can only assign pilots to pending deliveries");

      await db.transaction(async (tx) => {
        await tx.update(b2bDeliveries)
          .set({
            status: "assigned",
            assignedPilotId: input.pilotId,
            updatedAt: new Date(),
          })
          .where(eq(b2bDeliveries.id, input.deliveryId));
        await appendOperationalEventWithDb(tx, {
          channel: "C2",
          targetType: "b2b",
          targetId: delivery[0].id,
          actorUserId: ctx.user!.id,
          actorRole: ctx.user!.dropiRole || "system_administrator",
          eventType: "assignment",
          custodyToUserId: input.pilotId,
          details: { trackingCode: delivery[0].trackingCode, assignedPilotId: input.pilotId },
        });
      });

      // Trigger webhooks
      triggerWebhooks(delivery[0].storeId, delivery[0].id, "delivery.status_changed", {
        deliveryId: delivery[0].id,
        externalOrderId: delivery[0].externalOrderId,
        trackingCode: delivery[0].trackingCode,
        previousStatus: "pending",
        newStatus: "assigned",
        timestamp: new Date().toISOString(),
        event: "delivery.status_changed",
        details: { assignedPilotId: input.pilotId },
      });

      return { success: true, message: `Pilot ${input.pilotId} assigned to delivery ${input.deliveryId}` };
    }),

  /**
   * Admin escalate delivery to emergency priority (C3).
   */
  escalate: adminProcedure
    .input(z.object({
      deliveryId: z.number(),
      reason: z.string().min(5).max(500),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const delivery = await db.select().from(b2bDeliveries)
        .where(eq(b2bDeliveries.id, input.deliveryId))
        .limit(1);

      if (delivery.length === 0) throw new Error("Delivery not found");

      await db.update(b2bDeliveries)
        .set({
          deliveryNotes: `[ESCALATED] ${input.reason} (at ${new Date().toISOString()})`,
          urgency: "express",
          updatedAt: new Date(),
        })
        .where(eq(b2bDeliveries.id, input.deliveryId));

      return { success: true, message: `Delivery ${input.deliveryId} escalated to emergency priority` };
    }),
});

// ===== WEBHOOK ROUTER =====
export const webhookRouter = router({
  /** Register a new webhook endpoint */
  register: protectedProcedure
    .input(z.object({
      url: z.string().url().max(500),
      events: z.array(z.enum([
        "delivery.status_changed",
        "delivery.completed",
        "delivery.cancelled",
        "delivery.failed",
        "delivery.picked_up",
      ])).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) throw new Error("No external store found");

      // Max 10 webhook endpoints per store
      const existingCount = await db.select({ count: sql<number>`count(*)` })
        .from(webhookEndpoints)
        .where(and(eq(webhookEndpoints.storeId, storeResult[0].id), eq(webhookEndpoints.isActive, true)));

      if ((existingCount[0]?.count || 0) >= 10) {
        throw new Error("Maximum 10 active webhook endpoints per store.");
      }

      const secret = generateWebhookSecret();

      const result = await db.insert(webhookEndpoints).values({
        storeId: storeResult[0].id,
        url: input.url,
        events: JSON.stringify(input.events),
        secret,
      });

      return {
        id: result[0].insertId,
        url: input.url,
        events: input.events,
        secret, // Only returned once at creation
        warning: "Save this webhook secret securely. It is used to verify webhook signatures (HMAC-SHA256).",
      };
    }),

  /** Send a test webhook payload to an endpoint */
  test: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) throw new Error("No external store found");

      const endpoint = await db.select().from(webhookEndpoints)
        .where(and(eq(webhookEndpoints.id, input.webhookId), eq(webhookEndpoints.storeId, storeResult[0].id)))
        .limit(1);

      if (endpoint.length === 0) throw new Error("Webhook endpoint not found");
      if (!endpoint[0].isActive) throw new Error("Webhook endpoint is inactive");

      // Build test payload
      const testPayload = {
        event: "test",
        deliveryId: "test-delivery-id",
        externalOrderId: "TEST-ORDER-001",
        newStatus: "pending",
        timestamp: new Date().toISOString(),
        details: {
          message: "This is a test webhook from DROPi. If you received this, your endpoint is configured correctly.",
        },
      };

      const payloadStr = JSON.stringify(testPayload);
      const signature = crypto
        .createHmac("sha256", endpoint[0].secret)
        .update(payloadStr)
        .digest("hex");

      // Attempt to send the webhook
      let success = false;
      let responseStatus: number | null = null;
      let responseBody: string | null = null;

      try {
        const response = await fetch(endpoint[0].url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-DROPi-Signature": signature,
            "X-DROPi-Event": "test",
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        responseStatus = response.status;
        responseBody = await response.text().catch(() => null);
        success = response.ok;
      } catch (err: any) {
        responseBody = err.message || "Connection failed";
      }

      // Log the attempt
      await db.insert(webhookLogs).values({
        webhookEndpointId: endpoint[0].id,
        event: "test",
        payload: payloadStr,
        responseStatus,
        responseBody,
        success,
        attemptNumber: 1,
        respondedAt: new Date(),
      });

      // Update endpoint stats
      if (success) {
        await db.update(webhookEndpoints)
          .set({ lastTriggeredAt: new Date(), lastSuccessAt: new Date(), failureCount: 0 })
          .where(eq(webhookEndpoints.id, endpoint[0].id));
      } else {
        await db.update(webhookEndpoints)
          .set({
            lastTriggeredAt: new Date(),
            failureCount: sql`${webhookEndpoints.failureCount} + 1`,
            lastFailureReason: responseBody || "Unknown error",
          })
          .where(eq(webhookEndpoints.id, endpoint[0].id));
      }

      return {
        success,
        responseStatus,
        responseBody: responseBody?.substring(0, 500) || null,
        message: success
          ? "Test webhook delivered successfully!"
          : `Webhook delivery failed: ${responseBody?.substring(0, 200) || "No response"}`,
      };
    }),

  /** List webhook endpoints for the merchant's store */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const user = ctx.user as any;
    const storeResult = await db.select().from(stores)
      .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
      .limit(1);

    if (storeResult.length === 0) return [];

    const endpoints = await db.select({
      id: webhookEndpoints.id,
      url: webhookEndpoints.url,
      events: webhookEndpoints.events,
      isActive: webhookEndpoints.isActive,
      failureCount: webhookEndpoints.failureCount,
      lastTriggeredAt: webhookEndpoints.lastTriggeredAt,
      lastSuccessAt: webhookEndpoints.lastSuccessAt,
      lastFailureReason: webhookEndpoints.lastFailureReason,
      createdAt: webhookEndpoints.createdAt,
    }).from(webhookEndpoints)
      .where(eq(webhookEndpoints.storeId, storeResult[0].id))
      .orderBy(desc(webhookEndpoints.createdAt));

    return endpoints.map((e) => ({
      ...e,
      events: JSON.parse(e.events as string) as string[],
    }));
  }),

  /** Delete (deactivate) a webhook endpoint */
  delete: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) throw new Error("No external store found");

      const endpoint = await db.select().from(webhookEndpoints)
        .where(and(eq(webhookEndpoints.id, input.webhookId), eq(webhookEndpoints.storeId, storeResult[0].id)))
        .limit(1);

      if (endpoint.length === 0) throw new Error("Webhook endpoint not found");

      await db.update(webhookEndpoints)
        .set({ isActive: false })
        .where(eq(webhookEndpoints.id, input.webhookId));

      return { success: true, message: "Webhook endpoint removed" };
    }),

  /** Retry a failed webhook delivery */
  retry: protectedProcedure
    .input(z.object({ logId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) throw new Error("No external store found");

      // Get the log entry
      const logEntry = await db.select().from(webhookLogs)
        .where(eq(webhookLogs.id, input.logId))
        .limit(1);

      if (logEntry.length === 0) throw new Error("Webhook log not found");
      if (logEntry[0].success) throw new Error("This webhook was already delivered successfully");

      // Verify the endpoint belongs to this store
      const endpoint = await db.select().from(webhookEndpoints)
        .where(and(eq(webhookEndpoints.id, logEntry[0].webhookEndpointId), eq(webhookEndpoints.storeId, storeResult[0].id)))
        .limit(1);

      if (endpoint.length === 0) throw new Error("Webhook endpoint not found");
      if (!endpoint[0].isActive) throw new Error("Webhook endpoint is inactive. Reactivate it first.");

      // Re-send the webhook
      const payloadStr = logEntry[0].payload;
      const signature = crypto
        .createHmac("sha256", endpoint[0].secret)
        .update(payloadStr)
        .digest("hex");

      let success = false;
      let responseStatus: number | null = null;
      let responseBody: string | null = null;

      try {
        const response = await fetch(endpoint[0].url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-DROPi-Signature": signature,
            "X-DROPi-Event": logEntry[0].event,
            "X-DROPi-Retry": "manual",
            "User-Agent": "DROPi-Webhook/1.0",
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000),
        });

        responseStatus = response.status;
        responseBody = await response.text().catch(() => null);
        success = response.ok;
      } catch (err: any) {
        responseBody = err.message || "Connection failed";
      }

      // Log the retry attempt
      await db.insert(webhookLogs).values({
        webhookEndpointId: endpoint[0].id,
        deliveryId: logEntry[0].deliveryId,
        event: logEntry[0].event,
        payload: payloadStr,
        responseStatus,
        responseBody: responseBody?.substring(0, 2000) || null,
        success,
        attemptNumber: logEntry[0].attemptNumber + 1,
        respondedAt: new Date(),
      });

      // Update endpoint stats
      if (success) {
        await db.update(webhookEndpoints)
          .set({ lastSuccessAt: new Date(), failureCount: 0 })
          .where(eq(webhookEndpoints.id, endpoint[0].id));
      }

      return {
        success,
        responseStatus,
        message: success ? "Webhook retry delivered successfully!" : `Retry failed: ${responseBody?.substring(0, 200) || "No response"}`,
      };
    }),

  /** Get webhook delivery logs for debugging */
  logs: protectedProcedure
    .input(z.object({
      webhookId: z.number().optional(),
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(50).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { logs: [], total: 0 };

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) return { logs: [], total: 0 };

      // Get all webhook endpoint IDs for this store
      const storeEndpoints = await db.select({ id: webhookEndpoints.id })
        .from(webhookEndpoints)
        .where(eq(webhookEndpoints.storeId, storeResult[0].id));

      if (storeEndpoints.length === 0) return { logs: [], total: 0 };

      const endpointIds = storeEndpoints.map((e) => e.id);

      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      // Filter by specific webhook if provided
      const conditions = input?.webhookId
        ? [eq(webhookLogs.webhookEndpointId, input.webhookId)]
        : [sql`${webhookLogs.webhookEndpointId} IN (${sql.raw(endpointIds.join(","))})`];

      const where = and(...conditions);
      const logs = await db.select().from(webhookLogs)
        .where(where)
        .orderBy(desc(webhookLogs.sentAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(webhookLogs).where(where);

      return {
        logs: logs.map((l) => ({
          id: l.id,
          webhookEndpointId: l.webhookEndpointId,
          event: l.event,
          responseStatus: l.responseStatus,
          success: l.success,
          attemptNumber: l.attemptNumber,
          sentAt: l.sentAt.toISOString(),
          respondedAt: l.respondedAt?.toISOString() || null,
        })),
        total: countResult[0]?.count || 0,
      };
    }),
});

// ===== API ANALYTICS ROUTER =====
export const apiAnalyticsRouter = router({
  /** Get API usage summary for the merchant's store */
  summary: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional(), // Default 30 days
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) return null;

      const days = input?.days || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Total requests
      const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(apiRequestLogs)
        .where(and(
          eq(apiRequestLogs.storeId, storeResult[0].id),
          sql`${apiRequestLogs.createdAt} >= ${since}`
        ));

      // Successful requests (2xx)
      const successResult = await db.select({ count: sql<number>`count(*)` })
        .from(apiRequestLogs)
        .where(and(
          eq(apiRequestLogs.storeId, storeResult[0].id),
          sql`${apiRequestLogs.createdAt} >= ${since}`,
          sql`${apiRequestLogs.statusCode} >= 200 AND ${apiRequestLogs.statusCode} < 300`
        ));

      // Error requests (4xx + 5xx)
      const errorResult = await db.select({ count: sql<number>`count(*)` })
        .from(apiRequestLogs)
        .where(and(
          eq(apiRequestLogs.storeId, storeResult[0].id),
          sql`${apiRequestLogs.createdAt} >= ${since}`,
          sql`${apiRequestLogs.statusCode} >= 400`
        ));

      // Average response time
      const avgTimeResult = await db.select({ avg: sql<number>`AVG(${apiRequestLogs.responseTimeMs})` })
        .from(apiRequestLogs)
        .where(and(
          eq(apiRequestLogs.storeId, storeResult[0].id),
          sql`${apiRequestLogs.createdAt} >= ${since}`
        ));

      // Requests per day (last 7 days)
      const dailyResult = await db.select({
        day: sql<string>`DATE(${apiRequestLogs.createdAt})`,
        count: sql<number>`count(*)`,
      })
        .from(apiRequestLogs)
        .where(and(
          eq(apiRequestLogs.storeId, storeResult[0].id),
          sql`${apiRequestLogs.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}`
        ))
        .groupBy(sql`DATE(${apiRequestLogs.createdAt})`)
        .orderBy(sql`DATE(${apiRequestLogs.createdAt})`);

      // Top endpoints
      const topEndpoints = await db.select({
        endpoint: apiRequestLogs.endpoint,
        count: sql<number>`count(*)`,
        avgTime: sql<number>`AVG(${apiRequestLogs.responseTimeMs})`,
      })
        .from(apiRequestLogs)
        .where(and(
          eq(apiRequestLogs.storeId, storeResult[0].id),
          sql`${apiRequestLogs.createdAt} >= ${since}`
        ))
        .groupBy(apiRequestLogs.endpoint)
        .orderBy(desc(sql`count(*)`));

      const total = totalResult[0]?.count || 0;
      const successCount = successResult[0]?.count || 0;
      const errorCount = errorResult[0]?.count || 0;

      return {
        period: { days, since: since.toISOString() },
        totals: {
          requests: total,
          successful: successCount,
          errors: errorCount,
          errorRate: total > 0 ? Math.round((errorCount / total) * 10000) / 100 : 0, // percentage
        },
        performance: {
          avgResponseTimeMs: Math.round(avgTimeResult[0]?.avg || 0),
        },
        daily: dailyResult.map((d) => ({ date: d.day, requests: d.count })),
        topEndpoints: topEndpoints.map((e) => ({
          endpoint: e.endpoint,
          requests: e.count,
          avgResponseTimeMs: Math.round(e.avgTime || 0),
        })),
      };
    }),

  /** Get recent API request logs */
  recentLogs: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(50).optional(),
      statusFilter: z.enum(["all", "success", "error"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { logs: [], total: 0 };

      const user = ctx.user as any;
      const storeResult = await db.select().from(stores)
        .where(and(eq(stores.ownerId, user.id), eq(stores.type, "external")))
        .limit(1);

      if (storeResult.length === 0) return { logs: [], total: 0 };

      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      const conditions: any[] = [eq(apiRequestLogs.storeId, storeResult[0].id)];
      if (input?.statusFilter === "success") {
        conditions.push(sql`${apiRequestLogs.statusCode} >= 200 AND ${apiRequestLogs.statusCode} < 300`);
      } else if (input?.statusFilter === "error") {
        conditions.push(sql`${apiRequestLogs.statusCode} >= 400`);
      }

      const where = and(...conditions);
      const logs = await db.select().from(apiRequestLogs)
        .where(where)
        .orderBy(desc(apiRequestLogs.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(apiRequestLogs).where(where);

      return {
        logs: logs.map((l) => ({
          id: l.id,
          method: l.method,
          endpoint: l.endpoint,
          statusCode: l.statusCode,
          responseTimeMs: l.responseTimeMs,
          errorCode: l.errorCode,
          createdAt: l.createdAt.toISOString(),
        })),
        total: countResult[0]?.count || 0,
      };
    }),
});
