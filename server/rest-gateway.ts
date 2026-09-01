/**
 * DROPi REST API Gateway — /api/v1/
 *
 * Sprint E Upgrade: Provides a standard REST interface for external B2B partners
 * who cannot use tRPC directly. Wraps the tRPC B2B endpoints with:
 * - API Key authentication via X-DROPi-API-Key header
 * - Rate limiting per API key
 * - Standardized JSON error responses
 * - Request/response logging for auditing
 *
 * Endpoints:
 *   POST   /api/v1/delivery/request     — Create a new delivery
 *   GET    /api/v1/delivery/:id         — Get delivery status by ID
 *   GET    /api/v1/delivery/track/:code — Get delivery by tracking code
 *   POST   /api/v1/delivery/:id/cancel  — Cancel a delivery
 *   GET    /api/v1/delivery/estimate    — Get delivery estimate
 *   GET    /api/v1/deliveries           — List deliveries
 *   GET    /api/v1/health               — API health check
 */

import { Router, Request, Response, NextFunction } from "express";
import { getDb } from "./db";
import { apiKeys, stores, b2bDeliveries, webhookEndpoints, apiRequestLogs } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { triggerWebhooks, buildWebhookPayload, getWebhookEvents } from "./webhook-trigger";
import { notifyB2bDeliveryTransition } from "./b2b-transition-notifications";

// ===== TYPES =====

interface AuthenticatedRequest extends Request {
  apiKey?: typeof apiKeys.$inferSelect;
  store?: typeof stores.$inferSelect;
}

// ===== RATE LIMITER (in-memory, per-key) =====

const rateLimitStore = new Map<number, { count: number; resetAt: number }>();

function checkRateLimit(keyId: number, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(keyId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(keyId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 300_000);

// ===== MIDDLEWARE: API Key Authentication =====

async function authenticateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = req.headers["x-dropi-api-key"] as string;

  if (!apiKeyHeader) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Missing X-DROPi-API-Key header. Include your API key in the request.",
      docs: "https://docs.dropi.app/api/authentication",
    });
    return;
  }

  if (!apiKeyHeader.startsWith("dropi_")) {
    res.status(401).json({
      error: "INVALID_KEY_FORMAT",
      message: "Invalid API key format. Keys must start with 'dropi_'.",
    });
    return;
  }

  const db = await getDb();
  if (!db) {
    res.status(503).json({ error: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
    return;
  }

  // Hash the provided key and look it up
  const keyHash = crypto.createHash("sha256").update(apiKeyHeader).digest("hex");

  const keyResult = await db.select().from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);

  if (keyResult.length === 0) {
    res.status(401).json({
      error: "INVALID_KEY",
      message: "API key is invalid or has been revoked.",
    });
    return;
  }

  const key = keyResult[0];

  // Check expiration
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
    res.status(401).json({
      error: "KEY_EXPIRED",
      message: "API key has expired. Generate a new key from the DROPi dashboard.",
    });
    return;
  }

  // Rate limiting
  if (!checkRateLimit(key.id, key.rateLimit)) {
    res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      message: `Rate limit exceeded. Maximum ${key.rateLimit} requests per minute.`,
      retryAfter: 60,
    });
    return;
  }

  // Get associated store
  const storeResult = await db.select().from(stores)
    .where(eq(stores.id, key.storeId))
    .limit(1);

  if (storeResult.length === 0 || storeResult[0].status !== "active") {
    res.status(403).json({
      error: "STORE_INACTIVE",
      message: "Associated store is not active. Contact DROPi support.",
    });
    return;
  }

  // Update lastUsedAt
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id));

  // Attach to request
  req.apiKey = key;
  req.store = storeResult[0];

  next();
}

// ===== HELPER: Generate tracking code =====

function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `DRP-${timestamp}-${random}`;
}

// ===== HELPER: Calculate estimate =====

