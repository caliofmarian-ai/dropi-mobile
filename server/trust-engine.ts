/**
 * DROPi Trust Score Engine — Sprint C
 * 
 * Implements the trust score calculation formula from Blueprint Section 7.2:
 * 
 * 5 Components (weighted):
 * 1. Evaluări post-livrare (35%) — average overall rating / 5 × 100
 * 2. Calitate vs. descriere (20%) — quality ratings ≥ 4 / total × 100
 * 3. Rata comenzi finalizate (20%) — completed / total orders × 100
 * 4. Conformitate reguli (15%) — 100 - (active penalties × 10)
 * 5. Absența reclamațiilor (10%) — 100 - (validated complaints / total orders × 100)
 * 
 * Rules:
 * - Minimum 3 completed orders for valid score (otherwise: "new_activity" badge)
 * - Score is weighted average of 5 components (0-100)
 * - Cannot be manually modified (only via audited admin override)
 * - Recalculated on each relevant event + daily reconciliation job
 * 
 * Badge Assignment (Section 7.3):
 * - "high_trust" (green): Score ≥ 85 AND orders ≥ 20 AND 0 validated complaints in last 90 days
 * - "new_activity" (blue): Completed orders < 5
 * - "high_risk" (yellow): Score < 40 OR ≥ 3 validated complaints in last 30 days
 * - "restricted" (red): Active suspension (auto or manual)
 * 
 * Priority: restricted > high_risk > new_activity > high_trust
 * 
 * Natural Elimination (Section 7.4):
 * - Level 1 (Warning): Score < 40 for 7 days → notification + "high_risk" badge
 * - Level 2 (Restricted): Score < 30 for 30 days → reduced visibility
 * - Level 3 (Suspended): ≥ 3 validated non-conformity reports OR Score < 20 → 30-day suspension
 * - Level 4 (Removed): Safety violations OR ≥ 3 suspensions → marketplace access removed
 */

import { getDb } from "./db";
import { stores, products, productReviews, sellerBadges, storeAnalytics, orders } from "../drizzle/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";

// ===== TYPES =====

export interface TrustScoreComponents {
  postDeliveryRating: number;    // 0-100
  qualityVsDescription: number;  // 0-100
  orderCompletionRate: number;   // 0-100
  ruleCompliance: number;        // 0-100
  absenceOfComplaints: number;   // 0-100
}

export interface TrustScoreResult {
  score: number;                 // 0-100 final weighted score
  components: TrustScoreComponents;
  isValid: boolean;              // false if < 3 completed orders
  totalOrders: number;
  completedOrders: number;
  badge: "high_trust" | "new_activity" | "high_risk" | "restricted";
  eliminationLevel: 0 | 1 | 2 | 3 | 4;
  eliminationReason?: string;
}

export interface EliminationAction {
  level: 0 | 1 | 2 | 3 | 4;
  action: "none" | "warning" | "reduce_visibility" | "suspend" | "remove";
  reason: string;
  daysAtRisk: number;
}

// ===== WEIGHTS =====
const WEIGHTS = {
  postDeliveryRating: 0.35,
  qualityVsDescription: 0.20,
  orderCompletionRate: 0.20,
  ruleCompliance: 0.15,
  absenceOfComplaints: 0.10,
};

// ===== TRUST SCORE CALCULATION =====

/**
 * Calculate trust score for a store based on all available data.
 * This is the main entry point for trust calculation.
 */
