/**
 * DROPi Pilot Rating Engine
 * 
 * Canonical reference: Delivery_Multimodal §5 — Selecția pilotului
 * "Selecția este făcută de sistem pe baza: eligibilității tehnice,
 *  poziționării, ratingului, istoricului de livrări, mecanismelor de rotație."
 * 
 * Rating Formula (Blueprint §6.1):
 *   rating = (0.40 × completionRate/100)×5
 *          + (0.25 × onTimeRate/100)×5
 *          + (0.20 × customerRating)
 *          + (0.15 × (1 - incidentRate/100))×5
 * 
 * Protections (Cap. 6, §6.5.3 DSS):
 * - Rating cannot be manually influenced by any actor
 * - Calculation is deterministic and audited
 * - Every change generates a pilotRatingHistory entry
 * - New pilots start at 0.00, need 10+ deliveries for COS eligibility
 */

import { getDb } from "./db";
import { pilotProfiles, pilotRatingHistory, deliveries, b2bDeliveries, users } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// ===== RATING WEIGHTS (Blueprint §6.1) =====
const WEIGHTS = {
  completionRate: 0.40,
  onTimeRate: 0.25,
  customerRating: 0.20,
  incidentFreeRate: 0.15,
} as const;

// ===== COS ELIGIBILITY THRESHOLDS =====
const COS_MIN_DELIVERIES = 10; // Minimum deliveries to be COS eligible
const COS_DEFAULT_MIN_RATING = 4.00; // Default minimum rating for COS manual selection

// ===== TYPES =====
export type RatingReason =
  | "delivery_completed"
  | "delivery_failed"
  | "delivery_late"
  | "customer_review"
  | "incident_reported"
  | "periodic_recalculation"
  | "admin_adjustment"
  | "initial_calculation";

export interface RatingUpdateResult {
  pilotProfileId: number;
  userId: number;
  previousRating: string;
  newRating: string;
  reason: RatingReason;
  cosEligible: boolean;
}

// ===== CORE RATING CALCULATION =====

/**
 * Calculate the composite rating from component scores.
 * Returns a value between 0.00 and 5.00.
 */
export function calculateCompositeRating(components: {
  completionRate: number; // 0-100
  onTimeRate: number;     // 0-100
  customerRating: number; // 0-5
  incidentRate: number;   // 0-100
}): number {
  const score =
    (WEIGHTS.completionRate * (components.completionRate / 100) * 5) +
    (WEIGHTS.onTimeRate * (components.onTimeRate / 100) * 5) +
    (WEIGHTS.customerRating * components.customerRating) +
    (WEIGHTS.incidentFreeRate * (1 - components.incidentRate / 100) * 5);

  // Clamp to [0.00, 5.00]
  return Math.max(0, Math.min(5, Math.round(score * 100) / 100));
}

/**
 * Recalculate a pilot's rating based on their current profile stats.
 * Updates the profile and logs the change in pilotRatingHistory.
 */
