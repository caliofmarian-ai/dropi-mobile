/**
 * Notification Router — Sprint 6B
 * Handles push token registration, in-app notifications, and user notification preferences.
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { pushTokens, inAppNotifications, notificationPreferences } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

export const notificationRouter = router({
  // ============================================================
  // PUSH TOKEN MANAGEMENT
  // ============================================================

  registerPushToken: protectedProcedure
    .input(z.object({
      token: z.string().min(1),
      platform: z.enum(["ios", "android", "web"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id;

      const existing = await db.select()
        .from(pushTokens)
        .where(and(
          eq(pushTokens.userId, userId),
          eq(pushTokens.token, input.token)
        ))
        .limit(1);

      if (existing.length > 0) {
        if (!existing[0].isActive) {
          await db.update(pushTokens)
            .set({ isActive: true })
            .where(eq(pushTokens.id, existing[0].id));
        }
        return { success: true, action: "reactivated" };
      }

      await db.insert(pushTokens).values({
        userId,
        token: input.token,
        platform: input.platform,
      });

      console.log(`[PUSH] Registered push token for user ${userId} (${input.platform})`);
      return { success: true, action: "registered" };
    }),

  unregisterPushToken: protectedProcedure
    .input(z.object({
      token: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id;

      await db.update(pushTokens)
        .set({ isActive: false })
        .where(and(
          eq(pushTokens.userId, userId),
          eq(pushTokens.token, input.token)
        ));

      console.log(`[PUSH] Unregistered push token for user ${userId}`);
      return { success: true };
    }),

  // ============================================================
  // IN-APP NOTIFICATIONS
  // ============================================================

  /** Get paginated list of in-app notifications for current user */
  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const notifications = await db.select()
        .from(inAppNotifications)
        .where(eq(inAppNotifications.userId, userId))
        .orderBy(desc(inAppNotifications.createdAt))
        .limit(limit)
        .offset(offset);

      return { notifications, hasMore: notifications.length === limit };
    }),

  /** Get unread notification count */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const userId = ctx.user!.id;

      const unread = await db.select()
        .from(inAppNotifications)
        .where(and(
          eq(inAppNotifications.userId, userId),
          eq(inAppNotifications.isRead, false)
        ));

      return { count: unread.length };
    }),

  /** Mark a single notification as read */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id;

      await db.update(inAppNotifications)
        .set({ isRead: true })
        .where(and(
          eq(inAppNotifications.id, input.notificationId),
          eq(inAppNotifications.userId, userId)
        ));

      return { success: true };
    }),

  /** Mark all notifications as read */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id;

      await db.update(inAppNotifications)
        .set({ isRead: true })
        .where(and(
          eq(inAppNotifications.userId, userId),
          eq(inAppNotifications.isRead, false)
        ));

      return { success: true };
    }),

  // ============================================================
  // NOTIFICATION PREFERENCES
  // ============================================================

  /** Get current user's notification preferences */
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id;

      const prefs = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      if (prefs.length === 0) {
        // Return defaults
        return {
          pushVerification: true,
          pushMissions: true,
          pushOrders: true,
          pushSystem: true,
          pushPromotions: false,
          pushSecurity: true,
          inAppVerification: true,
          inAppMissions: true,
          inAppOrders: true,
          inAppSystem: true,
          inAppPromotions: true,
          inAppSecurity: true,
        };
      }

      const p = prefs[0];
      return {
        pushVerification: p.pushVerification,
        pushMissions: p.pushMissions,
        pushOrders: p.pushOrders,
        pushSystem: p.pushSystem,
        pushPromotions: p.pushPromotions,
        pushSecurity: p.pushSecurity,
        inAppVerification: p.inAppVerification,
        inAppMissions: p.inAppMissions,
        inAppOrders: p.inAppOrders,
        inAppSystem: p.inAppSystem,
        inAppPromotions: p.inAppPromotions,
        inAppSecurity: p.inAppSecurity,
      };
    }),

  /** Update notification preferences */
  updatePreferences: protectedProcedure
    .input(z.object({
      pushVerification: z.boolean().optional(),
      pushMissions: z.boolean().optional(),
      pushOrders: z.boolean().optional(),
      pushSystem: z.boolean().optional(),
      pushPromotions: z.boolean().optional(),
      pushSecurity: z.boolean().optional(),
      inAppVerification: z.boolean().optional(),
      inAppMissions: z.boolean().optional(),
      inAppOrders: z.boolean().optional(),
      inAppSystem: z.boolean().optional(),
      inAppPromotions: z.boolean().optional(),
      inAppSecurity: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id;

      const existing = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      if (existing.length === 0) {
        // Create with provided values (rest use defaults)
        await db.insert(notificationPreferences).values({
          userId,
          ...input,
        } as any);
      } else {
        // Update only provided fields
        await db.update(notificationPreferences)
          .set(input)
          .where(eq(notificationPreferences.userId, userId));
      }

      return { success: true };
    }),

  // ============================================================
  // FCM CONFIGURATION (Admin only)
  // ============================================================

  getFcmStatus: adminProcedure
    .query(async () => {
      const configPath = path.join(process.cwd(), "config", "fcm-service-account.json");
      try {
        if (fs.existsSync(configPath)) {
          const content = fs.readFileSync(configPath, "utf-8");
          const parsed = JSON.parse(content);
          const stat = fs.statSync(configPath);
          return {
            configured: true,
            projectId: parsed.project_id || "unknown",
            clientEmail: parsed.client_email || "unknown",
            lastUpdated: stat.mtime.toISOString(),
          };
        }
      } catch (e) {
        // File doesn't exist or is invalid
      }
      return { configured: false };
    }),

  saveFcmConfig: adminProcedure
    .input(z.object({
      serviceAccountJson: z.string(),
    }))
    .mutation(async ({ input }) => {
      const configDir = path.join(process.cwd(), "config");
      const configPath = path.join(configDir, "fcm-service-account.json");

      if (!input.serviceAccountJson.trim()) {
        // Remove config
        try {
          if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
        } catch (e) { /* ignore */ }
        return { success: true, message: "FCM configuration removed. Push notifications disabled." };
      }

      // Validate JSON
      let parsed: any;
      try {
        parsed = JSON.parse(input.serviceAccountJson);
      } catch (e) {
        throw new Error("Invalid JSON format");
      }

      if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
        throw new Error("Missing required fields: project_id, private_key, client_email");
      }

      // Save to config directory
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), "utf-8");

      console.log(`[FCM] Service account configured: ${parsed.project_id} (${parsed.client_email})`);

      return {
        success: true,
        message: `FCM configured for project: ${parsed.project_id}`,
        projectId: parsed.project_id,
      };
    }),

  // ============================================================
  // SYSTEM MONITORING STATS (Admin only)
  // ============================================================

  getSystemStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const { sql } = await import("drizzle-orm");

    // Push token stats
    const tokenResult = await db.select({ count: sql<number>`count(*)` }).from(pushTokens);
    const activeTokens = await db.select({ count: sql<number>`count(*)` }).from(pushTokens).where(eq(pushTokens.isActive, true));

    // In-app notification stats
    const totalNotifs = await db.select({ count: sql<number>`count(*)` }).from(inAppNotifications);
    const unreadNotifs = await db.select({ count: sql<number>`count(*)` }).from(inAppNotifications).where(eq(inAppNotifications.isRead, false));
    const last24h = await db.select({ count: sql<number>`count(*)` }).from(inAppNotifications).where(sql`${inAppNotifications.createdAt} > NOW() - INTERVAL 24 HOUR`);

    // FCM config status
    const configPath = path.join(process.cwd(), ".config", "fcm-service-account.json");
    const fcmConfigured = fs.existsSync(configPath);

    // WebSocket stats (from global tracking)
    const wsNotifModule = await import("./ws-notifications");
    const wsNotifStats = wsNotifModule.getNotificationWSStats?.() ?? { connectedUsers: 0, totalConnections: 0 };

    let wsTrackingStats = { activeDeliveries: 0, activePilots: 0 };
    try {
      const wsTrackingModule = await import("./live-tracking");
      wsTrackingStats = wsTrackingModule.getTrackingStats?.() ?? wsTrackingStats;
    } catch { /* live-tracking may not export stats */ }

    return {
      wsNotifications: wsNotifStats,
      wsTracking: wsTrackingStats,
      push: {
        registeredTokens: Number(tokenResult[0]?.count ?? 0),
        activeDevices: Number(activeTokens[0]?.count ?? 0),
        fcmConfigured,
      },
      inApp: {
        total: Number(totalNotifs[0]?.count ?? 0),
        totalUnread: Number(unreadNotifs[0]?.count ?? 0),
        last24h: Number(last24h[0]?.count ?? 0),
      },
    };
  }),

  /** Get notification volume by day for the past 7 days */
  getNotificationAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const { sql } = await import("drizzle-orm");

    // Get daily counts for the past 7 days
    const rows = await db.select({
      day: sql<string>`DATE(${inAppNotifications.createdAt})`,
      count: sql<number>`count(*)`,
    })
      .from(inAppNotifications)
      .where(sql`${inAppNotifications.createdAt} > NOW() - INTERVAL 7 DAY`)
      .groupBy(sql`DATE(${inAppNotifications.createdAt})`)
      .orderBy(sql`DATE(${inAppNotifications.createdAt})`);

    // Fill in missing days with 0
    const result: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const found = rows.find((r) => String(r.day) === dayStr);
      result.push({ day: dayStr, count: found ? Number(found.count) : 0 });
    }

    return { days: result };
  }),

  /** Send a test push notification to the current admin's devices */
  sendTestPush: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user!.id;

    // Get admin's push tokens
    const tokens = await db.select()
      .from(pushTokens)
      .where(and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.isActive, true)
      ));

    if (tokens.length === 0) {
      return { success: false, message: "No registered push tokens for your account. Open the app on a device to register." };
    }

    // Try to send via FCM using sendPushToUser
    try {
      const pushModule = await import("./push-notifications");
      const sent = await pushModule.sendPushToUser(userId, {
        title: "DROPi Test Push",
        body: "If you see this, push notifications are working correctly!",
        data: { type: "test", timestamp: new Date().toISOString() },
        priority: "high",
      });
      return {
        success: sent > 0,
        message: sent > 0 ? `Test push sent to ${sent} device(s)` : "No devices received the push (FCM may not be configured)",
        sent,
        failed: tokens.length - sent,
      };
    } catch (e: any) {
      return { success: false, message: `FCM error: ${e.message || "Unknown error"}` };
    }
  }),
});
