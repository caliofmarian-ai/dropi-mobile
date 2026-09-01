import { eq } from "drizzle-orm";
import { orders, products, stores } from "../drizzle/schema";
import { getDb } from "./db";

export type MerchantPortfolioProduct = {
  status: string;
  isActive: boolean;
  stock: number | null;
};

export type MerchantPortfolioOrder = {
  status: string;
  totalAmount: unknown;
};

export function buildMerchantPortfolioSummary(input: {
  products: MerchantPortfolioProduct[];
  orders: MerchantPortfolioOrder[];
}) {
  const productCounts = {
    total: input.products.length,
    live: 0,
    pendingReview: 0,
    drafts: 0,
    rejected: 0,
    suspended: 0,
    outOfStock: 0,
  };

  for (const product of input.products) {
    if (product.status === "approved" && product.isActive) productCounts.live++;
    if (product.status === "pending_review") productCounts.pendingReview++;
    if (product.status === "draft") productCounts.drafts++;
    if (product.status === "rejected") productCounts.rejected++;
    if (product.status === "suspended") productCounts.suspended++;
    if (product.stock !== null && product.stock <= 0) productCounts.outOfStock++;
  }

  const orderCounts = {
    total: input.orders.length,
    new: 0,
    preparing: 0,
    ready: 0,
    accepted: 0,
    inExecution: 0,
    completed: 0,
    cancelled: 0,
    fallback: 0,
  };
  let completedRevenue = 0;

  for (const order of input.orders) {
    if (order.status === "initiated" || order.status === "validated") orderCounts.new++;
    if (order.status === "preparing") orderCounts.preparing++;
    if (order.status === "ready") orderCounts.ready++;
    if (order.status === "accepted") orderCounts.accepted++;
    if (order.status === "in_execution") orderCounts.inExecution++;
    if (order.status === "completed") {
      orderCounts.completed++;
      const amount = Number(order.totalAmount ?? 0);
      if (Number.isFinite(amount)) completedRevenue += amount;
    }
    if (order.status === "cancelled") orderCounts.cancelled++;
    if (order.status === "fallback") orderCounts.fallback++;
  }

  const reviewedListings = productCounts.live + productCounts.rejected + productCounts.suspended;
  const approvalRate = reviewedListings > 0
    ? Math.round((productCounts.live / reviewedListings) * 100)
    : null;

  return {
    products: productCounts,
    orders: orderCounts,
    completedRevenue: Math.round(completedRevenue * 100) / 100,
    listingQuality: {
      approvalRate,
      needsAttention: productCounts.rejected + productCounts.suspended + productCounts.outOfStock,
    },
  };
}

export async function getMerchantPortfolioSummary(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.ownerId, ownerId)).limit(1);
  if (!store) return null;

  const [productRows, orderRows] = await Promise.all([
    db.select({ status: products.status, isActive: products.isActive, stock: products.stock })
      .from(products)
      .where(eq(products.storeId, store.id)),
    db.select({ status: orders.status, totalAmount: orders.totalAmount })
      .from(orders)
      .where(eq(orders.merchantId, ownerId)),
  ]);

  return {
    store: {
      id: store.id,
      name: store.name,
      zone: store.zone,
      category: store.category,
      status: store.status,
      type: store.type,
      trustScore: store.trustScore,
      totalReviews: store.totalReviews,
    },
    ...buildMerchantPortfolioSummary({ products: productRows, orders: orderRows }),
  };
}