export async function recalculateRating(
  userId: number,
  reason: RatingReason,
  deliveryId?: number,
  deliveryType?: "marketplace" | "b2b"
): Promise<RatingUpdateResult | null> {
  const db = await getDb();
  if (!db) return null;

  // Get current profile
  const [profile] = await db
    .select()
    .from(pilotProfiles)
    .where(eq(pilotProfiles.userId, userId))
    .limit(1);

  if (!profile) return null;

  const previousRating = profile.rating;

  // Calculate new rating
  const newRatingValue = calculateCompositeRating({
    completionRate: parseFloat(profile.completionRate || "100"),
    onTimeRate: parseFloat(profile.onTimeRate || "100"),
    customerRating: parseFloat(profile.customerRating || "5"),
    incidentRate: parseFloat(profile.incidentRate || "0"),
  });

  const newRating = newRatingValue.toFixed(2);

  // Determine COS eligibility
  const cosEligible = profile.totalDeliveries >= COS_MIN_DELIVERIES &&
    newRatingValue >= parseFloat(profile.cosMinRating || String(COS_DEFAULT_MIN_RATING));

  // Update profile
  await db
    .update(pilotProfiles)
    .set({
      rating: newRating,
      cosEligible,
    })
    .where(eq(pilotProfiles.id, profile.id));

  // Log rating change in history (audit trail)
  await db.insert(pilotRatingHistory).values({
    pilotProfileId: profile.id,
    userId,
    previousRating: previousRating,
    newRating: newRating,
    reason,
    deliveryId: deliveryId || null,
    deliveryType: deliveryType || null,
    calculationDetails: JSON.stringify({
      weights: WEIGHTS,
      components: {
        completionRate: parseFloat(profile.completionRate || "100"),
        onTimeRate: parseFloat(profile.onTimeRate || "100"),
        customerRating: parseFloat(profile.customerRating || "5"),
        incidentRate: parseFloat(profile.incidentRate || "0"),
      },
      totalDeliveries: profile.totalDeliveries,
      cosMinRating: parseFloat(profile.cosMinRating || String(COS_DEFAULT_MIN_RATING)),
      cosEligible,
    }),
  });

  return {
    pilotProfileId: profile.id,
    userId,
    previousRating,
    newRating,
    reason,
    cosEligible,
  };
}

// ===== EVENT HOOKS =====

/**
 * Called when a delivery is completed successfully.
 * Updates stats and recalculates rating.
 */
export async function onDeliveryCompleted(
  pilotUserId: number,
  deliveryId: number,
  deliveryType: "marketplace" | "b2b",
  wasOnTime: boolean = true
): Promise<RatingUpdateResult | null> {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db
    .select()
    .from(pilotProfiles)
    .where(eq(pilotProfiles.userId, pilotUserId))
    .limit(1);

  if (!profile) return null;

  // Update statistics
  const newTotal = profile.totalDeliveries + 1;
  const newB2b = deliveryType === "b2b" ? profile.totalB2bDeliveries + 1 : profile.totalB2bDeliveries;

  // Recalculate completion rate
  const newCompletionRate = ((newTotal - profile.totalFailedDeliveries) / newTotal) * 100;

  // Recalculate on-time rate
  const currentOnTime = parseFloat(profile.onTimeRate || "100");
  const prevOnTimeCount = Math.round((currentOnTime / 100) * profile.totalDeliveries);
  const newOnTimeCount = wasOnTime ? prevOnTimeCount + 1 : prevOnTimeCount;
  const newOnTimeRate = newTotal > 0 ? (newOnTimeCount / newTotal) * 100 : 100;

  await db
    .update(pilotProfiles)
    .set({
      totalDeliveries: newTotal,
      totalB2bDeliveries: newB2b,
      completionRate: newCompletionRate.toFixed(2),
      onTimeRate: newOnTimeRate.toFixed(2),
      lastDeliveryAt: new Date(),
    })
    .where(eq(pilotProfiles.id, profile.id));

  return recalculateRating(pilotUserId, "delivery_completed", deliveryId, deliveryType);
}

/**
 * Called when a delivery fails due to pilot fault.
 * Updates stats and recalculates rating.
 */
export async function onDeliveryFailed(
  pilotUserId: number,
  deliveryId: number,
  deliveryType: "marketplace" | "b2b"
): Promise<RatingUpdateResult | null> {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db
    .select()
    .from(pilotProfiles)
    .where(eq(pilotProfiles.userId, pilotUserId))
    .limit(1);

  if (!profile) return null;

  // Update statistics
  const newTotal = profile.totalDeliveries + 1;
  const newFailed = profile.totalFailedDeliveries + 1;
  const newCompletionRate = ((newTotal - newFailed) / newTotal) * 100;

  // Increase incident rate
  const currentIncidentRate = parseFloat(profile.incidentRate || "0");
  const prevIncidentCount = Math.round((currentIncidentRate / 100) * profile.totalDeliveries);
  const newIncidentRate = newTotal > 0 ? ((prevIncidentCount + 1) / newTotal) * 100 : 0;

  await db
    .update(pilotProfiles)
    .set({
      totalDeliveries: newTotal,
      totalFailedDeliveries: newFailed,
      completionRate: newCompletionRate.toFixed(2),
      incidentRate: newIncidentRate.toFixed(2),
      lastDeliveryAt: new Date(),
    })
    .where(eq(pilotProfiles.id, profile.id));

  return recalculateRating(pilotUserId, "delivery_failed", deliveryId, deliveryType);
}

