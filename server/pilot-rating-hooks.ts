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
import { recalculateRating } from "./pilot-rating-engine";

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
    const result = await recalculateRating(pilotId, "delivery_completed", {
      deliveryId,
      deliveryType: "b2b",
      completedAt: new Date().toISOString(),
    });

    if (result.success) {
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
    const result = await recalculateRating(pilotId, "delivery_failed", {
      deliveryId,
      deliveryType: "b2b",
      failureReason: failureReason || "Unknown",
      failedAt: new Date().toISOString(),
    });

    if (result.success) {
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
    const result = await recalculateRating(pilotId, "delivery_completed", {
      deliveryId,
      deliveryType: "marketplace",
      completedAt: new Date().toISOString(),
    });

    if (result.success) {
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
    const result = await recalculateRating(pilotId, "delivery_failed", {
      deliveryId,
      deliveryType: "marketplace",
      failureReason: failureReason || "Unknown",
      failedAt: new Date().toISOString(),
    });

    if (result.success) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after marketplace delivery failure: ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on marketplace delivery failure for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called when a customer submits a review for a delivery.
 * Updates pilot's customerRating component and triggers recalculation.
 */
export async function onCustomerReviewSubmitted(pilotId: number, rating: number, reviewText?: string) {
  const db = await getDb();
  if (!db) return;

  try {
    if (rating < 1 || rating > 5) {
      console.warn(`[Rating Hook] Invalid review rating ${rating} for pilot ${pilotId}`);
      return;
    }

    // Recalculate pilot rating based on new review
    const result = await recalculateRating(pilotId, "customer_review", {
      reviewRating: rating,
      reviewText: reviewText || "",
      submittedAt: new Date().toISOString(),
    });

    if (result.success) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after customer review (${rating}/5): ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on customer review for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called when an incident is reported for a pilot.
 * Decreases pilot's incidentRate and triggers recalculation.
 */
export async function onIncidentReported(pilotId: number, incidentType: string, severity: "low" | "medium" | "high") {
  const db = await getDb();
  if (!db) return;

  try {
    // Recalculate pilot rating based on incident
    const result = await recalculateRating(pilotId, "incident_reported", {
      incidentType,
      severity,
      reportedAt: new Date().toISOString(),
    });

    if (result.success) {
      console.log(`[Rating] Pilot ${pilotId} rating updated after incident (${severity}): ${result.previousRating} → ${result.newRating}`);
    }
  } catch (error) {
    console.error(`[Rating Hook] Error on incident report for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called when admin manually adjusts a pilot's rating.
 * Logs the adjustment with justification for audit trail.
 */
export async function onAdminRatingAdjustment(
  pilotId: number,
  adjustmentType: "increase" | "decrease",
  amount: number,
  justification: string,
  adminId: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    const profile = await db.select().from(pilotProfiles)
      .where(eq(pilotProfiles.pilotId, pilotId))
      .limit(1);

    if (profile.length === 0) {
      console.warn(`[Rating Hook] Pilot profile not found for ${pilotId}`);
      return;
    }

    const previousRating = profile[0].rating;
    const newRating = Math.max(0, Math.min(5, previousRating + (adjustmentType === "increase" ? amount : -amount)));

    // Update pilot profile
    await db.update(pilotProfiles)
      .set({ rating: newRating })
      .where(eq(pilotProfiles.pilotId, pilotId));

    // Log in rating history
    await db.insert(pilotRatingHistory).values({
      pilotId,
      previousRating,
      newRating,
      reason: "admin_adjustment",
      deliveryId: null,
      deliveryType: null,
      calculationDetails: {
        adjustmentType,
        amount,
        justification,
        adminId,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`[Rating] Admin ${adminId} adjusted pilot ${pilotId} rating: ${previousRating} → ${newRating} (${justification})`);
  } catch (error) {
    console.error(`[Rating Hook] Error on admin adjustment for pilot ${pilotId}:`, error);
  }
}

/**
 * Hook: Called periodically (e.g., daily) to recalculate all pilot ratings.
 * Ensures ratings stay accurate based on latest delivery history.
 */
export async function periodicRatingRecalculation() {
  const db = await getDb();
  if (!db) return;

  try {
    console.log(`[Rating] Starting periodic rating recalculation for all pilots...`);

    const allPilots = await db.select().from(pilotProfiles);

    let updated = 0;
    for (const pilot of allPilots) {
      const result = await recalculateRating(pilot.pilotId, "periodic_recalculation");
      if (result.success && result.newRating !== result.previousRating) {
        updated++;
      }
    }

    console.log(`[Rating] Periodic recalculation complete: ${updated}/${allPilots.length} pilots updated`);
  } catch (error) {
    console.error(`[Rating] Error during periodic recalculation:`, error);
  }
}
