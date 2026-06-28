/**
 * Webhook Trigger Service — Sprint E Upgrade
 *
 * Automatically fires webhooks to registered B2B partner endpoints
 * when delivery status changes occur. Implements:
 * - HMAC-SHA256 signature verification
 * - Exponential backoff retry (1min, 5min, 30min)
 * - Failure tracking and auto-deactivation after 10 consecutive failures
 * - Comprehensive logging in webhookLogs table
 *
 * Usage:
 *   import { triggerWebhooks } from "./webhook-trigger";
 *   await triggerWebhooks(storeId, deliveryId, event, payload);
 */

import { getDb } from "./db";
import { webhookEndpoints, webhookLogs } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

// Retry delays in milliseconds: 1min, 5min, 30min
const RETRY_DELAYS = [60_000, 300_000, 1_800_000];
const MAX_RETRIES = 3;
const MAX_CONSECUTIVE_FAILURES = 10;
const WEBHOOK_TIMEOUT_MS = 10_000; // 10 seconds

export interface WebhookPayload {
  event: string;
  deliveryId: number;
  externalOrderId: string;
  trackingCode: string;
  newStatus: string;
  previousStatus?: string;
  timestamp: string;
  details?: Record<string, any>;
}

/**
 * Trigger all matching webhooks for a store when a delivery event occurs.
 * Non-blocking: fires webhooks asynchronously and logs results.
 */
export async function triggerWebhooks(
  storeId: number,
  deliveryId: number,
  event: string,
  payload: WebhookPayload
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Find all active webhook endpoints for this store that subscribe to this event
  const endpoints = await db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.storeId, storeId),
        eq(webhookEndpoints.isActive, true)
      )
    );

  // Filter endpoints that subscribe to this event
  const matchingEndpoints = endpoints.filter((ep) => {
    const events: string[] = JSON.parse(ep.events as string);
    return events.includes(event) || events.includes("delivery.status_changed");
  });

  if (matchingEndpoints.length === 0) return;

  // Fire webhooks concurrently (non-blocking)
  const promises = matchingEndpoints.map((endpoint) =>
    deliverWebhook(endpoint, deliveryId, event, payload, 1).catch((err) => {
      console.error(`[Webhook] Failed to deliver to ${endpoint.url}:`, err.message);
    })
  );

  // Don't await — fire and forget for non-blocking behavior
  Promise.allSettled(promises);
}

/**
 * Deliver a single webhook with retry logic.
 */
async function deliverWebhook(
  endpoint: typeof webhookEndpoints.$inferSelect,
  deliveryId: number,
  event: string,
  payload: WebhookPayload,
  attemptNumber: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const payloadStr = JSON.stringify(payload);

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", endpoint.secret)
    .update(payloadStr)
    .digest("hex");

  let success = false;
  let responseStatus: number | null = null;
  let responseBody: string | null = null;

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DROPi-Signature": signature,
        "X-DROPi-Event": event,
        "X-DROPi-Delivery-Id": String(deliveryId),
        "X-DROPi-Timestamp": payload.timestamp,
        "User-Agent": "DROPi-Webhook/1.0",
      },
      body: payloadStr,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    responseStatus = response.status;
    responseBody = await response.text().catch(() => null);
    success = response.ok; // 2xx status codes
  } catch (err: any) {
    responseBody = err.message || "Connection failed";
  }

  // Log the attempt
  await db.insert(webhookLogs).values({
    webhookEndpointId: endpoint.id,
    deliveryId,
    event,
    payload: payloadStr,
    responseStatus,
    responseBody: responseBody?.substring(0, 2000) || null,
    success,
    attemptNumber,
    respondedAt: new Date(),
  });

  // Update endpoint stats
  if (success) {
    await db
      .update(webhookEndpoints)
      .set({
        lastTriggeredAt: new Date(),
        lastSuccessAt: new Date(),
        failureCount: 0,
        lastFailureReason: null,
      })
      .where(eq(webhookEndpoints.id, endpoint.id));
  } else {
    const newFailureCount = endpoint.failureCount + attemptNumber;

    await db
      .update(webhookEndpoints)
      .set({
        lastTriggeredAt: new Date(),
        failureCount: sql`${webhookEndpoints.failureCount} + 1`,
        lastFailureReason: responseBody?.substring(0, 500) || "Unknown error",
      })
      .where(eq(webhookEndpoints.id, endpoint.id));

    // Auto-deactivate after MAX_CONSECUTIVE_FAILURES
    if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
      await db
        .update(webhookEndpoints)
        .set({
          isActive: false,
          lastFailureReason: `Auto-deactivated: ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Last error: ${responseBody?.substring(0, 200) || "Unknown"}`,
        })
        .where(eq(webhookEndpoints.id, endpoint.id));

      console.warn(`[Webhook] Endpoint ${endpoint.id} (${endpoint.url}) auto-deactivated after ${MAX_CONSECUTIVE_FAILURES} failures`);
      return; // Don't retry
    }

    // Schedule retry with exponential backoff
    if (attemptNumber < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attemptNumber - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      setTimeout(() => {
        deliverWebhook(endpoint, deliveryId, event, payload, attemptNumber + 1).catch(
          (err) => console.error(`[Webhook] Retry ${attemptNumber + 1} failed for ${endpoint.url}:`, err.message)
        );
      }, delay);
    }
  }
}

/**
 * Helper to build a standard webhook payload from a delivery status change.
 */
export function buildWebhookPayload(
  event: string,
  delivery: {
    id: number;
    externalOrderId: string;
    trackingCode: string;
    status: string;
  },
  previousStatus?: string,
  details?: Record<string, any>
): WebhookPayload {
  return {
    event,
    deliveryId: delivery.id,
    externalOrderId: delivery.externalOrderId,
    trackingCode: delivery.trackingCode,
    newStatus: delivery.status,
    previousStatus,
    timestamp: new Date().toISOString(),
    details,
  };
}

/**
 * Determine which webhook event(s) to fire based on the new status.
 */
export function getWebhookEvents(newStatus: string): string[] {
  const events: string[] = ["delivery.status_changed"];

  switch (newStatus) {
    case "delivered":
      events.push("delivery.completed");
      break;
    case "cancelled":
      events.push("delivery.cancelled");
      break;
    case "failed":
      events.push("delivery.failed");
      break;
    case "picked_up":
      events.push("delivery.picked_up");
      break;
  }

  return events;
}
