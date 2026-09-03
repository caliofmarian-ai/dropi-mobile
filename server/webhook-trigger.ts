/**
 * Webhook Trigger Service — Sprint E Upgrade
 *
 * Automatically fires webhooks to registered B2B partner endpoints
 * when delivery status changes occur. Implements:
 * - HMAC-SHA256 signature verification
 * - AES-256-GCM at-rest protection for signing secrets
 * - Exponential backoff retry (1min, 5min, 30min)
 * - Failure tracking and auto-deactivation after 10 consecutive failures
 * - Comprehensive logging in webhookLogs table
 */

import { getDb } from "./db";
import { webhookEndpoints, webhookLogs } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import { protectWebhookSigningSecret, revealWebhookSigningSecret, webhookSecretNeedsRewrap } from "./webhook-secret-policy";
import { validatePublicWebhookUrl } from "./outbound-url-policy";

const RETRY_DELAYS = [60_000, 300_000, 1_800_000];
const MAX_RETRIES = 3;
const MAX_CONSECUTIVE_FAILURES = 10;
const WEBHOOK_TIMEOUT_MS = 10_000;

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

export async function triggerWebhooks(
  storeId: number,
  deliveryId: number,
  event: string,
  payload: WebhookPayload
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const endpoints = await db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.storeId, storeId),
        eq(webhookEndpoints.isActive, true)
      )
    );

  const matchingEndpoints = endpoints.filter((ep) => {
    const events: string[] = JSON.parse(ep.events as string);
    return events.includes(event) || events.includes("delivery.status_changed");
  });

  if (matchingEndpoints.length === 0) return;

  const promises = matchingEndpoints.map((endpoint) =>
    deliverWebhook(endpoint, deliveryId, event, payload, 1).catch((err) => {
      // Never log signing secrets or payload credentials on delivery failure.
      console.error(`[Webhook] Delivery failed for endpoint ${endpoint.id}:`, err.message);
    })
  );
  Promise.allSettled(promises);
}

async function signingSecretForEndpoint(endpoint: typeof webhookEndpoints.$inferSelect): Promise<string> {
  const secret = revealWebhookSigningSecret(endpoint.secret);
  if (webhookSecretNeedsRewrap(endpoint.secret)) {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable while rotating webhook secret.");
    await db.update(webhookEndpoints)
      .set({ secret: protectWebhookSigningSecret(secret) })
      .where(eq(webhookEndpoints.id, endpoint.id));
  }
  return secret;
}

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
  const signingSecret = await signingSecretForEndpoint(endpoint);
  const signature = crypto
    .createHmac("sha256", signingSecret)
    .update(payloadStr)
    .digest("hex");

  let success = false;
  let responseStatus: number | null = null;
  let responseBody: string | null = null;

  try {
    const validatedUrl = await validatePublicWebhookUrl(endpoint.url);
    const response = await fetch(validatedUrl, {
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
      redirect: "error",
    });

    responseStatus = response.status;
    responseBody = await response.text().catch(() => null);
    success = response.ok;
  } catch (err: any) {
    responseBody = err.message || "Connection failed";
  }

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

    if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
      await db
        .update(webhookEndpoints)
        .set({
          isActive: false,
          lastFailureReason: `Auto-deactivated: ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Last error: ${responseBody?.substring(0, 200) || "Unknown"}`,
        })
        .where(eq(webhookEndpoints.id, endpoint.id));

      console.warn(`[Webhook] Endpoint ${endpoint.id} auto-deactivated after ${MAX_CONSECUTIVE_FAILURES} failures`);
      return;
    }

    if (attemptNumber < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attemptNumber - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      setTimeout(() => {
        deliverWebhook(endpoint, deliveryId, event, payload, attemptNumber + 1).catch(
          (err) => console.error(`[Webhook] Retry ${attemptNumber + 1} failed for endpoint ${endpoint.id}:`, err.message)
        );
      }, delay);
    }
  }
}

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
