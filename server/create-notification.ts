/**
 * Helper to create in-app notifications from any server router.
 * Centralizes notification creation logic for consistency.
 */
import { getDb } from "./db";
import { inAppNotifications } from "../drizzle/schema";

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
 * Call this from any router after a significant action.
 */
export async function createInAppNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(inAppNotifications).values({
      userId: params.userId,
      title: params.title,
      body: params.body,
      category: params.category,
      data: params.metadata ? JSON.stringify(params.metadata) : null,
      isRead: false,
    });
  } catch (err) {
    console.error("[NOTIFICATION] Failed to create in-app notification:", err);
  }
}

/**
 * Creates in-app notifications for multiple users at once.
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
  } catch (err) {
    console.error("[NOTIFICATION] Failed to create bulk notifications:", err);
  }
}
