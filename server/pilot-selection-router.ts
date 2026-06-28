/**
 * DROPi Pilot Selection Router
 * 
 * Canonical rules:
 * - C1 (Marketplace): ONLY automatic selection. "Marketplace-ul NU oferă: alocare manuală" (Cap. 6, §6.1.3)
 * - C2/C3 (COS): Manual selection allowed IF pilot has good rating. "O entitate are nevoie să desemneze misiuni" (Cap. 6, §6.4.1)
 * 
 * Endpoints:
 * - getEligiblePilots: C2/C3 roles only — returns COS-eligible pilots for manual selection
 * - getAutoSelectedPilot: system/admin — runs automatic scoring algorithm
 * - assignPilotManual: C2/C3 roles only — assigns pilot with rating gate validation
 * - updateAvailability: delivery_partner — sets availability and position
 * - updatePosition: delivery_partner — GPS position update
 * - getMyProfile: delivery_partner — view own pilot profile
 * - getLeaderboard: admin — top pilots per zone
 */

import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { pilotProfiles, pilotRatingHistory, users, b2bDeliveries, auditLogs } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import {
  getAutoSelectedPilot,
  getEligiblePilotsForCOS,
  validateManualAssignment,
  recordAssignment,
  ensurePilotProfile,
  updatePilotAvailability,
  recalculateRating,
  onDeliveryCompleted,
  onDeliveryFailed,
  onCustomerReview,
  onIncidentReported,
} from "./pilot-rating-engine";
import { triggerWebhooks, buildWebhookPayload } from "./webhook-trigger";

// Allowed roles for manual pilot selection (C2/C3 only)
const COS_MANUAL_ASSIGN_ROLES = [
  "operations_manager",
  "logistics_coordinator",
  "fleet_manager",
  "dispatch_manager",
  "emergency_coordinator",
  "resource_allocator",
] as const;

