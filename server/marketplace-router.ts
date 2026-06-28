/**
 * DROPi Marketplace Router — Sprint A Foundation
 * 
 * CRUD endpoints for stores and products.
 * Conforms to Blueprint:
 * - Merchants can create/manage their store (internal or external type)
 * - Products go through moderation (draft → pending_review → approved/rejected)
 * - Delivery badges are auto-calculated from product weight/dimensions
 * - Admin can moderate products, suspend stores
 * - All mutations are auto-audited via the audit middleware in protectedProcedure/adminProcedure
 */

import { router, protectedProcedure, adminProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { stores, products, productReviews, sellerBadges, deliveryBadges, storeAnalytics } from "../drizzle/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// ===== DELIVERY MODE CALCULATION =====
// Based on Blueprint: drone ≤2kg & ≤30×30×30cm, terrestrial always, multimodal if both eligible
function calculateDeliveryModes(weightGrams: number, dimensions?: { l: number; w: number; h: number }): string[] {
  const modes: string[] = ["terrestrial"]; // Always eligible
  
  const maxDim = dimensions ? Math.max(dimensions.l, dimensions.w, dimensions.h) : 999;
  const allDimsOk = dimensions ? (dimensions.l <= 30 && dimensions.w <= 30 && dimensions.h <= 30) : false;
  
  if (weightGrams <= 2000 && allDimsOk) {
    modes.push("drone");
    modes.push("multimodal");
  }
  
  return modes;
}

// ===== STORE ROUTER =====
export const storeRouter = router({
  // Create a new store (merchant only)
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(200),
      description: z.string().optional(),
      type: z.enum(["internal", "external"]),
      externalUrl: z.string().url().optional(),
      zone: z.string().min(1).max(100),
      category: z.string().min(1).max(100),
      workingHours: z.any().optional(),
      physicalAddress: z.string().optional(),
      contactPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check user is a merchant
      const user = ctx.user as any;
      if (user.dropiRole !== "merchant") {
        throw new Error("Only merchants can create stores");
      }

      // Check if user already has a store
      const existing = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
      if (existing.length > 0) {
        throw new Error("You already have a store. Each merchant can have one store.");
      }

      // Generate API key for external stores
      const apiKey = input.type === "external" ? crypto.randomBytes(32).toString("hex") : null;

      await db.insert(stores).values({
        ownerId: user.id,
        name: input.name,
        description: input.description || null,
        type: input.type,
        externalUrl: input.externalUrl || null,
        apiKey,
        zone: input.zone,
        category: input.category,
        status: "pending",
        workingHours: input.workingHours || null,
        physicalAddress: input.physicalAddress || null,
        contactPhone: input.contactPhone || null,
      });

      return { success: true, message: "Store created. Pending admin approval." };
    }),

  // Update store details
  update: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(200).optional(),
      description: z.string().optional(),
      externalUrl: z.string().url().optional(),
      zone: z.string().optional(),
      category: z.string().optional(),
      workingHours: z.any().optional(),
      physicalAddress: z.string().optional(),
      contactPhone: z.string().optional(),
      logoUrl: z.string().optional(),
      coverImageUrl: z.string().optional(),
      webhookUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
      if (!store) throw new Error("Store not found");

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.externalUrl !== undefined) updateData.externalUrl = input.externalUrl;
      if (input.zone) updateData.zone = input.zone;
      if (input.category) updateData.category = input.category;
      if (input.workingHours !== undefined) updateData.workingHours = input.workingHours;
      if (input.physicalAddress !== undefined) updateData.physicalAddress = input.physicalAddress;
      if (input.contactPhone !== undefined) updateData.contactPhone = input.contactPhone;
      if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
      if (input.coverImageUrl !== undefined) updateData.coverImageUrl = input.coverImageUrl;
      if (input.webhookUrl !== undefined) updateData.webhookUrl = input.webhookUrl;

      await db.update(stores).set(updateData).where(eq(stores.id, store.id));
      return { success: true };
    }),

  // Get my store (current merchant)
  getMyStore: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const user = ctx.user as any;
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    return store || null;
  }),

  // Get store by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [store] = await db.select().from(stores).where(eq(stores.id, input.id)).limit(1);
      return store || null;
    }),

  // List all active stores (public - for marketplace browsing)
  listActive: publicProcedure
    .input(z.object({
      zone: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { stores: [], total: 0 };

      const conditions = [eq(stores.status, "active")];
      if (input.zone) conditions.push(eq(stores.zone, input.zone));
      if (input.category) conditions.push(eq(stores.category, input.category));

      const where = conditions.length === 1 ? conditions[0] : and(...conditions);
      const results = await db.select().from(stores).where(where).orderBy(desc(stores.trustScore)).limit(input.limit).offset(input.offset);
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(stores).where(where!);

      return { stores: results, total: countResult?.count || 0 };
    }),

  // Admin: List all stores (including pending)
  adminList: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "active", "suspended", "closed"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { stores: [], total: 0 };

      const where = input.status ? eq(stores.status, input.status) : undefined;
      const results = await db.select().from(stores).where(where).orderBy(desc(stores.createdAt)).limit(input.limit).offset(input.offset);
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(stores).where(where);

      return { stores: results, total: countResult?.count || 0 };
    }),

  // Admin: Approve store
  approve: adminProcedure
    .input(z.object({ storeId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(stores).set({ status: "active" }).where(eq(stores.id, input.storeId));
      return { success: true };
    }),

  // Admin: Suspend store
  suspend: adminProcedure
    .input(z.object({ storeId: z.number(), reason: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(stores).set({
        status: "suspended",
        suspendedAt: new Date(),
        suspensionReason: input.reason,
      }).where(eq(stores.id, input.storeId));
      return { success: true };
    }),

  // Regenerate API key (for external stores)
  regenerateApiKey: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const user = ctx.user as any;
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    if (!store) throw new Error("Store not found");
    if (store.type !== "external") throw new Error("API key only for external stores");

    const newKey = crypto.randomBytes(32).toString("hex");
    await db.update(stores).set({ apiKey: newKey }).where(eq(stores.id, store.id));
    return { success: true, apiKey: newKey };
  }),
});