function calculateEstimate(input: {
  pickupAddress: string;
  deliveryAddress: string;
  packageWeight?: number;
  preferredMode?: string;
  urgency?: string;
}) {
  const baseMinutes = input.urgency === "express" ? 30 : input.urgency === "scheduled" ? 120 : 60;
  const basePrice = input.urgency === "express" ? 25.0 : input.urgency === "scheduled" ? 12.0 : 15.0;
  const weightKg = (input.packageWeight || 1000) / 1000;
  const weightSurcharge = weightKg > 2 ? (weightKg - 2) * 2.5 : 0;

  let mode = "terrestrial";
  if (input.preferredMode === "drone" && weightKg <= 2) mode = "drone";
  else if (input.preferredMode === "any" && weightKg <= 2) mode = "drone";

  return {
    estimatedMinutes: baseMinutes,
    estimatedPrice: Math.round((basePrice + weightSurcharge) * 100) / 100,
    currency: "RON",
    mode,
    disclaimer: "Estimare informativă, non-contractuală. Timpul și prețul final pot varia în funcție de condițiile reale de trafic și disponibilitatea piloților.",
  };
}

// ===== HELPER: Standardized error response =====

function errorResponse(res: Response, status: number, code: string, message: string, details?: any): void {
  res.status(status).json({
    error: code,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  });
}

// ===== ROUTER =====

