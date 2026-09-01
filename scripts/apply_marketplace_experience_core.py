#!/usr/bin/env python3
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:180]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


# Marketplace router: wire real portfolio and verified review policy.
replace_once(
    "server/marketplace-router.ts",
    'import { stores, products, productReviews, sellerBadges, deliveryBadges, storeAnalytics } from "../drizzle/schema";\n',
    'import { stores, products, productReviews, sellerBadges, deliveryBadges, storeAnalytics, orders } from "../drizzle/schema";\n',
)
replace_once(
    "server/marketplace-router.ts",
    'import { MARKETPLACE_CATEGORY_POLICIES, normalizeMarketplaceCategory, normalizeMarketplaceZone, sameMarketplaceZone } from "../shared/marketplace-policy";\n',
    'import { MARKETPLACE_CATEGORY_POLICIES, normalizeMarketplaceCategory, normalizeMarketplaceZone, sameMarketplaceZone } from "../shared/marketplace-policy";\nimport { assertVerifiedMarketplaceReview } from "./marketplace-review-policy";\nimport { updateStoreTrustScore } from "./trust-engine";\nimport { getMerchantPortfolioSummary } from "./merchant-portfolio-service";\n',
)

# Add portfolio summary beside getMyStore, preserving private merchant ownership.
anchor = '''  // Create a new store (merchant only)\n  create: protectedProcedure\n'''
portfolio = '''  // Real merchant portfolio summary across the complete catalog and order lifecycle.\n  portfolioSummary: protectedProcedure.query(async ({ ctx }) => {\n    const user = ctx.user as any;\n    if (user.dropiRole !== "merchant" || !user.isActive) {\n      throw new Error("Merchant account required");\n    }\n    return getMerchantPortfolioSummary(user.id);\n  }),\n\n  // Create a new store (merchant only)\n  create: protectedProcedure\n'''
replace_once("server/marketplace-router.ts", anchor, portfolio)

# Replace insecure review submit body segment.
old_review = '''      const user = ctx.user as any;\n\n      // Check if review already exists for this order\n      const existing = await db.select().from(productReviews)\n        .where(and(eq(productReviews.orderId, input.orderId), eq(productReviews.userId, user.id)))\n        .limit(1);\n      if (existing.length > 0) throw new Error("You already reviewed this order");\n\n      // Get product to find storeId\n      const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);\n      if (!product) throw new Error("Product not found");\n\n      await db.insert(productReviews).values({\n        productId: input.productId,\n        storeId: product.storeId,\n        orderId: input.orderId,\n        userId: user.id,\n        overallRating: input.overallRating,\n        qualityRating: input.qualityRating,\n        comment: input.comment || null,\n        isVerifiedPurchase: true,\n      });\n\n      // Update store trust score (simplified: average of all reviews)\n      const [avgResult] = await db.select({\n        avg: sql<number>`AVG(overallRating)`,\n        count: sql<number>`COUNT(*)`,\n      }).from(productReviews).where(eq(productReviews.storeId, product.storeId));\n\n      if (avgResult) {\n        const trustScore = Math.round((avgResult.avg || 0) * 20); // 1-5 → 20-100\n        await db.update(stores).set({\n          trustScore,\n          totalReviews: avgResult.count || 0,\n        }).where(eq(stores.id, product.storeId));\n      }\n\n      return { success: true };\n'''
new_review = '''      const user = ctx.user as any;\n\n      // One verified review per order, enforced for the authenticated customer.\n      const existing = await db.select().from(productReviews)\n        .where(and(eq(productReviews.orderId, input.orderId), eq(productReviews.userId, user.id)))\n        .limit(1);\n      if (existing.length > 0) throw new Error("You already reviewed this order");\n\n      const [[product], [order]] = await Promise.all([\n        db.select().from(products).where(eq(products.id, input.productId)).limit(1),\n        db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1),\n      ]);\n      if (!product) throw new Error("Product not found");\n      if (!order) throw new Error("Order not found");\n\n      const [store] = await db.select().from(stores).where(eq(stores.id, product.storeId)).limit(1);\n      if (!store) throw new Error("Product store not found");\n\n      assertVerifiedMarketplaceReview({\n        actor: { id: user.id, dropiRole: user.dropiRole, isActive: user.isActive },\n        order: {\n          id: order.id,\n          customerId: order.customerId,\n          merchantId: order.merchantId,\n          status: order.status,\n          items: order.items,\n        },\n        product: { id: product.id, storeOwnerId: store.ownerId },\n      });\n\n      await db.insert(productReviews).values({\n        productId: input.productId,\n        storeId: product.storeId,\n        orderId: input.orderId,\n        userId: user.id,\n        overallRating: input.overallRating,\n        qualityRating: input.qualityRating,\n        comment: input.comment || null,\n        isVerifiedPurchase: true,\n      });\n\n      const [reviewCount] = await db.select({ count: sql<number>`COUNT(*)` })\n        .from(productReviews)\n        .where(eq(productReviews.storeId, product.storeId));\n      await db.update(stores).set({ totalReviews: reviewCount?.count || 0 }).where(eq(stores.id, product.storeId));\n\n      // Reuse the canonical weighted Trust Score engine; never replace it with a simple rating average.\n      const trust = await updateStoreTrustScore(product.storeId);\n\n      return { success: true, trustScore: trust.score, badge: trust.badge };\n'''
replace_once("server/marketplace-router.ts", old_review, new_review)

