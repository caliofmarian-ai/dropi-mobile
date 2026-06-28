/**
 * Pilot Rating Admin Router — Administrative Controls
 *
 * Provides admin endpoints for:
 * - Manual rating adjustments with justification
 * - Periodic rating recalculation for all pilots
 * - Rating history review and audit
 * - Pilot rating leaderboard
 */

import { router, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { pilotProfiles, pilotRatingHistory } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { onAdminRatingAdjustment, periodicRatingRecalculation } from "./pilot-rating-hooks";

export const pilotRatingAdminRouter = router({
  /**
   * Manually adjust a pilot's rating with justification.
   * Logs the adjustment in pilotRatingHistory for audit trail.
   */
  adjustRating: adminProcedure
    .input(z.object({
      userId: z.number(),
      adjustmentType: z.enum(["increase", "decrease"]),
      amount: z.number().min(0.1).max(2.0),
      justification: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      if (!user) throw new Error("Authentication required");

      const profile = await db.select().from(pilotProfiles)
        .where(eq(pilotProfiles.userId, input.userId))
        .limit(1);

      if (profile.length === 0) {
        throw new Error(`Pilot profile not found for user ID ${input.userId}`);
      }

      // Call the hook which handles the update and logging
      await onAdminRatingAdjustment(
        input.userId,
        input.adjustmentType,
        input.amount,
        input.justification,
        user.id
      );

      const currentRating = Number(profile[0].rating);
      const newRating = Math.max(0, Math.min(5, currentRating + (input.adjustmentType === "increase" ? input.amount : -input.amount)));

      return {
        success: true,
        message: `Rating adjusted successfully`,
        previousRating: currentRating,
        newRating,
      };
    }),

  /**
   * Get rating history for a specific pilot.
   * Shows all rating changes with reasons and details.
   */
  getRatingHistory: adminProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const history = await db.select().from(pilotRatingHistory)
        .where(eq(pilotRatingHistory.userId, input.userId))
        .orderBy(desc(pilotRatingHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db.select({ count: sql`count(*)` })
        .from(pilotRatingHistory)
        .where(eq(pilotRatingHistory.userId, input.userId));

      return {
        history: history.map(h => ({
          id: h.id,
          previousRating: Number(h.previousRating),
          newRating: Number(h.newRating),
          reason: h.reason,
          createdAt: h.createdAt,
          calculationDetails: h.calculationDetails,
        })),
        total: Number(total[0]?.count || 0),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get pilot rating leaderboard.
   * Shows top pilots by rating, with stats.
   */
  getLeaderboard: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
      minDeliveries: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const leaderboard = await db.select().from(pilotProfiles)
        .where(sql`${pilotProfiles.totalDeliveries} >= ${input.minDeliveries}`)
        .orderBy(desc(pilotProfiles.rating))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db.select({ count: sql`count(*)` })
        .from(pilotProfiles)
        .where(sql`${pilotProfiles.totalDeliveries} >= ${input.minDeliveries}`);

      return {
        leaderboard: leaderboard.map((p, idx) => ({
          rank: input.offset + idx + 1,
          userId: p.userId,
          rating: Number(p.rating),
          totalDeliveries: p.totalDeliveries,
          // totalB2b: p.totalB2b, // Field not in schema
          completionRate: Number(p.completionRate || 0),
          onTimeRate: Number(p.onTimeRate || 0),
          customerRating: Number(p.customerRating || 0),
          incidentRate: Number(p.incidentRate || 0),
          cosEligible: p.cosEligible,
        })),
        total: Number(total[0]?.count || 0),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get rating statistics across all pilots.
   * Useful for monitoring overall pilot quality.
   */
  getStats: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const allProfiles = await db.select().from(pilotProfiles);

      if (allProfiles.length === 0) {
        return {
          totalPilots: 0,
          avgRating: 0,
          medianRating: 0,
          minRating: 0,
          maxRating: 0,
          cosEligible: 0,
          ratingDistribution: {},
        };
      }

      const ratings = allProfiles.map(p => Number(p.rating)).sort((a, b) => a - b);
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const medianRating = ratings.length % 2 === 0
        ? (ratings[ratings.length / 2 - 1] + ratings[ratings.length / 2]) / 2
        : ratings[Math.floor(ratings.length / 2)];

      // Distribution: count pilots in each rating band
      const numRatings = allProfiles.map(p => Number(p.rating));
      const distribution = {
        "0.0-1.0": numRatings.filter(r => r >= 0 && r < 1).length,
        "1.0-2.0": numRatings.filter(r => r >= 1 && r < 2).length,
        "2.0-3.0": numRatings.filter(r => r >= 2 && r < 3).length,
        "3.0-4.0": numRatings.filter(r => r >= 3 && r < 4).length,
        "4.0-5.0": numRatings.filter(r => r >= 4 && r <= 5).length,
      };

      return {
        totalPilots: allProfiles.length,
        avgRating: Math.round(avgRating * 100) / 100,
        medianRating: Math.round(medianRating * 100) / 100,
        minRating: Math.min(...ratings),
        maxRating: Math.max(...ratings),
        cosEligible: allProfiles.filter(p => p.cosEligible).length,
        ratingDistribution: distribution,
      };
    }),

  /**
   * Trigger periodic rating recalculation for all pilots.
   * Should be called daily or on-demand by admin.
   */
  triggerPeriodicRecalculation: adminProcedure
    .mutation(async () => {
      try {
        await periodicRatingRecalculation();
        return {
          success: true,
          message: "Periodic rating recalculation triggered successfully",
        };
      } catch (error) {
        console.error("[Admin] Error triggering periodic recalculation:", error);
        throw new Error("Failed to trigger periodic recalculation");
      }
    }),

  /**
   * Reset a pilot's rating to initial state (3.0).
   * Use with caution — logs in audit trail.
   */
  resetRating: adminProcedure
    .input(z.object({
      userId: z.number(),
      justification: z.string().min(20).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      if (!user) throw new Error("Authentication required");

      const profile = await db.select().from(pilotProfiles)
        .where(eq(pilotProfiles.userId, input.userId))
        .limit(1);

      if (profile.length === 0) {
        throw new Error(`Pilot profile not found for user ID ${input.userId}`);
      }

      const previousRating = Number(profile[0].rating);
      const newRating = 3.0; // Initial rating

      // Update profile
      await db.update(pilotProfiles)
        .set({ rating: String(newRating) })
        .where(eq(pilotProfiles.userId, input.userId));

      // Log in history
      await db.insert(pilotRatingHistory).values({
        userId: input.userId,
        pilotProfileId: profile[0].id,
        previousRating: String(previousRating),
        newRating: String(newRating),
        reason: "admin_adjustment",
        deliveryId: null,
        deliveryType: null,
        calculationDetails: JSON.stringify({
          action: "rating_reset",
          justification: input.justification,
          adminId: user.id,
          timestamp: new Date().toISOString(),
        }),
      });

      return {
        success: true,
        message: `Pilot rating reset to ${newRating}`,
        previousRating,
        newRating,
      };
    }),
});
