/**
 * Helper to create in-app notifications from any server router.
 * Centralizes notification creation logic for consistency.
 * Integrates WebSocket broadcast for real-time delivery.
 */
import { getDb } from "./db";
import { inAppNotifications } from "../drizzle/schema";
import { broadcastNotificationToUser } from "./ws-notifications";

export type NotificationCategory = "verification" | "missions" | "orders" | "system" | "promotions" | "security";

interface CreateNotificationParams {
  userId: number;
  title: string;
  body: string;
  category: NotificationCategory;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an in-app notification for a specific user.
 * Also broadcasts via WebSocket for real-time delivery.
 * Call this from any router after a significant action.
 */
export async function createInAppNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const [inserted] = await db.insert(inAppNotifications).values({
      userId: params.userId,
      title: params.title,
      body: params.body,
      category: params.category,
      data: params.metadata ? JSON.stringify(params.metadata) : null,
      isRead: false,
    }).$returningId();

    // Broadcast via WebSocket for real-time delivery
    if (inserted?.id) {
      broadcastNotificationToUser(params.userId, {
        id: inserted.id,
        type: params.category,
        title: params.title,
        body: params.body,
        data: params.metadata,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("[NOTIFICATION] Failed to create in-app notification:", err);
  }
}

/**
 * Creates in-app notifications for multiple users at once.
 * Broadcasts to each user via WebSocket.
 */
export async function createBulkNotifications(
  userIds: number[],
  title: string,
  body: string,
  category: NotificationCategory,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const db = await getDb();
    if (!db || userIds.length === 0) return;

    const values = userIds.map((userId) => ({
      userId,
      title,
      body,
      category,
      data: metadata ? JSON.stringify(metadata) : null,
      isRead: false,
    }));

    await db.insert(inAppNotifications).values(values);

    // Broadcast to each user via WebSocket
    const now = new Date().toISOString();
    for (const userId of userIds) {
      broadcastNotificationToUser(userId, {
        id: 0, // Bulk insert doesn't return individual IDs easily
        type: category,
        title,
        body,
        data: metadata,
        createdAt: now,
      });
    }
  } catch (err) {
    console.error("[NOTIFICATION] Failed to create bulk notifications:", err);
  }
}