# Trust engine: derive order completion evidence from canonical orders, not stale store counters.
replace_once(
    "server/trust-engine.ts",
    'import { stores, products, productReviews, sellerBadges, storeAnalytics } from "../drizzle/schema";\n',
    'import { stores, products, productReviews, sellerBadges, storeAnalytics, orders } from "../drizzle/schema";\n',
)
old_stats = '''  // Fetch analytics (latest monthly period for order stats)\n  const analytics = await db.select().from(storeAnalytics)\n    .where(and(eq(storeAnalytics.storeId, storeId), eq(storeAnalytics.periodType, "monthly")))\n    .orderBy(desc(storeAnalytics.calculatedAt))\n    .limit(6); // Last 6 months\n\n  // Aggregate order stats from analytics\n  const totalOrders = analytics.reduce((sum, a) => sum + a.totalOrders, 0) || store.totalOrders;\n  const completedOrders = analytics.reduce((sum, a) => sum + a.completedOrders, 0) || store.totalOrders;\n  const cancelledOrders = analytics.reduce((sum, a) => sum + a.cancelledOrders, 0);\n'''
new_stats = '''  // Canonical Marketplace lifecycle rows are the authoritative order evidence.\n  // Pre-calculated analytics remain useful for reporting, but must not override live order truth.\n  const marketplaceOrders = await db.select({ status: orders.status })\n    .from(orders)\n    .where(eq(orders.merchantId, store.ownerId));\n  const totalOrders = marketplaceOrders.length;\n  const completedOrders = marketplaceOrders.filter((order) => order.status === "completed").length;\n  const cancelledOrders = marketplaceOrders.filter((order) => order.status === "cancelled").length;\n'''
replace_once("server/trust-engine.ts", old_stats, new_stats)

