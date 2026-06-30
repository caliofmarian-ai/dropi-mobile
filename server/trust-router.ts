/**
 * DROPi Trust & Badge Router — Sprint C
 * 
 * Endpoints for trust score calculation, badge management, and elimination mechanism.
 * Conforms to Blueprint Section 7 (Stratul 2 — System de Încredere și Badge-uri).
 */

import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { stores, sellerBadges } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  calculateTrustScore,
  updateStoreTrustScore,
  recalculateAllTrustScores,
  getStoreBadgeHistory,
  type TrustScoreResult,
} from "./trust-engine";
import { notifyOwner } from "./_core/notification";

export const trustRouter = router({
  /**
   * Get trust score details for the current merchant's store.
   * Returns full component breakdown, badge, and elimination status.
   */
  getMyTrustScore: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const user = ctx.user as any;
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    if (!store) return null;
    return calculateTrustScore(store.id);
  }),

  /**
   * Get trust score for a specific store (admin or public view).
   */
  getStoreTrustScore: protectedProcedure
    .input(z.object({ storeId: z.number() }))
    .query(async ({ input }) => {
      return calculateTrustScore(input.storeId);
    }),

  /**
   * Get badge history for the current merchant's store.
   */
  getMyBadgeHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const user = ctx.user as any;
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    if (!store) return [];
    return getStoreBadgeHistory(store.id);
  }),

  /**
   * Get badge history for a specific store (admin view).
   */
  getStoreBadgeHistory: adminProcedure
    .input(z.object({ storeId: z.number() }))
    .query(async ({ input }) => {
      return getStoreBadgeHistory(input.storeId);
    }),

  /**
   * Force recalculate trust score for a specific store (admin action).
   * Used when admin wants to trigger immediate recalculation.
   */
  recalculateStore: adminProcedure
    .input(z.object({ storeId: z.number() }))
    .mutation(async ({ input }) => {
      const result = await updateStoreTrustScore(input.storeId);
      return result;
    }),

  /**
   * Trigger batch recalculation of all active stores (admin/system action).
   * Normally called by daily scheduled job.
   */
  recalculateAll: adminProcedure.mutation(async () => {
    const result = await recalculateAllTrustScores();
    return result;
  }),

  /**
   * Admin override badge for a store (with mandatory justification).
   * Blueprint: "Override manual posibil DOAR de Admin System, cu justificare obligatorie (logată în audit)"
   */
  overrideBadge: adminProcedure
    .input(z.object({
      storeId: z.number(),
      newBadgeType: z.enum(["high_trust", "new_activity", "high_risk", "restricted"]),
      reason: z.string().min(10, "Justification must be at least 10 characters"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const admin = ctx.user as any;

      // Deactivate current badge
      await db.update(sellerBadges)
        .set({ isActive: false })
        .where(and(eq(sellerBadges.storeId, input.storeId), eq(sellerBadges.isActive, true)));

      // Insert override badge
      await db.insert(sellerBadges).values({
        storeId: input.storeId,
        type: input.newBadgeType,
        reason: `ADMIN OVERRIDE: ${input.reason}`,
        isActive: true,
        overriddenBy: admin.id,
        overrideReason: input.reason,
      });

      // If setting to restricted, also suspend the store
      if (input.newBadgeType === "restricted") {
        await db.update(stores)
          .set({
            status: "suspended",
            suspendedAt: new Date(),
            suspensionReason: `Admin override: ${input.reason}`,
          })
          .where(eq(stores.id, input.storeId));
      }

      // If removing restriction, reactivate store
      if (input.newBadgeType !== "restricted") {
        const [store] = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
        if (store && store.status === "suspended") {
          await db.update(stores)
            .set({ status: "active", suspendedAt: null, suspensionReason: null })
            .where(eq(stores.id, input.storeId));
        }
      }

      // Notify store owner
      const [store] = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
      if (store) {
        await notifyOwner({
          title: "Badge Updated",
          content: `Store #${input.storeId} badge updated to "${input.newBadgeType}" by admin. Reason: ${input.reason}`,
        });
      }

      return { success: true, badge: input.newBadgeType };
    }),

  /**
   * Get improvement tips based on current trust score components.
   * Helps merchants understand what to improve.
   */
  getImprovementTips: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const user = ctx.user as any;
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    if (!store) return [];

    const result = await calculateTrustScore(store.id);
    if (!result.isValid) {
      return [
        { priority: 1, area: "orders", tip: "Complete at least 3 orders to activate your trust score.", impact: "high" },
      ];
    }

    const tips: { priority: number; area: string; tip: string; impact: string }[] = [];

    // Identify weakest components
    const components = result.components;
    const sorted = Object.entries(components)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => a.value - b.value);

    for (const { key, value } of sorted.slice(0, 3)) {
      if (value >= 80) continue; // Already good
      switch (key) {
        case "postDeliveryRating":
          tips.push({
            priority: tips.length + 1,
            area: "ratings",
            tip: value < 50
              ? "Your delivery ratings are low. Ensure products match descriptions and arrive on time."
              : "Improve delivery experience to boost ratings. Consider better packaging.",
            impact: value < 50 ? "high" : "medium",
          });
          break;
        case "qualityVsDescription":
          tips.push({
            priority: tips.length + 1,
            area: "quality",
            tip: "Ensure product quality matches your descriptions. Use accurate photos and specifications.",
            impact: value < 50 ? "high" : "medium",
          });
          break;
        case "orderCompletionRate":
          tips.push({
            priority: tips.length + 1,
            area: "completion",
            tip: "Reduce order cancellations. Only list products you can reliably fulfill.",
            impact: value < 50 ? "high" : "medium",
          });
          break;
        case "ruleCompliance":
          tips.push({
            priority: tips.length + 1,
            area: "compliance",
            tip: "Review marketplace rules. Ensure all products meet listing requirements before submission.",
            impact: value < 50 ? "high" : "medium",
          });
          break;
        case "absenceOfComplaints":
          tips.push({
            priority: tips.length + 1,
            area: "complaints",
            tip: "Address customer complaints promptly. Proactive communication prevents escalation.",
            impact: value < 50 ? "high" : "medium",
          });
          break;
      }
    }

    return tips;
  }),
});
