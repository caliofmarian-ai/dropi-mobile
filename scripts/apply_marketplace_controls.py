#!/usr/bin/env python3
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, found {count}: {old[:160]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


# ---- moderation-engine: single governed category vocabulary and price policy ----
replace_once(
    "server/moderation-engine.ts",
    "/**\n * DROPi Auto-Moderation Engine — Sprint B\n",
    'import { getMarketplaceCategoryPolicy } from "../shared/marketplace-policy";\n\n/**\n * DROPi Auto-Moderation Engine — Sprint B\n',
)
start = Path("server/moderation-engine.ts").read_text(encoding="utf-8")
price_start = start.index("// ===== PRICE LIMITS PER CATEGORY =====")
price_end = start.index("// ===== WEIGHT LIMITS =====")
start = start[:price_start] + "// Category eligibility and financial limits are governed by shared/marketplace-policy.ts.\n\n" + start[price_end:]
Path("server/moderation-engine.ts").write_text(start, encoding="utf-8")
replace_once(
    "server/moderation-engine.ts",
    '''  // Rule 2: Price limits\n  const limits = PRICE_LIMITS[product.category] || DEFAULT_PRICE_LIMITS;\n  if (product.price < limits.min) {\n    violations.push({\n      rule: "PRICE_TOO_LOW",\n      severity: "warning",\n      message: `Price ${product.price} ${product.currency} is below minimum (${limits.min} ${product.currency}) for category "${product.category}".`,\n      field: "price",\n    });\n  }\n  if (product.price > limits.max) {\n    violations.push({\n      rule: "PRICE_TOO_HIGH",\n      severity: "warning",\n      message: `Price ${product.price} ${product.currency} exceeds maximum (${limits.max} ${product.currency}) for category "${product.category}". High-value items require manual review.`,\n      field: "price",\n    });\n  }\n''',
    '''  // Rule 2: controlled category + price limits from the shared policy.\n  const categoryPolicy = getMarketplaceCategoryPolicy(product.category);\n  if (!categoryPolicy) {\n    violations.push({\n      rule: "CATEGORY_NOT_ELIGIBLE",\n      severity: "critical",\n      message: `Category "${product.category}" is not eligible for the controlled DROPi Marketplace.`,\n      field: "category",\n    });\n  } else {\n    if (product.price < categoryPolicy.minPrice) {\n      violations.push({\n        rule: "PRICE_TOO_LOW",\n        severity: "warning",\n        message: `Price ${product.price} ${product.currency} is below minimum (${categoryPolicy.minPrice} ${product.currency}) for category "${categoryPolicy.label}".`,\n        field: "price",\n      });\n    }\n    if (product.price > categoryPolicy.maxPrice) {\n      violations.push({\n        rule: "PRICE_TOO_HIGH",\n        severity: "warning",\n        message: `Price ${product.price} ${product.currency} exceeds maximum (${categoryPolicy.maxPrice} ${product.currency}) for category "${categoryPolicy.label}". High-value items require manual review.`,\n        field: "price",\n      });\n    }\n  }\n''',
)

# ---- marketplace-router imports ----
replace_once(
    "server/marketplace-router.ts",
    'import { eq, and, desc, sql, like, or } from "drizzle-orm";\n',
    'import { eq, and, desc, sql, like, or, gt, gte, lte, isNull, inArray } from "drizzle-orm";\n',
)
replace_once(
    "server/marketplace-router.ts",
    'import { notifyOwner } from "./_core/notification";\n',
    'import { notifyOwner } from "./_core/notification";\nimport { MARKETPLACE_CATEGORY_POLICIES, normalizeMarketplaceCategory, normalizeMarketplaceZone, sameMarketplaceZone } from "../shared/marketplace-policy";\n\nconst MARKETPLACE_CATEGORY_LABELS = MARKETPLACE_CATEGORY_POLICIES.map((policy) => policy.label);\n',
)

# Store create: category and zone are governed before persistence.
replace_once(
    "server/marketplace-router.ts",
    '''      // Generate API key for external stores\n      const apiKey = input.type === "external" ? crypto.randomBytes(32).toString("hex") : null;\n\n      await db.insert(stores).values({\n''',
    '''      const normalizedZone = normalizeMarketplaceZone(input.zone);\n      const normalizedCategory = normalizeMarketplaceCategory(input.category);\n\n      // Generate API key for external stores\n      const apiKey = input.type === "external" ? crypto.randomBytes(32).toString("hex") : null;\n\n      await db.insert(stores).values({\n''',
)
replace_once("server/marketplace-router.ts", "        zone: input.zone,\n        category: input.category,\n", "        zone: normalizedZone,\n        category: normalizedCategory,\n")

# Store update: normalize controlled fields and keep product zone aligned with store zone.
replace_once(
    "server/marketplace-router.ts",
    '''      if (input.externalUrl !== undefined) updateData.externalUrl = input.externalUrl;\n      if (input.zone) updateData.zone = input.zone;\n      if (input.category) updateData.category = input.category;\n''',
    '''      if (input.externalUrl !== undefined) updateData.externalUrl = input.externalUrl;\n      if (input.zone) updateData.zone = normalizeMarketplaceZone(input.zone);\n      if (input.category) updateData.category = normalizeMarketplaceCategory(input.category);\n''',
)
replace_once(
    "server/marketplace-router.ts",
    '''      await db.update(stores).set(updateData).where(eq(stores.id, store.id));\n      return { success: true };\n''',
    '''      await db.update(stores).set(updateData).where(eq(stores.id, store.id));\n      if (updateData.zone) {\n        await db.update(products).set({ zone: updateData.zone }).where(eq(products.storeId, store.id));\n      }\n      return { success: true };\n''',
)

# Public store views: active + explicit zone only.
replace_once(
    "server/marketplace-router.ts",
    '''  // Get store by ID (public)\n  getById: publicProcedure\n    .input(z.object({ id: z.number() }))\n    .query(async ({ input }) => {\n      const db = await getDb();\n      if (!db) return null;\n\n      const [store] = await db.select().from(stores).where(eq(stores.id, input.id)).limit(1);\n      return store || null;\n    }),\n''',
    '''  // Get store by ID (public marketplace view — active and zone-scoped only)\n  getById: publicProcedure\n    .input(z.object({ id: z.number(), zone: z.string().min(1).max(100) }))\n    .query(async ({ input }) => {\n      const db = await getDb();\n      if (!db) return null;\n      const zone = normalizeMarketplaceZone(input.zone);\n\n      const [store] = await db.select().from(stores).where(and(\n        eq(stores.id, input.id),\n        eq(stores.status, "active"),\n        eq(stores.zone, zone),\n      )).limit(1);\n      return store || null;\n    }),\n''',
)
replace_once(
    "server/marketplace-router.ts",
    '      zone: z.string().optional(),\n      category: z.string().optional(),\n      limit: z.number().min(1).max(50).default(20),\n',
    '      zone: z.string().min(1).max(100),\n      category: z.string().optional(),\n      limit: z.number().min(1).max(50).default(20),\n',
)
replace_once(
    "server/marketplace-router.ts",
    '''      const conditions = [eq(stores.status, "active")];\n      if (input.zone) conditions.push(eq(stores.zone, input.zone));\n      if (input.category) conditions.push(eq(stores.category, input.category));\n''',
    '''      const zone = normalizeMarketplaceZone(input.zone);\n      const conditions = [eq(stores.status, "active"), eq(stores.zone, zone)];\n      if (input.category) conditions.push(eq(stores.category, normalizeMarketplaceCategory(input.category)));\n''',
)

# Product create: zone derives from the store; supplied legacy zone must match.
replace_once(
    "server/marketplace-router.ts",
    '      zone: z.string().min(1).max(100),\n      isFragile: z.boolean().default(false),\n',
    '      zone: z.string().min(1).max(100).optional(),\n      isFragile: z.boolean().default(false),\n',
)
replace_once(
    "server/marketplace-router.ts",
    '''      if (!store) throw new Error("You must create a store first");\n      if (store.status !== "active") throw new Error("Your store must be active to add products");\n\n      // Calculate delivery modes\n      const deliveryModes = calculateDeliveryModes(input.weight, input.dimensions);\n''',
    '''      if (!store) throw new Error("You must create a store first");\n      if (store.status !== "active") throw new Error("Your store must be active to add products");\n\n      const normalizedCategory = normalizeMarketplaceCategory(input.category);\n      const storeZone = normalizeMarketplaceZone(store.zone);\n      if (input.zone && !sameMarketplaceZone(input.zone, storeZone)) {\n        throw new Error("Product zone must match the merchant store operating zone.");\n      }\n\n      // Calculate delivery modes\n      const deliveryModes = calculateDeliveryModes(input.weight, input.dimensions);\n''',
)
replace_once("server/marketplace-router.ts", "        category: input.category,\n", "        category: normalizedCategory,\n")
replace_once("server/marketplace-router.ts", "        zone: input.zone,\n        isFragile: input.isFragile,\n", "        zone: storeZone,\n        isFragile: input.isFragile,\n")

# Product update: category stays governed, and changing it invalidates prior approval.
replace_once("server/marketplace-router.ts", "      if (input.category) updateData.category = input.category;\n", "      if (input.category) updateData.category = normalizeMarketplaceCategory(input.category);\n")
replace_once(
    "server/marketplace-router.ts",
    '      if (product.status === "approved" && (input.name || input.description || input.price || input.weight || input.dimensions)) {\n',
    '      if (product.status === "approved" && (input.name || input.description || input.price || input.category || input.weight || input.dimensions)) {\n',
)

# Merchant private detail endpoint, separate from public discovery.
marker = '''  // Get single product by ID (public)\n  getById: publicProcedure\n'''
owned = '''  // Get single owned product by ID (merchant private view)\n  getOwnedById: protectedProcedure\n    .input(z.object({ id: z.number() }))\n    .query(async ({ ctx, input }) => {\n      const db = await getDb();\n      if (!db) return null;\n      const user = ctx.user as any;\n      const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);\n      if (!store) return null;\n      const [product] = await db.select().from(products).where(and(eq(products.id, input.id), eq(products.storeId, store.id))).limit(1);\n      if (!product) return null;\n      const badges = await db.select().from(deliveryBadges).where(eq(deliveryBadges.productId, input.id));\n      const reviews = await db.select().from(productReviews).where(eq(productReviews.productId, input.id)).orderBy(desc(productReviews.createdAt)).limit(10);\n      return { ...product, deliveryBadges: badges, reviews };\n    }),\n\n  // Get single product by ID (public marketplace view — approved, active, stocked and zone-scoped)\n  getById: publicProcedure\n'''
replace_once("server/marketplace-router.ts", marker, owned)
replace_once(
    "server/marketplace-router.ts",
    '''    .input(z.object({ id: z.number() }))\n    .query(async ({ input }) => {\n      const db = await getDb();\n      if (!db) return null;\n\n      const [product] = await db.select().from(products).where(eq(products.id, input.id)).limit(1);\n      if (!product) return null;\n\n      // Get delivery badges\n      const badges = await db.select().from(deliveryBadges).where(eq(deliveryBadges.productId, input.id));\n\n      // Get reviews\n      const reviews = await db.select().from(productReviews).where(eq(productReviews.productId, input.id)).orderBy(desc(productReviews.createdAt)).limit(10);\n\n      return { ...product, deliveryBadges: badges, reviews };\n    }),\n''',
    '''    .input(z.object({ id: z.number(), zone: z.string().min(1).max(100) }))\n    .query(async ({ input }) => {\n      const db = await getDb();\n      if (!db) return null;\n      const zone = normalizeMarketplaceZone(input.zone);\n\n      const [row] = await db.select().from(products)\n        .innerJoin(stores, eq(products.storeId, stores.id))\n        .where(and(\n          eq(products.id, input.id),\n          eq(products.status, "approved"),\n          eq(products.isActive, true),\n          eq(stores.status, "active"),\n          eq(products.zone, zone),\n          eq(stores.zone, zone),\n          inArray(products.category, MARKETPLACE_CATEGORY_LABELS),\n          or(isNull(products.stock), gt(products.stock, 0)),\n        )).limit(1);\n      const product = row?.products;\n      if (!product) return null;\n\n      const badges = await db.select().from(deliveryBadges).where(eq(deliveryBadges.productId, input.id));\n      const reviews = await db.select().from(productReviews).where(eq(productReviews.productId, input.id)).orderBy(desc(productReviews.createdAt)).limit(10);\n      return { ...product, deliveryBadges: badges, reviews };\n    }),\n''',
)

# Public product discovery: zone mandatory; enforce store state, stock, category, price and requested delivery mode.
replace_once(
    "server/marketplace-router.ts",
    '      zone: z.string().optional(),\n      category: z.string().optional(),\n      search: z.string().optional(),\n',
    '      zone: z.string().min(1).max(100),\n      category: z.string().optional(),\n      search: z.string().optional(),\n',
)
replace_once(
    "server/marketplace-router.ts",
    '''      const conditions: any[] = [eq(products.status, "approved"), eq(products.isActive, true)];\n      if (input.storeId) conditions.push(eq(products.storeId, input.storeId));\n      if (input.zone) conditions.push(eq(products.zone, input.zone));\n      if (input.category) conditions.push(eq(products.category, input.category));\n      if (input.search) conditions.push(like(products.name, `%${input.search}%`));\n\n      const where = and(...conditions);\n      const results = await db.select().from(products).where(where).orderBy(desc(products.orderCount)).limit(input.limit).offset(input.offset);\n      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(products).where(where!);\n\n      return { products: results, total: countResult?.count || 0 };\n''',
    '''      const zone = normalizeMarketplaceZone(input.zone);\n      const conditions: any[] = [\n        eq(products.status, "approved"),\n        eq(products.isActive, true),\n        eq(stores.status, "active"),\n        eq(products.zone, zone),\n        eq(stores.zone, zone),\n        inArray(products.category, MARKETPLACE_CATEGORY_LABELS),\n        or(isNull(products.stock), gt(products.stock, 0)),\n      ];\n      if (input.storeId) conditions.push(eq(products.storeId, input.storeId));\n      if (input.category) conditions.push(eq(products.category, normalizeMarketplaceCategory(input.category)));\n      if (input.search) conditions.push(like(products.name, `%${input.search}%`));\n      if (input.minPrice !== undefined) conditions.push(gte(products.price, input.minPrice.toFixed(2)));\n      if (input.maxPrice !== undefined) conditions.push(lte(products.price, input.maxPrice.toFixed(2)));\n      if (input.deliveryMode) conditions.push(sql`JSON_CONTAINS(${products.deliveryModes}, ${JSON.stringify(input.deliveryMode)})`);\n\n      const where = and(...conditions);\n      const joined = await db.select().from(products)\n        .innerJoin(stores, eq(products.storeId, stores.id))\n        .where(where)\n        .orderBy(desc(products.orderCount))\n        .limit(input.limit)\n        .offset(input.offset);\n      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(products)\n        .innerJoin(stores, eq(products.storeId, stores.id))\n        .where(where!);\n\n      return { products: joined.map((row) => row.products), total: countResult?.count || 0 };\n''',
)

# Admin approval may override warnings, never critical policy violations.
replace_once(
    "server/marketplace-router.ts",
    '''      const user = ctx.user as any;\n      const newStatus = input.action === "approve" ? "approved" : "rejected";\n\n      await db.update(products).set({\n''',
    '''      const user = ctx.user as any;\n      const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);\n      if (!product) throw new Error("Product not found");\n\n      if (input.action === "approve") {\n        const [store] = await db.select().from(stores).where(eq(stores.id, product.storeId)).limit(1);\n        if (!store || store.status !== "active") throw new Error("Product store must be active before approval");\n        if (!sameMarketplaceZone(product.zone, store.zone)) throw new Error("Product zone no longer matches its store zone");\n        const [rejCount] = await db.select({ count: sql<number>`count(*)` }).from(products)\n          .where(and(eq(products.storeId, store.id), eq(products.status, "rejected")));\n        const policyCheck = moderateProduct({\n          name: product.name,\n          description: product.description,\n          price: parseFloat(product.price as any),\n          currency: product.currency,\n          category: product.category,\n          weight: parseFloat(product.weight as any),\n          dimensions: product.dimensions as any,\n          images: product.images as string[] | null,\n          isFragile: product.isFragile,\n          requiresSpecialPackaging: product.requiresSpecialPackaging,\n          stock: product.stock,\n        }, { trustScore: store.trustScore, totalOrders: store.totalOrders, previousRejections: rejCount?.count || 0 });\n        if (policyCheck.violations.some((violation) => violation.severity === "critical")) {\n          throw new Error(formatViolationsForNote(policyCheck));\n        }\n      }\n\n      const newStatus = input.action === "approve" ? "approved" : "rejected";\n\n      await db.update(products).set({\n''',
)

# ---- Order checkout prep must be explicitly zone-scoped and validate every listing ----
replace_once(
    "server/order-management-service.ts",
    'import { sendPreferenceAwarePush } from "./preference-aware-push";\n',
    'import { sendPreferenceAwarePush } from "./preference-aware-push";\nimport { evaluateMarketplaceListingVisibility, normalizeMarketplaceZone, sameMarketplaceZone } from "../shared/marketplace-policy";\n',
)
replace_once(
    "server/order-management-service.ts",
    '''  items: MarketplaceOrderLineInput[];\n  deliveryAddress: string;\n}): Promise<{ orderId: number; orderUid: string; status: "initiated" }> {\n''',
    '''  items: MarketplaceOrderLineInput[];\n  deliveryAddress: string;\n  zone: string;\n}): Promise<{ orderId: number; orderUid: string; status: "initiated" }> {\n''',
)
replace_once(
    "server/order-management-service.ts",
    '''  const store = storeRows[0];\n  if (!store) throw new Error("Active Marketplace store not found.");\n\n  const normalizedItems = input.items.filter(\n''',
    '''  const store = storeRows[0];\n  if (!store) throw new Error("Active Marketplace store not found.");\n  const requestedZone = normalizeMarketplaceZone(input.zone);\n  if (!sameMarketplaceZone(requestedZone, store.zone)) {\n    throw new Error("Selected Marketplace store is outside the requested zone.");\n  }\n\n  const normalizedItems = input.items.filter(\n''',
)
replace_once(
    "server/order-management-service.ts",
    '''    const product = productsById.get(line.productId)!;\n    if (product.stock != null && product.stock < line.quantity) {\n      throw new Error(`${product.name} does not have enough stock.`);\n    }\n\n    const unitPrice = toNumber(product.price);\n''',
    '''    const product = productsById.get(line.productId)!;\n    const visibility = evaluateMarketplaceListingVisibility({\n      status: product.status,\n      isActive: product.isActive,\n      stock: product.stock,\n      category: product.category,\n      productZone: product.zone,\n      storeZone: store.zone,\n      requestedZone,\n    });\n    if (!visibility.purchasable) {\n      throw new Error(`${product.name} is not purchasable in the requested Marketplace zone (${visibility.reasons.join(", ")}).`);\n    }\n    if (product.stock != null && product.stock < line.quantity) {\n      throw new Error(`${product.name} does not have enough stock.`);\n    }\n\n    const unitPrice = toNumber(product.price);\n''',
)
replace_once("server/order-management-service.ts", "      zone: store.zone,\n", "      zone: requestedZone,\n")

replace_once(
    "server/operations-router.ts",
    '''        items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive() })).min(1),\n        deliveryAddress: z.string().trim().min(3).max(1000),\n''',
    '''        items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive() })).min(1),\n        deliveryAddress: z.string().trim().min(3).max(1000),\n        zone: z.string().trim().min(1).max(100),\n''',
)
replace_once(
    "server/operations-router.ts",
    '''        items: input.items,\n        deliveryAddress: input.deliveryAddress,\n''',
    '''        items: input.items,\n        deliveryAddress: input.deliveryAddress,\n        zone: input.zone,\n''',
)

# ---- Merchant UI uses governed categories; product zone comes from store, not product input ----
replace_once(
    "app/merchant/product-new.tsx",
    'import { safeGoBack } from "@/lib/safe-back";\n\nconst CATEGORIES = [\n  "Food & Groceries",\n  "Electronics",\n  "Clothing & Fashion",\n  "Health & Beauty",\n  "Home & Garden",\n  "Sports & Outdoors",\n  "Books & Stationery",\n  "Toys & Games",\n  "Automotive",\n  "Pet Supplies",\n  "Other",\n];\n',
    'import { safeGoBack } from "@/lib/safe-back";\nimport { MARKETPLACE_CATEGORY_POLICIES } from "@/shared/marketplace-policy";\n',
)
replace_once(
    "app/merchant/product-new.tsx",
    '''  const createMutation = trpc.product.create.useMutation();\n  const submitMutation = trpc.product.submitForReview.useMutation();\n''',
    '''  const createMutation = trpc.product.create.useMutation();\n  const submitMutation = trpc.product.submitForReview.useMutation();\n  const storeQuery = trpc.store.getMyStore.useQuery();\n''',
)
replace_once("app/merchant/product-new.tsx", '  const [zone, setZone] = useState("");\n', "")
replace_once("app/merchant/product-new.tsx", '    if (!zone.trim()) { Alert.alert("Error", "Zone is required for delivery calculation"); return; }\n', "")
replace_once("app/merchant/product-new.tsx", "        zone: zone.trim(),\n", "")
replace_once(
    "app/merchant/product-new.tsx",
    '''            {CATEGORIES.map((cat) => (\n              <TouchableOpacity\n                key={cat}\n                className={`px-4 py-3 border-b border-border ${category === cat ? "bg-primary/10" : ""}`}\n                onPress={() => { setCategory(cat); setShowCategories(false); }}\n              >\n                <Text className={`text-sm ${category === cat ? "text-primary font-semibold" : "text-foreground"}`}>{cat}</Text>\n              </TouchableOpacity>\n            ))}\n''',
    '''            {MARKETPLACE_CATEGORY_POLICIES.map((policy) => (\n              <TouchableOpacity\n                key={policy.id}\n                className={`px-4 py-3 border-b border-border ${category === policy.label ? "bg-primary/10" : ""}`}\n                onPress={() => { setCategory(policy.label); setShowCategories(false); }}\n              >\n                <Text className={`text-sm ${category === policy.label ? "text-primary font-semibold" : "text-foreground"}`}>{policy.label}</Text>\n              </TouchableOpacity>\n            ))}\n''',
)
replace_once(
    "app/merchant/product-new.tsx",
    '''        <Text className="text-sm font-semibold text-foreground mb-2">Zone *</Text>\n        <TextInput\n          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"\n          value={zone}\n          onChangeText={setZone}\n          placeholder="e.g., Bucharest, Cluj-Napoca"\n          placeholderTextColor="#9BA1A6"\n        />\n''',
    '''        <Text className="text-sm font-semibold text-foreground mb-2">Listing Zone</Text>\n        <View className="bg-surface border border-border rounded-xl px-4 py-3 mb-4">\n          <Text className="text-foreground">{storeQuery.data?.zone || "Set the store operating zone first"}</Text>\n          <Text className="text-xs text-muted mt-1">Product listings inherit the store zone and cannot override it.</Text>\n        </View>\n''',
)

# Store setup no longer substitutes fake default/general values and exposes governed category choices.
replace_once("app/merchant/store-setup.tsx", 'import { safeGoBack } from "@/lib/safe-back";\n', 'import { safeGoBack } from "@/lib/safe-back";\nimport { MARKETPLACE_CATEGORY_POLICIES } from "@/shared/marketplace-policy";\n')
replace_once("app/merchant/store-setup.tsx", '  const [category, setCategory] = useState("");\n', '  const [category, setCategory] = useState("");\n  const [showCategories, setShowCategories] = useState(false);\n')
replace_once(
    "app/merchant/store-setup.tsx",
    '''    if (storeType === "external" && !externalUrl.trim()) {\n      Alert.alert("Error", "External URL is required for external stores");\n      return;\n    }\n\n    setSaving(true);\n''',
    '''    if (storeType === "external" && !externalUrl.trim()) {\n      Alert.alert("Error", "External URL is required for external stores");\n      return;\n    }\n    if (!zone.trim()) {\n      Alert.alert("Error", "Operating zone is required");\n      return;\n    }\n    if (!category) {\n      Alert.alert("Error", "Select a controlled Marketplace category");\n      return;\n    }\n\n    setSaving(true);\n''',
)
replace_once("app/merchant/store-setup.tsx", '        zone: zone.trim() || "default",\n        category: category.trim() || "general",\n', '        zone: zone.trim(),\n        category,\n')
replace_once(
    "app/merchant/store-setup.tsx",
    '''        {/* Category */}\n        <Text className="text-sm font-semibold text-foreground mb-2">Store Category</Text>\n        <TextInput\n          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"\n          value={category}\n          onChangeText={setCategory}\n          placeholder="e.g., Food & Groceries, Electronics"\n          placeholderTextColor="#9BA1A6"\n          returnKeyType="next"\n        />\n''',
    '''        {/* Category */}\n        <Text className="text-sm font-semibold text-foreground mb-2">Store Category *</Text>\n        <TouchableOpacity\n          className="bg-surface border border-border rounded-xl px-4 py-3 mb-1"\n          activeOpacity={0.7}\n          onPress={() => setShowCategories(!showCategories)}\n        >\n          <Text className={category ? "text-foreground" : "text-muted"}>{category || "Select a controlled category..."}</Text>\n        </TouchableOpacity>\n        {showCategories && (\n          <View className="bg-surface border border-border rounded-xl mb-4 overflow-hidden">\n            {MARKETPLACE_CATEGORY_POLICIES.map((policy) => (\n              <TouchableOpacity key={policy.id} className={`px-4 py-3 border-b border-border ${category === policy.label ? "bg-primary/10" : ""}`} onPress={() => { setCategory(policy.label); setShowCategories(false); }}>\n                <Text className={`text-sm ${category === policy.label ? "text-primary font-semibold" : "text-foreground"}`}>{policy.label}</Text>\n              </TouchableOpacity>\n            ))}\n          </View>\n        )}\n        {!showCategories && <View className="mb-3" />}\n''',
)

# Merchant private product screen must not use the public discovery endpoint.
replace_once("app/merchant/product/[id].tsx", '  const productQuery = trpc.product.getById.useQuery({ id: parseInt(id || "0") });\n', '  const productQuery = trpc.product.getOwnedById.useQuery({ id: parseInt(id || "0") });\n')

# Admin overview must use the admin moderation queue, not zone-scoped public discovery.
replace_once("app/admin/marketplace-overview.tsx", '  const pendingProducts = trpc.product.listActive.useQuery({ limit: 1 });\n', '  const pendingProducts = trpc.product.pendingReview.useQuery({ limit: 1, offset: 0 });\n')
replace_once("app/admin/marketplace-overview.tsx", '  const isLoading = storeList.isLoading;\n', '  const isLoading = storeList.isLoading || pendingProducts.isLoading;\n')
replace_once("app/admin/marketplace-overview.tsx", '    Promise.all([storeList.refetch()]).finally(() => setRefreshing(false));\n', '    Promise.all([storeList.refetch(), pendingProducts.refetch()]).finally(() => setRefreshing(false));\n')
replace_once("app/admin/marketplace-overview.tsx", '            value="—"\n', '            value={String(pendingProducts.data?.total || 0)}\n')

print("Governed Marketplace controls patch applied.")