export const pilotSelectionRouter = router({
  /**
   * Get eligible pilots for manual selection (C2/C3 COS only).
   * Returns pilots with rating >= cosMinRating AND cosEligible = TRUE.
   * 
   * Access: C2/C3 operational roles only.
   * Canonical: "COS oferă entității control asupra fluxului (logic)" — Cap. 6, §6.4.4.A
   */
  getEligiblePilots: protectedProcedure
    .input(z.object({
      pickupLat: z.number().optional(),
      pickupLng: z.number().optional(),
      vehicleType: z.string().optional(),
      zone: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // RBAC: Only C2/C3 roles can access manual selection
      const userRole = (ctx.user as any)?.dropiRole;
      const userChannel = (ctx.user as any)?.channel;

      if (!userChannel || !["C2", "C3"].includes(userChannel)) {
        return { error: "Manual pilot selection is only available in C2/C3 (COS) channels", pilots: [] };
      }

      if (!COS_MANUAL_ASSIGN_ROLES.includes(userRole)) {
        return { error: "Your role does not have permission for manual pilot selection", pilots: [] };
      }

      const pilots = await getEligiblePilotsForCOS(
        input?.pickupLat,
        input?.pickupLng,
        input?.vehicleType,
        input?.zone
      );

      return { error: null, pilots };
    }),

  /**
   * Get the system-selected pilot for a delivery (C1 automatic).
   * Runs the scoring algorithm and returns the top candidate.
   * 
   * Access: Admin or system use.
   * Canonical: "Selecția este făcută de sistem" — Delivery_Multimodal §5
   */
  getAutoSelected: protectedProcedure
    .input(z.object({
      pickupLat: z.number(),
      pickupLng: z.number(),
      vehicleType: z.string().optional(),
      zone: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const pilot = await getAutoSelectedPilot(
        input.pickupLat,
        input.pickupLng,
        input.vehicleType,
        input.zone
      );

      if (!pilot) {
        return { error: "No available pilots found in range", pilot: null };
      }

      return { error: null, pilot };
    }),

  /**
   * Manually assign a pilot to a B2B delivery (C2/C3 COS only).
   * Validates: caller is C2/C3 role, pilot has good rating, pilot is COS eligible.
   * 
   * Canonical: "desemneze misiuni către piloți dedicați" — Cap. 6, §6.4.1
   * Protection: "Selecția manuală este o propunere, nu o comandă ierarhică" — Blueprint §11.2
   */
  assignPilotManual: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      pilotUserId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.user as any)?.dropiRole;
      const userChannel = (ctx.user as any)?.channel;
      const operatorId = (ctx.user as any)?.id;

      // 1. Verify caller is C2/C3
      if (!userChannel || !["C2", "C3"].includes(userChannel)) {
        return { success: false, error: "Manual pilot assignment is only available in C2/C3 (COS) channels. Marketplace (C1) uses automatic selection only." };
      }

      // 2. Verify caller role has permission
      if (!COS_MANUAL_ASSIGN_ROLES.includes(userRole)) {
        return { success: false, error: "Your role does not have permission for manual pilot assignment." };
      }

      // 3. Validate pilot eligibility (rating gate)
      const validationError = await validateManualAssignment(input.pilotUserId);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 4. Get the delivery
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const [delivery] = await db
        .select()
        .from(b2bDeliveries)
        .where(eq(b2bDeliveries.id, input.deliveryId))
        .limit(1);

      if (!delivery) {
        return { success: false, error: "Delivery not found" };
      }

      if (delivery.status !== "pending") {
        return { success: false, error: `Cannot assign pilot to delivery with status "${delivery.status}". Only pending deliveries can be assigned.` };
      }

      // 5. Assign the pilot
      await db
        .update(b2bDeliveries)
        .set({
          assignedPilotId: input.pilotUserId,
          status: "assigned",
        })
        .where(eq(b2bDeliveries.id, input.deliveryId));

      // 6. Record assignment (rotation counter)
      await recordAssignment(input.pilotUserId);

      // 7. Audit log
      await db.insert(auditLogs).values({
        userId: operatorId,
        userRole: userRole,
        action: "pilot_assigned_manual",
        channel: userChannel,
        resourceType: "b2bDelivery",
        resourceId: String(input.deliveryId),
        severity: "info",
        details: JSON.stringify({
          deliveryId: input.deliveryId,
          pilotUserId: input.pilotUserId,
          assignmentType: "manual",
          operatorRole: userRole,
          operatorChannel: userChannel,
          trackingCode: delivery.trackingCode,
        }),
        ipAddress: null,
        userAgent: null,
      });

      // 8. Trigger webhook
      const payload = buildWebhookPayload(
        "delivery.assigned",
        {
          id: input.deliveryId,
          externalOrderId: delivery.externalOrderId,
          trackingCode: delivery.trackingCode,
          status: "assigned",
        },
        "pending",
        { assignedPilotId: input.pilotUserId, assignmentType: "manual", assignedBy: operatorId }
      );
      triggerWebhooks(delivery.storeId, input.deliveryId, "delivery.assigned", payload);

      return { success: true, error: null };
    }),

  /**
   * Update pilot availability and position.
   * Access: delivery_partner role only.
   */
  updateAvailability: protectedProcedure
    .input(z.object({
      isAvailable: z.boolean(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.user as any)?.id;
      if (!userId) return { success: false };

      // Ensure profile exists
      await ensurePilotProfile(userId);

      const result = await updatePilotAvailability(
        userId,
        input.isAvailable,
        input.lat,
        input.lng
      );

      return { success: result };
    }),

  /**
   * Update pilot GPS position (lightweight, frequent calls).
   */
  updatePosition: protectedProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.user as any)?.id;
      if (!userId) return { success: false };

      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(pilotProfiles)
        .set({
          currentLat: input.lat.toFixed(8),
          currentLng: input.lng.toFixed(8),
          lastPositionUpdate: new Date(),
        })
        .where(eq(pilotProfiles.userId, userId));

      return { success: true };
    }),

  /**
   * Get own pilot profile with stats and rating.
   * Access: delivery_partner role.
   */
  getMyProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = (ctx.user as any)?.id;
      if (!userId) return null;

      const db = await getDb();
      if (!db) return null;

      // Ensure profile exists
      await ensurePilotProfile(userId);

      const [profile] = await db
        .select()
        .from(pilotProfiles)
        .where(eq(pilotProfiles.userId, userId))
        .limit(1);

      return profile || null;
    }),

  /**
   * Get pilot rating history (audit trail).
   * Access: delivery_partner (own history) or admin (any pilot).
   */
  getRatingHistory: protectedProcedure
    .input(z.object({
      userId: z.number().optional(), // Admin can query any pilot
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const callerId = (ctx.user as any)?.id;
      const callerRole = (ctx.user as any)?.role;
      const targetUserId = (callerRole === "admin" && input?.userId) ? input.userId : callerId;

      if (!targetUserId) return [];

      const db = await getDb();
      if (!db) return [];

      const history = await db
        .select()
        .from(pilotRatingHistory)
        .where(eq(pilotRatingHistory.userId, targetUserId))
        .orderBy(desc(pilotRatingHistory.createdAt))
        .limit(input?.limit || 20);

      return history;
    }),

  /**
   * Get pilot leaderboard (top pilots by rating).
   * Access: admin only.
   */
  getLeaderboard: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      zone: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const pilots = await db
        .select({
          userId: users.id,
          name: users.name,
          rating: pilotProfiles.rating,
          totalDeliveries: pilotProfiles.totalDeliveries,
          completionRate: pilotProfiles.completionRate,
          cosEligible: pilotProfiles.cosEligible,
          isAvailable: pilotProfiles.isAvailable,
          zone: users.zone,
        })
        .from(pilotProfiles)
        .innerJoin(users, eq(users.id, pilotProfiles.userId))
        .where(eq(users.isActive, true))
        .orderBy(desc(pilotProfiles.rating))
        .limit(input?.limit || 20);

      return pilots;
    }),

  /**
   * Ensure a pilot profile exists for the current user.
   * Called when a delivery_partner first accesses the system.
   */
  ensureProfile: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = (ctx.user as any)?.id;
      if (!userId) return { success: false, profileId: null };

      const profileId = await ensurePilotProfile(userId);
      return { success: !!profileId, profileId };
    }),

  /**
   * Trigger rating recalculation for a pilot (admin use or system hook).
   */
  triggerRatingRecalc: adminProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.enum([
        "delivery_completed", "delivery_failed", "delivery_late",
        "customer_review", "incident_reported", "periodic_recalculation",
        "admin_adjustment", "initial_calculation"
      ]).default("periodic_recalculation"),
    }))
    .mutation(async ({ input }) => {
      const result = await recalculateRating(input.userId, input.reason);
      return result;
    }),
});
