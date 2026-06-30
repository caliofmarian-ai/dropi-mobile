/**
 * Notification Router — Sprint 6B
 * Handles push token registration, in-app notifications, and user notification preferences.
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { pushTokens, inAppNotifications, notificationPreferences } from "../drizzle/schema";

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
});
