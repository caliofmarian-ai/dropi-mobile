/**
 * Pilot Rating Hooks — Real-time Rating Recalculation
 *
 * Implements automatic rating updates when:
 * - Delivery is completed (delivered status)
 * - Delivery fails (failed status)
 * - Customer submits review
 * - Admin manually adjusts rating
 *
 * Each hook calls recalculateRating() to update the pilot's composite score
 * and logs the change in pilotRatingHistory for audit trail.
 */

import { getDb } from "./db";
import { b2bDeliveries, pilotProfiles, pilotRatingHistory, deliveries } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { recalculateRating, RatingReason, RatingUpdateResult } from "./pilot-rating-engine";

/**
 * Hook: Called when a B2B delivery is completed (delivered status).
 * Updates pilot's completionRate and triggers recalculation.
 */
export async function onB2bDeliveryCompleted(deliveryId: number, pilotId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const delivery = await db.select().from(b2bDeliveries)
      .where(eq(b2bDeliveries.id, deliveryId))
      .limit(1);

    if (delivery.length === 0) return;

    // Recalculate pilot rating based on updated delivery history
    const result = await recalculateRating(pilotId, "delivery_completed", deliveryId, "b2b");

    if (result) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after B2B delivery completion: ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on B2B delivery completion for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called when a B2B delivery fails (failed status).
 * Updates pilot's failure rate and triggers recalculation.
 */
export async function onB2bDeliveryFailed(deliveryId: number, pilotId: number, failureReason?: string) {
  const db = await getDb();
  if (!db) return;

  try {
    const delivery = await db.select().from(b2bDeliveries)
      .where(eq(b2bDeliveries.id, deliveryId))
      .limit(1);

    if (delivery.length === 0) return;

    // Recalculate pilot rating based on failure
    const result = await recalculateRating(pilotId, "delivery_failed", deliveryId, "b2b");

    if (result) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after B2B delivery failure: ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on B2B delivery failure for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called when a marketplace delivery is completed.
 * Updates pilot's completionRate and triggers recalculation.
 */
export async function onMarketplaceDeliveryCompleted(deliveryId: number, pilotId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const delivery = await db.select().from(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .limit(1);

    if (delivery.length === 0) return;

    // Recalculate pilot rating based on updated delivery history
    const result = await recalculateRating(pilotId, "delivery_completed", deliveryId, "marketplace");

    if (result) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after marketplace delivery completion: ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on marketplace delivery completion for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called when a marketplace delivery fails.
 * Updates pilot's failure rate and triggers recalculation.
 */
export async function onMarketplaceDeliveryFailed(deliveryId: number, pilotId: number, failureReason?: string) {
  const db = await getDb();
  if (!db) return;

  try {
    const delivery = await db.select().from(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .limit(1);

    if (delivery.length === 0) return;

    // Recalculate pilot rating based on failure
    const result = await recalculateRating(pilotId, "delivery_failed", deliveryId, "marketplace");

    if (result) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after marketplace delivery failure: ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on marketplace delivery failure for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called when a customer submits a review for a pilot.
 * Updates customerRating component and triggers recalculation.
 */
export async function onCustomerReviewSubmitted(pilotId: number, reviewRating: number, reviewText?: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Recalculate pilot rating based on new customer review
    const result = await recalculateRating(pilotId, "customer_review");

    if (result) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after customer review: ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on customer review for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called when an incident is reported against a pilot.
 * Updates incidentRate component and triggers recalculation.
 */
export async function onIncidentReported(pilotId: number, incidentType: string, severity: "low" | "medium" | "high") {
  const db = await getDb();
  if (!db) return;

  try {
    // Recalculate pilot rating based on incident
    const result = await recalculateRating(pilotId, "incident_reported");

    if (result) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after incident (${severity}): ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on incident report for pilot ${pilotId}:`, error);
  }
}

/**
 * Periodic rating recalculation job.
 * Should be called daily to recalculate all pilot ratings based on latest stats.
 * Useful for catching any missed updates and ensuring data consistency.
 */
export async function periodicRatingRecalculation() {
  const db = await getDb();
  if (!db) return;

  try {
    const allProfiles = await db.select().from(pilotProfiles);

    let updated = 0;
    let errors = 0;

    for (const profile of allProfiles) {
      try {
        const result = await recalculateRating(profile.userId, "periodic_recalculation");
        if (result) {
          updated++;
        }
      } catch (error) {
        console.error(`[Periodic Recalc] Error for pilot ${profile.userId}:`, error);
        errors++;
      }
    }

    console.log(`[Periodic Recalc] Completed: ${updated} updated, ${errors} errors`);
  } catch (error) {
    console.error(`[Periodic Recalc] Fatal error:`, error);
  }
}

/**
 * Admin manual rating adjustment.
 * Adjusts rating by a specified amount with justification.
 * Logs the adjustment in pilotRatingHistory for audit trail.
 */
export async function onAdminRatingAdjustment(
  pilotId: number,
  adjustmentType: "increase" | "decrease",
  amount: number,
  justification: string,
  adminUserId: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    const profile = await db.select().from(pilotProfiles)
      .where(eq(pilotProfiles.userId, pilotId))
      .limit(1);

    if (profile.length === 0) return;

    const currentRating = parseFloat(profile[0].rating);
    const adjustment = adjustmentType === "increase" ? amount : -amount;
    const newRatingValue = Math.max(0, Math.min(5, currentRating + adjustment));
    const newRating = newRatingValue.toFixed(2);

    // Update profile
    await db.update(pilotProfiles)
      .set({ rating: newRating })
      .where(eq(pilotProfiles.userId, pilotId));

    // Log in history
    await db.insert(pilotRatingHistory).values({
      pilotProfileId: profile[0].id,
      userId: pilotId,
      previousRating: profile[0].rating,
      newRating,
      reason: "admin_adjustment",
      deliveryId: null,
      deliveryType: null,
      calculationDetails: JSON.stringify({
        action: "admin_adjustment",
        adjustmentType,
        amount,
        justification,
        adminUserId,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log(`[Admin] Pilot ${pilotId} rating adjusted: ${currentRating} → ${newRating} (${justification})`);
  } catch (error) {
    console.error(`[Admin Adjustment] Error for pilot ${pilotId}:`, error);
  }
}