export function createRestGateway(): Router {
  const gateway = Router();

  // Health check (no auth required)
  gateway.get("/health", (_req, res) => {
    res.json({
      status: "operational",
      version: "1.0.0",
      service: "DROPi Logistic API",
      timestamp: new Date().toISOString(),
    });
  });

  // Apply API key auth to all other routes
  gateway.use(authenticateApiKey);

  // Request logging middleware (runs after auth, logs every API call)
  gateway.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      const responseTimeMs = Date.now() - startTime;
      const responseBodySize = JSON.stringify(body || {}).length;

      // Log asynchronously (non-blocking)
      if (req.apiKey && req.store) {
        getDb().then((db) => {
          if (!db) return;
          db.insert(apiRequestLogs).values({
            apiKeyId: req.apiKey!.id,
            storeId: req.store!.id,
            method: req.method,
            endpoint: req.originalUrl || req.path,
            statusCode: res.statusCode,
            responseTimeMs,
            requestBodySize: JSON.stringify(req.body || {}).length,
            responseBodySize,
            ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || null,
            userAgent: (req.headers["user-agent"] as string)?.substring(0, 500) || null,
            errorCode: res.statusCode >= 400 ? (body?.error || null) : null,
          }).catch((err) => console.error("[API Log] Failed to log request:", err.message));
        });
      }

      return originalJson(body);
    };

    next();
  });

  // ===== POST /delivery/request — Create a new delivery =====
  gateway.post("/delivery/request", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return errorResponse(res, 503, "SERVICE_UNAVAILABLE", "Database unavailable");

      const { pickup, delivery, package: pkg, preferences } = req.body;

      // Validate required fields
      if (!pickup?.address) return errorResponse(res, 400, "VALIDATION_ERROR", "pickup.address is required");
      if (!delivery?.address) return errorResponse(res, 400, "VALIDATION_ERROR", "delivery.address is required");
      if (!req.body.externalOrderId) return errorResponse(res, 400, "VALIDATION_ERROR", "externalOrderId is required");

      const store = req.store!;
      const trackingCode = generateTrackingCode();

      const estimate = calculateEstimate({
        pickupAddress: pickup.address,
        deliveryAddress: delivery.address,
        packageWeight: pkg?.weight,
        preferredMode: preferences?.preferredMode,
        urgency: preferences?.urgency,
      });

      const result = await db.insert(b2bDeliveries).values({
        storeId: store.id,
        externalOrderId: req.body.externalOrderId,
        trackingCode,
        status: "pending",
        pickupAddress: pickup.address,
        pickupContactName: pickup.contactName || null,
        pickupContactPhone: pickup.contactPhone || null,
        pickupReadyAt: pickup.readyAt ? new Date(pickup.readyAt) : null,
        deliveryAddress: delivery.address,
        deliveryContactName: delivery.contactName || null,
        deliveryContactPhone: delivery.contactPhone || null,
        deliveryNotes: delivery.notes || null,
        packageWeight: pkg?.weight || null,
        packageDimensionsL: pkg?.dimensions?.l || null,
        packageDimensionsW: pkg?.dimensions?.w || null,
        packageDimensionsH: pkg?.dimensions?.h || null,
        packageFragile: pkg?.fragile || false,
        packageDescription: pkg?.description || null,
        preferredMode: preferences?.preferredMode || "any",
        urgency: preferences?.urgency || "standard",
        scheduledAt: preferences?.scheduledAt ? new Date(preferences.scheduledAt) : null,
        quotedPrice: String(estimate.estimatedPrice),
        currency: "RON",
      });

      res.status(201).json({
        success: true,
        data: {
          deliveryId: result[0].insertId,
          trackingCode,
          status: "pending",
          quotedPrice: estimate.estimatedPrice,
          currency: "RON",
          estimatedMinutes: estimate.estimatedMinutes,
          mode: estimate.mode,
          disclaimer: estimate.disclaimer,
        },
      });
    } catch (err: any) {
      errorResponse(res, 500, "INTERNAL_ERROR", err.message || "An unexpected error occurred");
    }
  });

  // ===== GET /delivery/:id — Get delivery status by ID =====
  gateway.get("/delivery/track/:code", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return errorResponse(res, 503, "SERVICE_UNAVAILABLE", "Database unavailable");

      const store = req.store!;
      const result = await db.select().from(b2bDeliveries)
        .where(and(eq(b2bDeliveries.trackingCode, req.params.code), eq(b2bDeliveries.storeId, store.id)))
        .limit(1);

      if (result.length === 0) return errorResponse(res, 404, "NOT_FOUND", "Delivery not found");

      const d = result[0];
      res.json({
        success: true,
        data: formatDeliveryResponse(d),
      });
    } catch (err: any) {
      errorResponse(res, 500, "INTERNAL_ERROR", err.message || "An unexpected error occurred");
    }
  });

  gateway.get("/delivery/:id", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return errorResponse(res, 503, "SERVICE_UNAVAILABLE", "Database unavailable");

      const deliveryId = parseInt(req.params.id);
      if (isNaN(deliveryId)) return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid delivery ID");

      const store = req.store!;
      const result = await db.select().from(b2bDeliveries)
        .where(and(eq(b2bDeliveries.id, deliveryId), eq(b2bDeliveries.storeId, store.id)))
        .limit(1);

      if (result.length === 0) return errorResponse(res, 404, "NOT_FOUND", "Delivery not found");

      const d = result[0];
      res.json({
        success: true,
        data: formatDeliveryResponse(d),
      });
    } catch (err: any) {
      errorResponse(res, 500, "INTERNAL_ERROR", err.message || "An unexpected error occurred");
    }
  });

  // ===== POST /delivery/:id/cancel — Cancel a delivery =====
  gateway.post("/delivery/:id/cancel", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return errorResponse(res, 503, "SERVICE_UNAVAILABLE", "Database unavailable");

      const deliveryId = parseInt(req.params.id);
      if (isNaN(deliveryId)) return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid delivery ID");

      const { reason } = req.body;
      if (!reason) return errorResponse(res, 400, "VALIDATION_ERROR", "reason is required");

      const store = req.store!;
      const delivery = await db.select().from(b2bDeliveries)
        .where(and(eq(b2bDeliveries.id, deliveryId), eq(b2bDeliveries.storeId, store.id)))
        .limit(1);

      if (delivery.length === 0) return errorResponse(res, 404, "NOT_FOUND", "Delivery not found");

      const cancellableStatuses = ["pending", "assigned", "pickup_enroute"];
      if (!cancellableStatuses.includes(delivery[0].status)) {
        return errorResponse(res, 409, "INVALID_STATE", `Cannot cancel delivery in status "${delivery[0].status}". Only pending, assigned, or pickup_enroute deliveries can be cancelled.`);
      }

      const previousStatus = delivery[0].status;

      await db.update(b2bDeliveries)
        .set({
          status: "cancelled",
          cancelledBy: "partner",
          cancellationReason: reason,
        })
        .where(eq(b2bDeliveries.id, deliveryId));

      // Trigger webhooks
      const events = getWebhookEvents("cancelled");
      const payload = buildWebhookPayload(
        "delivery.cancelled",
        { id: deliveryId, externalOrderId: delivery[0].externalOrderId, trackingCode: delivery[0].trackingCode, status: "cancelled" },
        previousStatus,
        { cancelledBy: "partner", reason }
      );
      for (const event of events) {
        triggerWebhooks(store.id, deliveryId, event, { ...payload, event });
      }

      await notifyB2bDeliveryTransition({
        deliveryId: delivery[0].id,
        trackingCode: delivery[0].trackingCode,
        previousStatus,
        newStatus: "cancelled",
        storeOwnerId: store.ownerId,
        assignedPilotId: delivery[0].assignedPilotId,
        actorUserId: store.ownerId,
      });

      res.json({
        success: true,
        message: "Delivery cancelled successfully",
        data: { deliveryId, status: "cancelled" },
      });
    } catch (err: any) {
      errorResponse(res, 500, "INTERNAL_ERROR", err.message || "An unexpected error occurred");
    }
  });

  // ===== GET /delivery/estimate — Get delivery estimate =====
  gateway.get("/delivery/estimate", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { pickupAddress, deliveryAddress, packageWeight, preferredMode, urgency } = req.query;

      if (!pickupAddress || !deliveryAddress) {
        return errorResponse(res, 400, "VALIDATION_ERROR", "pickupAddress and deliveryAddress query params are required");
      }

      const estimate = calculateEstimate({
        pickupAddress: pickupAddress as string,
        deliveryAddress: deliveryAddress as string,
        packageWeight: packageWeight ? parseInt(packageWeight as string) : undefined,
        preferredMode: preferredMode as string,
        urgency: urgency as string,
      });

      res.json({
        success: true,
        data: {
          ...estimate,
          note: "Această estimare este informativă și non-contractuală. Prețul și timpul final pot diferi.",
        },
      });
    } catch (err: any) {
      errorResponse(res, 500, "INTERNAL_ERROR", err.message || "An unexpected error occurred");
    }
  });

  // ===== GET /deliveries — List deliveries =====
  gateway.get("/deliveries", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return errorResponse(res, 503, "SERVICE_UNAVAILABLE", "Database unavailable");

      const store = req.store!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      const conditions: any[] = [eq(b2bDeliveries.storeId, store.id)];
      if (status) conditions.push(eq(b2bDeliveries.status, status as any));

      const where = and(...conditions);
      const deliveries = await db.select().from(b2bDeliveries)
        .where(where)
        .orderBy(desc(b2bDeliveries.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(b2bDeliveries).where(where);

      const total = countResult[0]?.count || 0;

      res.json({
        success: true,
        data: {
          deliveries: deliveries.map(formatDeliveryResponse),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
        },
      });
    } catch (err: any) {
      errorResponse(res, 500, "INTERNAL_ERROR", err.message || "An unexpected error occurred");
    }
  });

  return gateway;
}