/**
 * Called when a delivery is completed late (not on time).
 */
export async function onDeliveryLate(
  pilotUserId: number,
  deliveryId: number,
  deliveryType: "marketplace" | "b2b"
): Promise<RatingUpdateResult | null> {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db
    .select()
    .from(pilotProfiles)
    .where(eq(pilotProfiles.userId, pilotUserId))
    .limit(1);

  if (!profile) return null;

  // Decrease on-time rate
  const currentOnTime = parseFloat(profile.onTimeRate || "100");
  const prevOnTimeCount = Math.round((currentOnTime / 100) * profile.totalDeliveries);
  const newOnTimeRate = profile.totalDeliveries > 0
    ? (prevOnTimeCount / (profile.totalDeliveries + 1)) * 100
    : 100;

  await db
    .update(pilotProfiles)
    .set({
      onTimeRate: newOnTimeRate.toFixed(2),
    })
    .where(eq(pilotProfiles.id, profile.id));

  return recalculateRating(pilotUserId, "delivery_late", deliveryId, deliveryType);
}

/**
 * Called when a customer submits a review for a pilot.
 * Updates the rolling average customer rating.
 */
export async function onCustomerReview(
  pilotUserId: number,
  reviewScore: number, // 1-5
  deliveryId?: number,
  deliveryType?: "marketplace" | "b2b"
): Promise<RatingUpdateResult | null> {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db
    .select()
    .from(pilotProfiles)
    .where(eq(pilotProfiles.userId, pilotUserId))
    .limit(1);

  if (!profile) return null;

  // Rolling average: new_avg = (old_avg * n + new_score) / (n + 1)
  // Use totalDeliveries as proxy for review count (simplified)
  const currentAvg = parseFloat(profile.customerRating || "5");
  const n = Math.max(1, profile.totalDeliveries);
  const newAvg = (currentAvg * n + reviewScore) / (n + 1);

  await db
    .update(pilotProfiles)
    .set({
      customerRating: Math.max(1, Math.min(5, newAvg)).toFixed(2),
    })
    .where(eq(pilotProfiles.id, profile.id));

  return recalculateRating(pilotUserId, "customer_review", deliveryId, deliveryType);
}

/**
 * Called when an incident is reported against a pilot.
 */
export async function onIncidentReported(
  pilotUserId: number,
  deliveryId?: number,
  deliveryType?: "marketplace" | "b2b"
): Promise<RatingUpdateResult | null> {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db
    .select()
    .from(pilotProfiles)
    .where(eq(pilotProfiles.userId, pilotUserId))
    .limit(1);

  if (!profile) return null;

  // Increase incident rate
  const currentIncidentRate = parseFloat(profile.incidentRate || "0");
  const prevIncidentCount = Math.round((currentIncidentRate / 100) * Math.max(1, profile.totalDeliveries));
  const newIncidentRate = profile.totalDeliveries > 0
    ? ((prevIncidentCount + 1) / profile.totalDeliveries) * 100
    : 100;

  await db
    .update(pilotProfiles)
    .set({
      incidentRate: Math.min(100, newIncidentRate).toFixed(2),
    })
    .where(eq(pilotProfiles.id, profile.id));

  return recalculateRating(pilotUserId, "incident_reported", deliveryId, deliveryType);
}

// ===== PROFILE MANAGEMENT =====

