import { eq } from "drizzle-orm";
import { notificationPreferences } from "../drizzle/schema";
import { getDb } from "./db";
import { sendPushToUser, type PushMessage } from "./push-notifications";

export type PushPreferenceKey = "pushOrders" | "pushMissions";

export type PreferenceAwarePushResult = {
  userId: number;
  preference: PushPreferenceKey;
  enabled: boolean;
  sent: number;
};

type PreferenceAwarePushDependencies = {
  isPreferenceEnabled: (userId: number, preference: PushPreferenceKey) => Promise<boolean>;
  sendPush: (userId: number, message: PushMessage) => Promise<number>;
};

async function isPreferenceEnabled(userId: number, preference: PushPreferenceKey): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const rows = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  // Notification settings default to enabled for order/mission pushes when no row exists.
  if (rows.length === 0) return true;
  return rows[0][preference];
}

const DEFAULT_DEPENDENCIES: PreferenceAwarePushDependencies = {
  isPreferenceEnabled,
  sendPush: sendPushToUser,
};

/**
 * Sends a push only when the user's persisted preference allows that category.
 * Delivery failures are non-fatal to the business transition that triggered them.
 */
export async function sendPreferenceAwarePush(
  input: {
    userId: number;
    preference: PushPreferenceKey;
    message: PushMessage;
  },
  dependencies: PreferenceAwarePushDependencies = DEFAULT_DEPENDENCIES,
): Promise<PreferenceAwarePushResult> {
  if (!Number.isSafeInteger(input.userId) || input.userId <= 0) {
    return { userId: input.userId, preference: input.preference, enabled: false, sent: 0 };
  }

  try {
    const enabled = await dependencies.isPreferenceEnabled(input.userId, input.preference);
    if (!enabled) {
      return { userId: input.userId, preference: input.preference, enabled: false, sent: 0 };
    }

    const sent = await dependencies.sendPush(input.userId, input.message);
    return { userId: input.userId, preference: input.preference, enabled: true, sent };
  } catch (error) {
    console.warn(`[PUSH] Preference-aware push failed for user ${input.userId}:`, error);
    return { userId: input.userId, preference: input.preference, enabled: true, sent: 0 };
  }
}
