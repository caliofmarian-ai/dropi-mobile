/**
 * Notification Router — Sprint 6A+
 * Handles push token registration and user notification preferences.
 */
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { pushTokens } from "../drizzle/schema";

export const notificationRouter = router({
  /**
   * Register or update a push token for the current user.
   * Called on app startup after getting permission.
   */
  registerPushToken: protectedProcedure
    .input(z.object({
      token: z.string().min(1),
      platform: z.enum(["ios", "android", "web"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id;

      // Check if token already exists for this user
      const existing = await db.select()
        .from(pushTokens)
        .where(and(
          eq(pushTokens.userId, userId),
          eq(pushTokens.token, input.token)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Reactivate if it was deactivated
        if (!existing[0].isActive) {
          await db.update(pushTokens)
            .set({ isActive: true })
            .where(eq(pushTokens.id, existing[0].id));
        }
        return { success: true, action: "reactivated" };
      }

      // Insert new token
      await db.insert(pushTokens).values({
        userId,
        token: input.token,
        platform: input.platform,
      });

      console.log(`[PUSH] Registered push token for user ${userId} (${input.platform})`);
      return { success: true, action: "registered" };
    }),

  /**
   * Unregister a push token (e.g., on logout).
   */
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
});
