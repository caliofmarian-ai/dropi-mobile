import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { p2pCommunityListings, p2pParcelRequests } from "../drizzle/p2p-schema";
import {
  MARKETPLACE_LISTING_POLICY_VERSION,
  normalizeMarketplaceZone,
} from "../shared/marketplace-policy";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { buildAuditAttribution, type AuditSessionLike } from "./audit-policy";
import { createAuditLog, getDb } from "./db";
import {
  P2P_MAX_LISTING_IMAGE_BYTES,
  assertP2pActiveListingLimit,
  assertP2pActor,
  assertP2pListingReadyForApproval,
  assertPrivateParcel,
  normalizeP2pCommunityOffer,
  normalizeP2pListingGovernance,
} from "./p2p-policy";
import { storageCreatePresignedPut } from "./storage";

const posterDeclarationsSchema = z.object({
  rulesAccepted: z.boolean(),
  truthfulListing: z.boolean(),
  authorizedToOffer: z.boolean(),
  notProhibitedOrRestricted: z.boolean(),
  moderationAccepted: z.boolean(),
});

const foodSafetySchema = z.object({
  ingredients: z.string().trim().min(2).max(4000),
  allergens: z.string().trim().min(2).max(2000),
  storageInstructions: z.string().trim().min(2).max(2000),
  useBy: z.coerce.date().optional(),
});

function actorFromContext(user: any) {
  return {
    id: Number(user.id),
    dropiRole: user.dropiRole as string | null,
    channel: user.channel as string | null,
    isActive: Boolean(user.isActive),
    zone: user.zone as string | null,
  };
}

async function audit(input: {
  user: any;
  session?: AuditSessionLike;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  severity?: "info" | "warning" | "critical";
}) {
  const attribution = buildAuditAttribution("C1", input.session);
  await createAuditLog({
    userId: Number(input.user.id),
    userRole: String(input.user.dropiRole || "customer"),
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    details: input.details || null,
    severity: input.severity || "info",
    channel: attribution.channel,
    isPhantomMode: attribution.isPhantomMode,
    phantomAdminId: attribution.phantomAdminId,
    isAIAction: Boolean(input.user.isAIAgent),
  });
}