/**
 * Create or get a pilot profile for a delivery_partner user.
 * Called automatically when a user becomes a delivery_partner.
 */
export async function ensurePilotProfile(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if profile exists
  const [existing] = await db
    .select({ id: pilotProfiles.id })
    .from(pilotProfiles)
    .where(eq(pilotProfiles.userId, userId))
    .limit(1);

  if (existing) return existing.id;

  // Create new profile with initial values
  const [result] = await db.insert(pilotProfiles).values({
    userId,
    rating: "0.00",
    completionRate: "100.00",
    onTimeRate: "100.00",
    incidentRate: "0.00",
    customerRating: "5.00",
    totalDeliveries: 0,
    totalB2bDeliveries: 0,
    totalFailedDeliveries: 0,
    isAvailable: false,
    cosEligible: false,
    cosMinRating: String(COS_DEFAULT_MIN_RATING),
    assignmentCount24h: 0,
    maxWeightGrams: 5000,
  });

  // Log initial calculation
  await db.insert(pilotRatingHistory).values({
    pilotProfileId: result.insertId,
    userId,
    previousRating: "0.00",
    newRating: "0.00",
    reason: "initial_calculation",
    calculationDetails: JSON.stringify({
      note: "Profile created with initial values. Rating will be calculated after first delivery.",
    }),
  });

  return result.insertId;
}

/**
 * Update pilot availability status and position.
 */
export async function updatePilotAvailability(
  userId: number,
  isAvailable: boolean,
  lat?: number,
  lng?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const updateData: Record<string, any> = { isAvailable };
  if (lat !== undefined && lng !== undefined) {
    updateData.currentLat = lat.toFixed(8);
    updateData.currentLng = lng.toFixed(8);
    updateData.lastPositionUpdate = new Date();
  }

  await db
    .update(pilotProfiles)
    .set(updateData)
    .where(eq(pilotProfiles.userId, userId));

  return true;
}

// ===== AUTOMATIC SELECTION ALGORITHM (C1) =====

/**
 * Scoring formula for automatic pilot selection (Blueprint §4.2):
 *   score = (0.30 × proximityScore)
 *         + (0.30 × ratingScore)
 *         + (0.25 × completionScore)
 *         + (0.15 × rotationBonus)
 */
const SELECTION_WEIGHTS = {
  proximity: 0.30,
  rating: 0.30,
  completion: 0.25,
  rotation: 0.15,
} as const;

const MAX_RADIUS_KM = 15; // Maximum search radius
const MAX_ASSIGNMENTS_24H = 20; // Max assignments in 24h for rotation fairness

/**
 * Calculate distance between two GPS coordinates (Haversine formula).
 * Returns distance in kilometers.
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface PilotCandidate {
  userId: number;
  profileId: number;
  name: string;
  rating: number;
  completionRate: number;
  totalDeliveries: number;
  vehicleTypes: string[];
  distanceKm: number;
  score: number;
  isAvailable: boolean;
  assignmentCount24h: number;
  lastAssignedAt: Date | null;
}

/**
 * Get the automatically selected pilot for a delivery (C1 Marketplace).
 * Returns the top-scored candidate based on proximity, rating, completion, and rotation.
 * 
 * Canonical: "Pilotul NU este ales «primul care apasă». Selecția este făcută de sistem."
 */
