/**
 * Push Notification Service — Sprint 6A+
 * Sends Expo push notifications to individual users via their registered push tokens.
 * Uses Expo Push API: https://docs.expo.dev/push-notifications/sending-notifications/
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { pushTokens } from "../drizzle/schema";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
}

/**
 * Send push notification to a specific user (all their active devices).
 * Returns the number of notifications sent successfully.
 */
export async function sendPushToUser(userId: number, message: PushMessage): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[PUSH] Database unavailable, cannot send push notification");
    return 0;
  }

  // Get all active push tokens for this user
  const tokens = await db.select()
    .from(pushTokens)
    .where(and(
      eq(pushTokens.userId, userId),
      eq(pushTokens.isActive, true)
    ));

  if (tokens.length === 0) {
    console.log(`[PUSH] No active push tokens for user ${userId}, skipping`);
    return 0;
  }

  // Build Expo push messages
  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    title: message.title,
    body: message.body,
    data: message.data || {},
    channelId: message.channelId || "default",
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[PUSH] Expo Push API error (${response.status}): ${errorText}`);
      return 0;
    }

    const result = await response.json();
    const tickets = result.data || [];

    // Deactivate tokens that returned "DeviceNotRegistered"
    let sentCount = 0;
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === "ok") {
        sentCount++;
      } else if (ticket.details?.error === "DeviceNotRegistered") {
        // Token is no longer valid, deactivate it
        await db.update(pushTokens)
          .set({ isActive: false })
          .where(eq(pushTokens.id, tokens[i].id));
        console.log(`[PUSH] Deactivated invalid token for user ${userId}: ${tokens[i].token.substring(0, 20)}...`);
      }
    }

    console.log(`[PUSH] Sent ${sentCount}/${messages.length} notifications to user ${userId}`);
    return sentCount;
  } catch (err) {
    console.error("[PUSH] Failed to send push notification:", err);
    return 0;
  }
}

/**
 * Send push notification to multiple users at once.
 */
export async function sendPushToUsers(userIds: number[], message: PushMessage): Promise<number> {
  let totalSent = 0;
  for (const userId of userIds) {
    totalSent += await sendPushToUser(userId, message);
  }
  return totalSent;
}