export async function calculateTrustScore(storeId: number): Promise<TrustScoreResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch store data
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) {
    return {
      score: 0,
      components: { postDeliveryRating: 0, qualityVsDescription: 0, orderCompletionRate: 0, ruleCompliance: 0, absenceOfComplaints: 0 },
      isValid: false,
      totalOrders: 0,
      completedOrders: 0,
      badge: "new_activity",
      eliminationLevel: 0,
    };
  }

  // Fetch reviews for this store
  const reviews = await db.select().from(productReviews).where(eq(productReviews.storeId, storeId));

  // Canonical Marketplace lifecycle rows are the authoritative order evidence.
  // Pre-calculated analytics remain useful for reporting, but must not override live order truth.
  const marketplaceOrders = await db.select({ status: orders.status })
    .from(orders)
    .where(eq(orders.merchantId, store.ownerId));
  const totalOrders = marketplaceOrders.length;
  const completedOrders = marketplaceOrders.filter((order) => order.status === "completed").length;
  const cancelledOrders = marketplaceOrders.filter((order) => order.status === "cancelled").length;

  // Check minimum threshold
  if (completedOrders < 3) {
    return {
      score: 0,
      components: { postDeliveryRating: 0, qualityVsDescription: 0, orderCompletionRate: 0, ruleCompliance: 0, absenceOfComplaints: 0 },
      isValid: false,
      totalOrders,
      completedOrders,
      badge: "new_activity",
      eliminationLevel: 0,
    };
  }

  // Component 1: Post-delivery ratings (35%)
  const totalRatingSum = reviews.reduce((sum, r) => sum + r.overallRating, 0);
  const maxPossibleRating = reviews.length * 5;
  const postDeliveryRating = maxPossibleRating > 0
    ? Math.round((totalRatingSum / maxPossibleRating) * 100)
    : 50; // Default neutral if no reviews yet

  // Component 2: Quality vs Description (20%)
  const qualityPositive = reviews.filter(r => r.qualityRating >= 4).length;
  const qualityVsDescription = reviews.length > 0
    ? Math.round((qualityPositive / reviews.length) * 100)
    : 50; // Default neutral

  // Component 3: Order completion rate (20%)
  const orderCompletionRate = totalOrders > 0
    ? Math.round((completedOrders / totalOrders) * 100)
    : 100; // Perfect if no orders yet

  // Component 4: Rule compliance (15%)
  // Count active penalties (rejected products, moderation failures)
  const rejectedProducts = await db.select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(
      eq(products.storeId, storeId),
      eq(products.status, "rejected")
    ));
  const activePenalties = rejectedProducts[0]?.count || 0;
  const ruleCompliance = Math.max(0, 100 - (activePenalties * 10));

  // Component 5: Absence of complaints (10%)
  // Validated complaints = reviews with overallRating <= 2 (as proxy for complaints)
  const complaints = reviews.filter(r => r.overallRating <= 2).length;
  const absenceOfComplaints = totalOrders > 0
    ? Math.max(0, Math.round(100 - (complaints / totalOrders * 100)))
    : 100;

  const components: TrustScoreComponents = {
    postDeliveryRating,
    qualityVsDescription,
    orderCompletionRate,
    ruleCompliance,
    absenceOfComplaints,
  };

  // Calculate weighted score
  const score = Math.round(
    components.postDeliveryRating * WEIGHTS.postDeliveryRating +
    components.qualityVsDescription * WEIGHTS.qualityVsDescription +
    components.orderCompletionRate * WEIGHTS.orderCompletionRate +
    components.ruleCompliance * WEIGHTS.ruleCompliance +
    components.absenceOfComplaints * WEIGHTS.absenceOfComplaints
  );

  // Determine badge
  const badge = determineBadge(score, completedOrders, complaints, store.status === "suspended");

  // Determine elimination level
  const elimination = determineEliminationLevel(score, store, complaints);

  return {
    score,
    components,
    isValid: true,
    totalOrders,
    completedOrders,
    badge,
    eliminationLevel: elimination.level,
    eliminationReason: elimination.reason,
  };
}

// ===== BADGE DETERMINATION =====

function determineBadge(
  score: number,
  completedOrders: number,
  recentComplaints: number,
  isSuspended: boolean
): "high_trust" | "new_activity" | "high_risk" | "restricted" {
  // Priority: restricted > high_risk > new_activity > high_trust

  if (isSuspended) return "restricted";

  if (score < 40 || recentComplaints >= 3) return "high_risk";

  if (completedOrders < 5) return "new_activity";

  if (score >= 85 && completedOrders >= 20 && recentComplaints === 0) return "high_trust";

  // Default: new_activity if between thresholds
  return "new_activity";
}

// ===== ELIMINATION MECHANISM =====