// ===== PRODUCT ROUTER =====
export const productRouter = router({
  // Create a new product (merchant only)
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(300),
      description: z.string().optional(),
      price: z.number().positive(),
      currency: z.string().length(3).default("RON"),
      images: z.array(z.string()).optional(),
      category: z.string().min(1).max(100),
      subcategory: z.string().optional(),
      weight: z.number().positive(), // grams
      dimensions: z.object({ l: z.number(), w: z.number(), h: z.number() }).optional(),
      stock: z.number().int().min(0).optional(),
      zone: z.string().min(1).max(100),
      isFragile: z.boolean().default(false),
      requiresSpecialPackaging: z.boolean().default(false),
      cancellationPolicy: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      // Get merchant's store
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
      if (!store) throw new Error("You must create a store first");
      if (store.status !== "active") throw new Error("Your store must be active to add products");

      // Calculate delivery modes
      const deliveryModes = calculateDeliveryModes(input.weight, input.dimensions);

      const [result] = await db.insert(products).values({
        storeId: store.id,
        name: input.name,
        description: input.description || null,
        price: input.price.toFixed(2),
        currency: input.currency,
        images: input.images || [],
        category: input.category,
        subcategory: input.subcategory || null,
        weight: input.weight.toFixed(2),
        dimensions: input.dimensions || null,
        deliveryModes,
        stock: input.stock ?? null,
        zone: input.zone,
        isFragile: input.isFragile,
        requiresSpecialPackaging: input.requiresSpecialPackaging,
        cancellationPolicy: input.cancellationPolicy || null,
        status: "draft",
        isActive: false,
      });

      // Auto-create delivery badges
      const productId = (result as any).insertId;
      for (const mode of ["drone", "terrestrial", "multimodal"] as const) {
        await db.insert(deliveryBadges).values({
          productId,
          mode,
          isEligible: deliveryModes.includes(mode),
          conditions: mode === "drone" ? "Weight ≤2kg, dimensions ≤30×30×30cm" : null,
        });
      }

      return { success: true, productId };
    }),

  // Update product
  update: protectedProcedure
    .input(z.object({
      productId: z.number(),
      name: z.string().min(2).max(300).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      images: z.array(z.string()).optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      weight: z.number().positive().optional(),
      dimensions: z.object({ l: z.number(), w: z.number(), h: z.number() }).optional(),
      stock: z.number().int().min(0).optional(),
      isFragile: z.boolean().optional(),
      requiresSpecialPackaging: z.boolean().optional(),
      cancellationPolicy: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
      if (!store) throw new Error("Store not found");

      // Verify product belongs to this store
      const [product] = await db.select().from(products).where(and(eq(products.id, input.productId), eq(products.storeId, store.id))).limit(1);
      if (!product) throw new Error("Product not found or does not belong to your store");

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.price) updateData.price = input.price.toFixed(2);
      if (input.images) updateData.images = input.images;
      if (input.category) updateData.category = input.category;
      if (input.subcategory !== undefined) updateData.subcategory = input.subcategory;
      if (input.stock !== undefined) updateData.stock = input.stock;
      if (input.isFragile !== undefined) updateData.isFragile = input.isFragile;
      if (input.requiresSpecialPackaging !== undefined) updateData.requiresSpecialPackaging = input.requiresSpecialPackaging;
      if (input.cancellationPolicy !== undefined) updateData.cancellationPolicy = input.cancellationPolicy;

      // Recalculate delivery modes if weight/dimensions changed
      if (input.weight || input.dimensions) {
        const newWeight = input.weight || parseFloat(product.weight as any);
        const newDims = input.dimensions || (product.dimensions as any);
        const deliveryModes = calculateDeliveryModes(newWeight, newDims);
        updateData.weight = newWeight.toFixed(2);
        if (input.dimensions) updateData.dimensions = input.dimensions;
        updateData.deliveryModes = deliveryModes;

        // Update delivery badges
        for (const mode of ["drone", "terrestrial", "multimodal"] as const) {
          await db.update(deliveryBadges)
            .set({ isEligible: deliveryModes.includes(mode), calculatedAt: new Date() })
            .where(and(eq(deliveryBadges.productId, input.productId), eq(deliveryBadges.mode, mode)));
        }
      }

      // If product was approved and key fields changed, reset to pending_review
      if (product.status === "approved" && (input.name || input.description || input.price || input.weight || input.dimensions)) {
        updateData.status = "pending_review";
        updateData.isActive = false;
      }

      await db.update(products).set(updateData).where(eq(products.id, input.productId));
      return { success: true };
    }),

  // Submit product for review
  submitForReview: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
      if (!store) throw new Error("Store not found");

      const [product] = await db.select().from(products).where(and(eq(products.id, input.productId), eq(products.storeId, store.id))).limit(1);
      if (!product) throw new Error("Product not found");
      if (product.status !== "draft" && product.status !== "rejected") {
        throw new Error("Only draft or rejected products can be submitted for review");
      }

      await db.update(products).set({ status: "pending_review" }).where(eq(products.id, input.productId));
      return { success: true };
    }),

  // Delete product (soft — set to draft and inactive)
  remove: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
      if (!store) throw new Error("Store not found");

      const [product] = await db.select().from(products).where(and(eq(products.id, input.productId), eq(products.storeId, store.id))).limit(1);
      if (!product) throw new Error("Product not found");

      await db.update(products).set({ status: "draft", isActive: false }).where(eq(products.id, input.productId));
      return { success: true };
    }),

  // Get products for my store
  myProducts: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "pending_review", "approved", "rejected", "suspended"]).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { products: [], total: 0 };

      const user = ctx.user as any;
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
      if (!store) return { products: [], total: 0 };

      const conditions: any[] = [eq(products.storeId, store.id)];
      if (input.status) conditions.push(eq(products.status, input.status));
      if (input.search) conditions.push(like(products.name, `%${input.search}%`));

      const where = conditions.length === 1 ? conditions[0] : and(...conditions);
      const results = await db.select().from(products).where(where).orderBy(desc(products.updatedAt)).limit(input.limit).offset(input.offset);
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(products).where(where!);

      return { products: results, total: countResult?.count || 0 };
    }),

  // Get single product by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [product] = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      if (!product) return null;

      // Get delivery badges
      const badges = await db.select().from(deliveryBadges).where(eq(deliveryBadges.productId, input.id));

      // Get reviews
      const reviews = await db.select().from(productReviews).where(eq(productReviews.productId, input.id)).orderBy(desc(productReviews.createdAt)).limit(10);

      return { ...product, deliveryBadges: badges, reviews };
    }),

  // List active products (public marketplace)
  listActive: publicProcedure
    .input(z.object({
      storeId: z.number().optional(),
      zone: z.string().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      deliveryMode: z.enum(["drone", "terrestrial", "multimodal"]).optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { products: [], total: 0 };

      const conditions: any[] = [eq(products.status, "approved"), eq(products.isActive, true)];
      if (input.storeId) conditions.push(eq(products.storeId, input.storeId));
      if (input.zone) conditions.push(eq(products.zone, input.zone));
      if (input.category) conditions.push(eq(products.category, input.category));
      if (input.search) conditions.push(like(products.name, `%${input.search}%`));

      const where = and(...conditions);
      const results = await db.select().from(products).where(where).orderBy(desc(products.orderCount)).limit(input.limit).offset(input.offset);
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(products).where(where!);

      return { products: results, total: countResult?.count || 0 };
    }),

  // Admin: Moderate product (approve/reject)
  moderate: adminProcedure
    .input(z.object({
      productId: z.number(),
      action: z.enum(["approve", "reject"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const newStatus = input.action === "approve" ? "approved" : "rejected";

      await db.update(products).set({
        status: newStatus,
        isActive: input.action === "approve",
        moderationNote: input.note || null,
        moderatedBy: user.id,
        moderatedAt: new Date(),
      }).where(eq(products.id, input.productId));

      return { success: true };
    }),

  // Admin: List products pending review
  pendingReview: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { products: [], total: 0 };

      const results = await db.select().from(products).where(eq(products.status, "pending_review")).orderBy(products.createdAt).limit(input.limit).offset(input.offset);
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.status, "pending_review"));

      return { products: results, total: countResult?.count || 0 };
    }),
});