export async function getAutoSelectedPilot(
  pickupLat: number,
  pickupLng: number,
  requiredVehicleType?: string,
  zone?: string
): Promise<PilotCandidate | null> {
  const db = await getDb();
  if (!db) return null;

  // Get all available, active pilots with profiles
  const pilots = await db
    .select({
      userId: users.id,
      name: users.name,
      profileId: pilotProfiles.id,
      rating: pilotProfiles.rating,
      completionRate: pilotProfiles.completionRate,
      totalDeliveries: pilotProfiles.totalDeliveries,
      vehicleTypes: pilotProfiles.vehicleTypes,
      currentLat: pilotProfiles.currentLat,
      currentLng: pilotProfiles.currentLng,
      isAvailable: pilotProfiles.isAvailable,
      assignmentCount24h: pilotProfiles.assignmentCount24h,
      lastAssignedAt: pilotProfiles.lastAssignedAt,
      isActive: users.isActive,
    })
    .from(pilotProfiles)
    .innerJoin(users, eq(users.id, pilotProfiles.userId))
    .where(
      and(
        eq(pilotProfiles.isAvailable, true),
        eq(users.isActive, true),
        eq(users.dropiRole, "delivery_partner")
      )
    );

  if (pilots.length === 0) return null;

  // Score each pilot
  const candidates: PilotCandidate[] = [];

  for (const pilot of pilots) {
    // Skip if no position data
    if (!pilot.currentLat || !pilot.currentLng) continue;

    const pilotLat = parseFloat(pilot.currentLat);
    const pilotLng = parseFloat(pilot.currentLng);
    const distance = haversineDistance(pickupLat, pickupLng, pilotLat, pilotLng);

    // Skip if outside max radius
    if (distance > MAX_RADIUS_KM) continue;

    // Check vehicle type compatibility
    const vehicleTypes: string[] = Array.isArray(pilot.vehicleTypes) ? pilot.vehicleTypes : [];
    if (requiredVehicleType && vehicleTypes.length > 0 && !vehicleTypes.includes(requiredVehicleType)) {
      continue;
    }

    // Calculate scores
    const proximityScore = Math.max(0, 1 - (distance / MAX_RADIUS_KM));
    const ratingScore = parseFloat(pilot.rating || "0") / 5.0;
    const completionScore = parseFloat(pilot.completionRate || "100") / 100.0;
    const rotationBonus = Math.max(0, 1 - ((pilot.assignmentCount24h || 0) / MAX_ASSIGNMENTS_24H));

    // Composite score
    const score =
      (SELECTION_WEIGHTS.proximity * proximityScore) +
      (SELECTION_WEIGHTS.rating * ratingScore) +
      (SELECTION_WEIGHTS.completion * completionScore) +
      (SELECTION_WEIGHTS.rotation * rotationBonus);

    candidates.push({
      userId: pilot.userId,
      profileId: pilot.profileId,
      name: pilot.name || "Unknown Pilot",
      rating: parseFloat(pilot.rating || "0"),
      completionRate: parseFloat(pilot.completionRate || "100"),
      totalDeliveries: pilot.totalDeliveries,
      vehicleTypes,
      distanceKm: Math.round(distance * 10) / 10,
      score: Math.round(score * 1000) / 1000,
      isAvailable: pilot.isAvailable,
      assignmentCount24h: pilot.assignmentCount24h || 0,
      lastAssignedAt: pilot.lastAssignedAt,
    });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  return candidates[0] || null;
}

// ===== MANUAL SELECTION (C2/C3 COS) =====

/**
 * Get eligible pilots for manual selection in C2/C3 COS channels.
 * Only returns pilots with rating >= cosMinRating AND cosEligible = TRUE.
 * 
 * Canonical: "COS oferă entității control asupra fluxului (logic)"
 * Condition: "rating bun" (good rating) — defined as >= cosMinRating (default 4.00)
 */
export async function getEligiblePilotsForCOS(
  pickupLat?: number,
  pickupLng?: number,
  vehicleTypeFilter?: string,
  zoneFilter?: string
): Promise<PilotCandidate[]> {
  const db = await getDb();
  if (!db) return [];

  // Get COS-eligible pilots
  const pilots = await db
    .select({
      userId: users.id,
      name: users.name,
      profileId: pilotProfiles.id,
      rating: pilotProfiles.rating,
      completionRate: pilotProfiles.completionRate,
      totalDeliveries: pilotProfiles.totalDeliveries,
      vehicleTypes: pilotProfiles.vehicleTypes,
      currentLat: pilotProfiles.currentLat,
      currentLng: pilotProfiles.currentLng,
      isAvailable: pilotProfiles.isAvailable,
      assignmentCount24h: pilotProfiles.assignmentCount24h,
      lastAssignedAt: pilotProfiles.lastAssignedAt,
      cosMinRating: pilotProfiles.cosMinRating,
      isActive: users.isActive,
      zone: users.zone,
    })
    .from(pilotProfiles)
    .innerJoin(users, eq(users.id, pilotProfiles.userId))
    .where(
      and(
        eq(pilotProfiles.cosEligible, true),
        eq(users.isActive, true),
        eq(users.dropiRole, "delivery_partner")
      )
    );

  const candidates: PilotCandidate[] = [];

  for (const pilot of pilots) {
    // Additional rating gate check (double validation)
    const rating = parseFloat(pilot.rating || "0");
    const minRating = parseFloat(pilot.cosMinRating || String(COS_DEFAULT_MIN_RATING));
    if (rating < minRating) continue;

    // Vehicle type filter
    const vehicleTypes: string[] = Array.isArray(pilot.vehicleTypes) ? pilot.vehicleTypes : [];
    if (vehicleTypeFilter && vehicleTypes.length > 0 && !vehicleTypes.includes(vehicleTypeFilter)) {
      continue;
    }

    // Zone filter
    if (zoneFilter && pilot.zone && pilot.zone !== zoneFilter) continue;

    // Calculate distance if pickup coordinates provided
    let distance = 0;
    if (pickupLat && pickupLng && pilot.currentLat && pilot.currentLng) {
      distance = haversineDistance(
        pickupLat, pickupLng,
        parseFloat(pilot.currentLat), parseFloat(pilot.currentLng)
      );
    }

    candidates.push({
      userId: pilot.userId,
      profileId: pilot.profileId,
      name: pilot.name || "Unknown Pilot",
      rating,
      completionRate: parseFloat(pilot.completionRate || "100"),
      totalDeliveries: pilot.totalDeliveries,
      vehicleTypes,
      distanceKm: Math.round(distance * 10) / 10,
      score: rating, // For COS, sort by rating (operator makes final decision)
      isAvailable: pilot.isAvailable,
      assignmentCount24h: pilot.assignmentCount24h || 0,
      lastAssignedAt: pilot.lastAssignedAt,
    });
  }

  // Sort by rating descending (best pilots first)
  candidates.sort((a, b) => b.rating - a.rating);

  return candidates;
}

/**
 * Validate that a pilot can be manually assigned in COS context.
 * Returns null if valid, or an error message if invalid.
 */
export async function validateManualAssignment(
  pilotUserId: number
): Promise<string | null> {
  const db = await getDb();
  if (!db) return "Database unavailable";

  const [profile] = await db
    .select()
    .from(pilotProfiles)
    .where(eq(pilotProfiles.userId, pilotUserId))
    .limit(1);

  if (!profile) return "Pilot profile not found";

  const rating = parseFloat(profile.rating || "0");
  const minRating = parseFloat(profile.cosMinRating || String(COS_DEFAULT_MIN_RATING));

  if (!profile.cosEligible) {
    return `Pilot is not COS eligible (requires ${COS_MIN_DELIVERIES}+ deliveries and rating >= ${minRating})`;
  }

  if (rating < minRating) {
    return `Pilot rating (${rating}) is below minimum for COS (${minRating})`;
  }

  // Check user is active
  const [user] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, pilotUserId))
    .limit(1);

  if (!user || !user.isActive) {
    return "Pilot account is not active";
  }

  return null; // Valid
}

/**
 * Record that a pilot was assigned (updates rotation counters).
 */
export async function recordAssignment(pilotUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(pilotProfiles)
    .set({
      lastAssignedAt: new Date(),
      assignmentCount24h: sql`${pilotProfiles.assignmentCount24h} + 1`,
    })
    .where(eq(pilotProfiles.userId, pilotUserId));
}