export const p2pRouter = router({
  listingPolicy: publicProcedure.query(() => ({
    version: MARKETPLACE_LISTING_POLICY_VERSION,
  })),

  requestCommunityOfferImageUpload: protectedProcedure
    .input(z.object({
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      fileSize: z.number().int().positive().max(P2P_MAX_LISTING_IMAGE_BYTES),
    }))
    .mutation(async ({ ctx, input }) => {
      const actor = actorFromContext(ctx.user);
      assertP2pActor(actor);
      const extension = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
      try {
        const upload = await storageCreatePresignedPut(
          `p2p/community-offers/${actor.id}/item.${extension}`,
        );
        await audit({
          user: ctx.user,
          session: ctx.session,
          action: "p2p.community_offer.image_upload_authorized",
          resourceType: "p2p_listing_media",
          resourceId: upload.key,
          details: { contentType: input.contentType, fileSize: input.fileSize },
        });
        return upload;
      } catch (error) {
        console.error("[P2P] image upload authorization failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Item photo upload is temporarily unavailable." });
      }
    }),

  createCommunityOffer: protectedProcedure
    .input(z.object({
      title: z.string().trim().min(2).max(200),
      description: z.string().trim().max(2000).optional(),
      category: z.string().trim().min(1).max(100),
      itemCondition: z.enum(["new", "used", "prepared", "other"]),
      imagePaths: z.array(z.string().trim().min(1).max(1000)).min(1).max(5),
      policyVersion: z.string().trim().min(1).max(64),
      posterDeclarations: posterDeclarationsSchema,
      foodSafety: foodSafetySchema.optional(),
      offerType: z.enum(["donation", "free_transfer", "fixed_price"]),
      fixedPrice: z.number().positive().optional(),
      currency: z.string().length(3).optional(),
      expiresAt: z.coerce.date(),
      zone: z.string().trim().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const actor = actorFromContext(ctx.user);
      assertP2pActor(actor);
      const zone = normalizeMarketplaceZone(input.zone);
      if (actor.zone && normalizeMarketplaceZone(actor.zone).toLowerCase() !== zone.toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Community offers must use the account operating zone." });
      }

      const [countRow] = await db.select({ count: sql<number>`count(*)` })
        .from(p2pCommunityListings)
        .where(and(
          eq(p2pCommunityListings.ownerId, actor.id),
          inArray(p2pCommunityListings.status, ["pending_review", "approved"]),
          gt(p2pCommunityListings.expiresAt, new Date()),
        ));
      assertP2pActiveListingLimit(Number(countRow?.count || 0));

      const normalized = normalizeP2pCommunityOffer({
        offerType: input.offerType,
        fixedPrice: input.fixedPrice,
        currency: input.currency,
        expiresAt: input.expiresAt,
      });
      const governance = normalizeP2pListingGovernance({
        actorId: actor.id,
        category: input.category,
        itemCondition: input.itemCondition,
        imagePaths: input.imagePaths,
        policyVersion: input.policyVersion,
        posterDeclarations: input.posterDeclarations,
        foodSafety: input.foodSafety || null,
      });

      const inserted = await db.insert(p2pCommunityListings).values({
        ownerId: actor.id,
        title: input.title,
        description: input.description || null,
        category: governance.category,
        itemCondition: governance.itemCondition,
        imagePaths: governance.imagePaths,
        foodSafety: governance.foodSafety,
        posterDeclarations: governance.posterDeclarations,
        policyVersion: governance.policyVersion,
        policyAcceptedAt: governance.policyAcceptedAt,
        offerType: input.offerType,
        fixedPrice: normalized.fixedPrice,
        currency: normalized.currency,
        zone,
        status: "pending_review",
        expiresAt: normalized.expiresAt,
      }).$returningId();
      const listingId = inserted[0]?.id;
      if (!listingId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Offer could not be created" });

      await audit({
        user: ctx.user,
        session: ctx.session,
        action: "p2p.community_offer.created",
        resourceType: "p2p_community_offer",
        resourceId: String(listingId),
        details: {
          offerType: input.offerType,
          category: governance.category,
          itemCondition: governance.itemCondition,
          imageCount: governance.imagePaths.length,
          policyVersion: governance.policyVersion,
          zone,
          expiresAt: input.expiresAt.toISOString(),
        },
      });
      return { listingId, status: "pending_review" as const };
    }),

  myCommunityOffers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const actor = actorFromContext(ctx.user);
    assertP2pActor(actor);
    return db.select().from(p2pCommunityListings)
      .where(eq(p2pCommunityListings.ownerId, actor.id))
      .orderBy(desc(p2pCommunityListings.createdAt));
  }),

  closeCommunityOffer: protectedProcedure
    .input(z.object({ listingId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const actor = actorFromContext(ctx.user);
      assertP2pActor(actor);
      const [listing] = await db.select().from(p2pCommunityListings)
        .where(and(eq(p2pCommunityListings.id, input.listingId), eq(p2pCommunityListings.ownerId, actor.id)))
        .limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Community offer not found" });
      await db.update(p2pCommunityListings).set({ status: "closed" }).where(eq(p2pCommunityListings.id, listing.id));
      await audit({ user: ctx.user, session: ctx.session, action: "p2p.community_offer.closed", resourceType: "p2p_community_offer", resourceId: String(listing.id) });
      return { success: true };
    }),

  publicCommunityOffers: publicProcedure
    .input(z.object({
      zone: z.string().trim().min(1).max(100),
      limit: z.number().int().min(1).max(50).default(20),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { offers: [], total: 0 };
      const zone = normalizeMarketplaceZone(input.zone);
      const where = and(
        eq(p2pCommunityListings.status, "approved"),
        eq(p2pCommunityListings.zone, zone),
        gt(p2pCommunityListings.expiresAt, new Date()),
      );
      const offers = await db.select({
        id: p2pCommunityListings.id,
        title: p2pCommunityListings.title,
        description: p2pCommunityListings.description,
        category: p2pCommunityListings.category,
        itemCondition: p2pCommunityListings.itemCondition,
        imagePaths: p2pCommunityListings.imagePaths,
        foodSafety: p2pCommunityListings.foodSafety,
        offerType: p2pCommunityListings.offerType,
        fixedPrice: p2pCommunityListings.fixedPrice,
        currency: p2pCommunityListings.currency,
        zone: p2pCommunityListings.zone,
        expiresAt: p2pCommunityListings.expiresAt,
        createdAt: p2pCommunityListings.createdAt,
      }).from(p2pCommunityListings).where(where).orderBy(desc(p2pCommunityListings.createdAt)).limit(input.limit).offset(input.offset);
      const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(p2pCommunityListings).where(where);
      return { offers, total: Number(countRow?.count || 0) };
    }),

  createPrivateParcel: protectedProcedure
    .input(z.object({
      pickupAddress: z.string().trim().min(1).max(1000),
      deliveryAddress: z.string().trim().min(1).max(1000),
      packageDescription: z.string().trim().min(1).max(2000),
      weightGrams: z.number().int().positive().max(50000),
      zone: z.string().trim().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const actor = actorFromContext(ctx.user);
      assertP2pActor(actor);
      assertPrivateParcel(input);
      const zone = normalizeMarketplaceZone(input.zone);
      if (actor.zone && normalizeMarketplaceZone(actor.zone).toLowerCase() !== zone.toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Private parcel must use the account operating zone." });
      }
      const requestUid = randomUUID();
      const inserted = await db.insert(p2pParcelRequests).values({
        requestUid,
        ownerId: actor.id,
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        packageDescription: input.packageDescription,
        weightGrams: input.weightGrams,
        zone,
        status: "initiated",
      }).$returningId();
      const requestId = inserted[0]?.id;
      if (!requestId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Private parcel request could not be created" });
      await audit({
        user: ctx.user,
        session: ctx.session,
        action: "p2p.private_parcel.created",
        resourceType: "p2p_private_parcel",
        resourceId: String(requestId),
        details: { requestUid, zone, weightGrams: input.weightGrams },
      });
      return { requestId, requestUid, status: "initiated" as const };
    }),

  myPrivateParcels: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const actor = actorFromContext(ctx.user);
    assertP2pActor(actor);
    return db.select().from(p2pParcelRequests)
      .where(eq(p2pParcelRequests.ownerId, actor.id))
      .orderBy(desc(p2pParcelRequests.createdAt));
  }),

  cancelPrivateParcel: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const actor = actorFromContext(ctx.user);
      assertP2pActor(actor);
      const [request] = await db.select().from(p2pParcelRequests)
        .where(and(eq(p2pParcelRequests.id, input.requestId), eq(p2pParcelRequests.ownerId, actor.id)))
        .limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Private parcel request not found" });
      if (request.status !== "initiated") throw new TRPCError({ code: "BAD_REQUEST", message: "Only initiated private parcels can be cancelled" });
      await db.update(p2pParcelRequests).set({ status: "cancelled" }).where(eq(p2pParcelRequests.id, request.id));
      await audit({ user: ctx.user, session: ctx.session, action: "p2p.private_parcel.cancelled", resourceType: "p2p_private_parcel", resourceId: String(request.id), severity: "warning" });
      return { success: true };
    }),

  pendingCommunityOffers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(p2pCommunityListings)
      .where(eq(p2pCommunityListings.status, "pending_review"))
      .orderBy(p2pCommunityListings.createdAt);
  }),

  moderateCommunityOffer: adminProcedure
    .input(z.object({ listingId: z.number().int().positive(), action: z.enum(["approve", "reject"]), note: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [listing] = await db.select().from(p2pCommunityListings).where(eq(p2pCommunityListings.id, input.listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Community offer not found" });
      if (listing.status !== "pending_review") throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending community offers can be moderated" });
      if (input.action === "approve" && listing.expiresAt <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Expired community offers cannot be approved" });
      }
      if (input.action === "approve") {
        try {
          assertP2pListingReadyForApproval(listing);
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Community offer is missing required governance evidence.",
          });
        }
      }
      const status = input.action === "approve" ? "approved" : "rejected";
      await db.update(p2pCommunityListings).set({
        status,
        moderationNote: input.note || null,
        moderatedBy: Number((ctx.user as any).id),
        moderatedAt: new Date(),
      }).where(eq(p2pCommunityListings.id, listing.id));
      await audit({
        user: ctx.user,
        session: ctx.session,
        action: `p2p.community_offer.${status}`,
        resourceType: "p2p_community_offer",
        resourceId: String(listing.id),
        details: { note: input.note || null, policyVersion: listing.policyVersion || null },
        severity: input.action === "reject" ? "warning" : "info",
      });
      return { success: true, status };
    }),
});