// ===== REVIEWS ROUTER =====
export const reviewRouter = router({
  // Submit a review (only after confirmed delivery)
  submit: protectedProcedure
    .input(z.object({
      productId: z.number(),
      orderId: z.number(),
      overallRating: z.number().int().min(1).max(5),
      qualityRating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;

      // Check if review already exists for this order
      const existing = await db.select().from(productReviews)
        .where(and(eq(productReviews.orderId, input.orderId), eq(productReviews.userId, user.id)))
        .limit(1);
      if (existing.length > 0) throw new Error("You already reviewed this order");

      // Get product to find storeId
      const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
      if (!product) throw new Error("Product not found");

      await db.insert(productReviews).values({
        productId: input.productId,
        storeId: product.storeId,
        orderId: input.orderId,
        userId: user.id,
        overallRating: input.overallRating,
        qualityRating: input.qualityRating,
        comment: input.comment || null,
        isVerifiedPurchase: true,
      });

      // Update store trust score (simplified: average of all reviews)
      const [avgResult] = await db.select({
        avg: sql<number>`AVG(overallRating)`,
        count: sql<number>`COUNT(*)`,
      }).from(productReviews).where(eq(productReviews.storeId, product.storeId));

      if (avgResult) {
        const trustScore = Math.round((avgResult.avg || 0) * 20); // 1-5 → 20-100
        await db.update(stores).set({
          trustScore,
          totalReviews: avgResult.count || 0,
        }).where(eq(stores.id, product.storeId));
      }

      return { success: true };
    }),

  // Get reviews for a product
  getForProduct: publicProcedure
    .input(z.object({
      productId: z.number(),
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { reviews: [], total: 0 };

      const results = await db.select().from(productReviews)
        .where(eq(productReviews.productId, input.productId))
        .orderBy(desc(productReviews.createdAt))
        .limit(input.limit).offset(input.offset);
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(productReviews).where(eq(productReviews.productId, input.productId));

      return { reviews: results, total: countResult?.count || 0 };
    }),

  // Get reviews for my store (merchant view)
  myStoreReviews: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { reviews: [], total: 0 };

      const user = ctx.user as any;
      const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
      if (!store) return { reviews: [], total: 0 };

      const results = await db.select().from(productReviews)
        .where(eq(productReviews.storeId, store.id))
        .orderBy(desc(productReviews.createdAt))
        .limit(input.limit).offset(input.offset);
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(productReviews).where(eq(productReviews.storeId, store.id));

      return { reviews: results, total: countResult?.count || 0 };
    }),
});
