/**
 * Push Notification Service — DROPi Independent
 * 
 * Sends push notifications directly via Firebase Cloud Messaging (FCM) HTTP v1 API.
 * NO dependency on Expo Push Service — fully independent, runs on server propriu.
 * 
 * FCM HTTP v1 API: https://firebase.google.com/docs/cloud-messaging/send-message
 * 
 * Required environment variables:
 * - FCM_PROJECT_ID: Firebase project ID (e.g., "dropi-logistics")
 * - FCM_SERVICE_ACCOUNT_JSON: Path to service account JSON file OR the JSON string itself
 * 
 * Fallback: If FCM is not configured, falls back to Expo Push API for development.
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { pushTokens } from "../drizzle/schema";

// ============================================================
// CONFIGURATION
// ============================================================

const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || "";
const FCM_SERVICE_ACCOUNT = process.env.FCM_SERVICE_ACCOUNT_JSON || "";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"; // Fallback only

// FCM HTTP v1 endpoint
const getFcmUrl = () => `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

// Determine which provider to use
const useFCM = (): boolean => !!(FCM_PROJECT_ID && FCM_SERVICE_ACCOUNT);

// ============================================================
// TYPES
// ============================================================

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  /** Optional: image URL to display in notification */
  imageUrl?: string;
  /** Optional: priority (high = wake device, normal = batched) */
  priority?: "high" | "normal";
}

interface FCMServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// ============================================================
// FCM ACCESS TOKEN (OAuth2 with Service Account)
// ============================================================

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Get a valid FCM OAuth2 access token using service account credentials.
 * Tokens are cached and refreshed 5 minutes before expiry.
 */
async function getFcmAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 300_000) {
    return cachedAccessToken;
  }

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    throw new Error("[FCM] Invalid service account configuration");
  }

  // Create JWT for Google OAuth2
  const jwt = await createServiceAccountJWT(serviceAccount);

  // Exchange JWT for access token
  const response = await fetch(serviceAccount.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`[FCM] Token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600) * 1000;

  console.log("[FCM] Access token obtained, expires in", data.expires_in, "seconds");
  return cachedAccessToken!;
}

/**
 * Parse service account from env var (JSON string or file path).
 */
function parseServiceAccount(): FCMServiceAccount | null {
  try {
    if (FCM_SERVICE_ACCOUNT.startsWith("{")) {
      return JSON.parse(FCM_SERVICE_ACCOUNT);
    }
    // If it's a file path, read it (sync for simplicity at startup)
    const fs = require("fs");
    const content = fs.readFileSync(FCM_SERVICE_ACCOUNT, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("[FCM] Failed to parse service account:", err);
    return null;
  }
}

/**
 * Create a signed JWT for Google OAuth2 service account authentication.
 * Uses Node.js crypto (no external dependencies).
 */
async function createServiceAccountJWT(sa: FCMServiceAccount): Promise<string> {
  const crypto = require("crypto");

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(sa.private_key, "base64url");

  return `${signingInput}.${signature}`;
}

// ============================================================
// FCM SEND (Direct)
// ============================================================

/**
 * Send a single notification via FCM HTTP v1 API.
 */
async function sendViaFCM(token: string, message: PushMessage): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getFcmAccessToken();

    const fcmMessage: any = {
      message: {
        token,
        notification: {
          title: message.title,
          body: message.body,
          ...(message.imageUrl ? { image: message.imageUrl } : {}),
        },
        data: message.data ? Object.fromEntries(
          Object.entries(message.data).map(([k, v]) => [k, String(v)])
        ) : undefined,
        android: {
          priority: message.priority || "high",
          notification: {
            channel_id: message.channelId || "default",
            sound: "default",
            default_vibrate_timings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      },
    };

    const response = await fetch(getFcmUrl(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmMessage),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorCode = errorData?.error?.code;
    const errorMessage = errorData?.error?.message || "";

    // Token is invalid/unregistered
    if (errorCode === 404 || errorCode === 400 || errorMessage.includes("UNREGISTERED")) {
      return { success: false, error: "UNREGISTERED" };
    }

    return { success: false, error: `FCM_ERROR_${errorCode}: ${errorMessage}` };
  } catch (err: any) {
    return { success: false, error: err.message || "UNKNOWN_ERROR" };
  }
}

// ============================================================
// EXPO PUSH FALLBACK (Development Only)
// ============================================================

/**
 * Send via Expo Push API (fallback when FCM is not configured).
 * Used only during development with Expo Go.
 */
async function sendViaExpoPush(tokens: Array<{ id: number; token: string; userId: number }>, message: PushMessage): Promise<number> {
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
      console.error(`[PUSH/EXPO] Error (${response.status})`);
      return 0;
    }

    const result = await response.json();
    const tickets = result.data || [];
    let sentCount = 0;

    const db = await getDb();
    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i].status === "ok") {
        sentCount++;
      } else if (tickets[i].details?.error === "DeviceNotRegistered" && db) {
        await db.update(pushTokens)
          .set({ isActive: false })
          .where(eq(pushTokens.id, tokens[i].id));
      }
    }

    return sentCount;
  } catch (err) {
    console.error("[PUSH/EXPO] Failed:", err);
    return 0;
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Send push notification to a specific user (all their active devices).
 * Automatically uses FCM if configured, otherwise falls back to Expo Push.
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

  const provider = useFCM() ? "FCM" : "EXPO";
  console.log(`[PUSH/${provider}] Sending to user ${userId} (${tokens.length} devices): "${message.title}"`);

  // ---- FCM Direct ----
  if (useFCM()) {
    let sentCount = 0;
    for (const t of tokens) {
      const result = await sendViaFCM(t.token, message);
      if (result.success) {
        sentCount++;
      } else if (result.error === "UNREGISTERED") {
        // Deactivate invalid token
        await db.update(pushTokens)
          .set({ isActive: false })
          .where(eq(pushTokens.id, t.id));
        console.log(`[PUSH/FCM] Deactivated unregistered token for user ${userId}`);
      } else {
        console.warn(`[PUSH/FCM] Failed for token ${t.token.substring(0, 20)}...: ${result.error}`);
      }
    }
    console.log(`[PUSH/FCM] Sent ${sentCount}/${tokens.length} to user ${userId}`);
    return sentCount;
  }

  // ---- Expo Push Fallback (development) ----
  const sentCount = await sendViaExpoPush(tokens, message);
  console.log(`[PUSH/EXPO] Sent ${sentCount}/${tokens.length} to user ${userId} (dev fallback)`);
  return sentCount;
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

/**
 * Get the current push notification provider status.
 */
export function getPushProviderStatus(): { provider: "FCM" | "EXPO_FALLBACK"; configured: boolean; projectId?: string } {
  if (useFCM()) {
    return { provider: "FCM", configured: true, projectId: FCM_PROJECT_ID };
  }
  return { provider: "EXPO_FALLBACK", configured: false };
}