function determineEliminationLevel(
  score: number,
  store: any,
  validatedComplaints: number
): EliminationAction {
  // Level 4: Safety violations or ≥ 3 suspensions
  // (We track suspensions via store history — for now check if currently suspended with multiple reasons)
  if (store.status === "suspended" && store.suspensionReason?.includes("repeated")) {
    return { level: 4, action: "remove", reason: "Repeated suspensions — marketplace access removed", daysAtRisk: 0 };
  }

  // Level 3: ≥ 3 validated non-conformity reports OR Score < 20
  if (validatedComplaints >= 3 || score < 20) {
    return { level: 3, action: "suspend", reason: `Score ${score} < 20 or ${validatedComplaints} validated complaints`, daysAtRisk: 0 };
  }

  // Level 2: Score < 30 for extended period (30 days)
  // Simplified: if score < 30 and store has been active > 30 days
  if (score < 30) {
    const daysSinceCreation = Math.floor((Date.now() - new Date(store.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation > 30) {
      return { level: 2, action: "reduce_visibility", reason: `Score ${score} < 30 for extended period — visibility reduced`, daysAtRisk: daysSinceCreation };
    }
  }

  // Level 1: Score < 40 for 7+ days
  if (score < 40) {
    const daysSinceCreation = Math.floor((Date.now() - new Date(store.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation > 7) {
      return { level: 1, action: "warning", reason: `Score ${score} < 40 — warning issued, badge "high_risk" applied`, daysAtRisk: daysSinceCreation };
    }
  }

  // Level 0: No issues
  return { level: 0, action: "none", reason: "", daysAtRisk: 0 };
}

// ===== UPDATE STORE TRUST SCORE & BADGE =====

/**
 * Recalculate and persist trust score + badge for a store.
 * Called after relevant events (new review, order completion, etc.) and by daily job.
 */
export async function updateStoreTrustScore(storeId: number): Promise<TrustScoreResult> {
  const result = await calculateTrustScore(storeId);
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update store trustScore
  await db.update(stores)
    .set({ trustScore: result.score })
    .where(eq(stores.id, storeId));

  // Deactivate all current badges for this store
  await db.update(sellerBadges)
    .set({ isActive: false })
    .where(and(eq(sellerBadges.storeId, storeId), eq(sellerBadges.isActive, true)));

  // Insert new active badge
  await db.insert(sellerBadges).values({
    storeId,
    type: result.badge,
    reason: result.isValid
      ? `Auto-calculated: Score ${result.score}/100 (${result.badge})`
      : "Insufficient data: fewer than 3 completed orders",
    isActive: true,
  });

  // Apply elimination actions if needed
  if (result.eliminationLevel >= 3 && result.eliminationLevel <= 4) {
    // Suspend the store
    await db.update(stores)
      .set({
        status: "suspended",
        suspendedAt: new Date(),
        suspensionReason: result.eliminationReason || "Trust score below threshold",
      })
      .where(eq(stores.id, storeId));
  }

  return result;
}

// ===== BATCH RECALCULATION (Daily Job) =====

/**
 * Recalculate trust scores for all active stores.
 * Intended to be called by a scheduled job (daily).
 */
export async function recalculateAllTrustScores(): Promise<{ processed: number; updated: number; errors: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allStores = await db.select({ id: stores.id })
    .from(stores)
    .where(eq(stores.status, "active"));

  let processed = 0;
  let updated = 0;
  let errors = 0;

  for (const store of allStores) {
    try {
      const result = await updateStoreTrustScore(store.id);
      processed++;
      if (result.isValid) updated++;
    } catch (err) {
      errors++;
      console.error(`[TrustEngine] Error recalculating store ${store.id}:`, err);
    }
  }

  return { processed, updated, errors };
}

// ===== TRUST SCORE ROUTER ENDPOINTS =====

/**
 * Get trust score details for a specific store (used by merchant dashboard).
 */
export async function getStoreTrustDetails(storeId: number): Promise<TrustScoreResult> {
  return calculateTrustScore(storeId);
}

/**
 * Get badge history for a store (all badges, active and inactive).
 */
export async function getStoreBadgeHistory(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(sellerBadges)
    .where(eq(sellerBadges.storeId, storeId))
    .orderBy(desc(sellerBadges.issuedAt));
}