// ===== HELPER: Format delivery for response =====

function formatDeliveryResponse(d: typeof b2bDeliveries.$inferSelect) {
  return {
    id: d.id,
    externalOrderId: d.externalOrderId,
    trackingCode: d.trackingCode,
    status: d.status,
    pickup: {
      address: d.pickupAddress,
      contactName: d.pickupContactName,
      contactPhone: d.pickupContactPhone,
      readyAt: d.pickupReadyAt?.toISOString() || null,
    },
    delivery: {
      address: d.deliveryAddress,
      contactName: d.deliveryContactName,
      contactPhone: d.deliveryContactPhone,
      notes: d.deliveryNotes,
    },
    package: {
      weight: d.packageWeight,
      dimensions: d.packageDimensionsL ? { l: d.packageDimensionsL, w: d.packageDimensionsW, h: d.packageDimensionsH } : null,
      fragile: d.packageFragile,
      description: d.packageDescription,
    },
    assignment: {
      pilotId: d.assignedPilotId,
      deliveryMode: d.deliveryMode,
      estimatedArrival: d.estimatedArrival?.toISOString() || null,
      actualPickupAt: d.actualPickupAt?.toISOString() || null,
      actualDeliveryAt: d.actualDeliveryAt?.toISOString() || null,
    },
    pricing: {
      quotedPrice: d.quotedPrice,
      finalPrice: d.finalPrice,
      currency: d.currency,
    },
    cancellation: d.cancelledBy ? {
      cancelledBy: d.cancelledBy,
      reason: d.cancellationReason,
    } : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}