# Merchant dashboard: use complete portfolio aggregate, keep limit-5 query only for recent product list.
replace_once(
    "app/merchant/dashboard.tsx",
    '''  const storeQuery = trpc.store.getMyStore.useQuery();\n  const productsQuery = trpc.product.myProducts.useQuery({ limit: 5 });\n\n  const store = storeQuery.data;\n  const products = productsQuery.data;\n''',
    '''  const storeQuery = trpc.store.getMyStore.useQuery();\n  const productsQuery = trpc.product.myProducts.useQuery({ limit: 5 });\n  const portfolioQuery = trpc.store.portfolioSummary.useQuery();\n\n  const store = storeQuery.data;\n  const products = productsQuery.data;\n  const portfolio = portfolioQuery.data;\n''',
)
replace_once(
    "app/merchant/dashboard.tsx",
    '    Promise.all([storeQuery.refetch(), productsQuery.refetch()]).finally(() => setRefreshing(false));\n',
    '    Promise.all([storeQuery.refetch(), productsQuery.refetch(), portfolioQuery.refetch()]).finally(() => setRefreshing(false));\n',
)
replace_once(
    "app/merchant/dashboard.tsx",
    '''  const pendingCount = products?.products.filter((p: any) => p.status === "pending_review").length || 0;\n  const activeCount = products?.products.filter((p: any) => p.status === "approved").length || 0;\n  const draftCount = products?.products.filter((p: any) => p.status === "draft").length || 0;\n''',
    '''  const pendingCount = portfolio?.products.pendingReview || 0;\n  const activeCount = portfolio?.products.live || 0;\n  const draftCount = portfolio?.products.drafts || 0;\n  const needsAttention = portfolio?.listingQuality.needsAttention || 0;\n''',
)
replace_once(
    "app/merchant/dashboard.tsx",
    '''            <View className="flex-row items-center mt-1">\n              <BadgeChip label={store?.status === "active" ? "Active" : store?.status === "pending" ? "Pending Approval" : "Suspended"} color={statusColor} />\n              <BadgeChip label={store?.type === "internal" ? "Internal Store" : "External Store"} color="#6366F1" />\n            </View>\n''',
    '''            <View className="flex-row items-center mt-1">\n              <BadgeChip label={store?.status === "active" ? "Active" : store?.status === "pending" ? "Pending Approval" : "Suspended"} color={statusColor} />\n              <BadgeChip label={store?.type === "internal" ? "Internal Store" : "External Store"} color="#6366F1" />\n            </View>\n            <Text className="text-xs text-muted mt-2">📍 {portfolio?.store.zone || store?.zone} • {portfolio?.store.category || store?.category}</Text>\n''',
)
replace_once(
    "app/merchant/dashboard.tsx",
    '<Text className="text-lg font-bold text-foreground">{store?.totalOrders || 0}</Text>\n',
    '<Text className="text-lg font-bold text-foreground">{portfolio?.orders.total || 0}</Text>\n',
)
replace_once(
    "app/merchant/dashboard.tsx",
    '''        <View className="flex-row gap-3 mb-4">\n          <StatCard title="Active Products" value={String(activeCount)} color="#10B981" />\n          <StatCard title="Pending Review" value={String(pendingCount)} color="#F59E0B" />\n          <StatCard title="Drafts" value={String(draftCount)} color="#6B7280" />\n        </View>\n''',
    '''        <View className="flex-row gap-3 mb-3">\n          <StatCard title="Active Products" value={String(activeCount)} color="#10B981" />\n          <StatCard title="Pending Review" value={String(pendingCount)} color="#F59E0B" />\n          <StatCard title="Drafts" value={String(draftCount)} color="#6B7280" />\n        </View>\n        <View className="flex-row gap-3 mb-4">\n          <StatCard title="New Orders" value={String(portfolio?.orders.new || 0)} color="#0066FF" />\n          <StatCard title="Ready" value={String(portfolio?.orders.ready || 0)} color="#10B981" />\n          <StatCard title="Needs Attention" value={String(needsAttention)} color="#EF4444" />\n        </View>\n        <View className="bg-surface border border-border rounded-xl p-4 mb-4">\n          <Text className="text-xs text-muted">Completed-order revenue</Text>\n          <Text className="text-xl font-bold text-foreground mt-1">RON {portfolio?.completedRevenue.toFixed(2) || "0.00"}</Text>\n          <Text className="text-xs text-muted mt-1">Listing approval: {portfolio?.listingQuality.approvalRate == null ? "Not enough reviewed listings" : `${portfolio.listingQuality.approvalRate}%`}</Text>\n        </View>\n''',
)

print("Merchant portfolio and verified reputation wiring applied.")
