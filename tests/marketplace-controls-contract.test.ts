import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { moderateProduct } from "../server/moderation-engine";

const marketplaceRouter = readFileSync("server/marketplace-router.ts", "utf8");
const orderService = readFileSync("server/order-management-service.ts", "utf8");
const operationsRouter = readFileSync("server/operations-router.ts", "utf8");
const productNew = readFileSync("app/merchant/product-new.tsx", "utf8");
const storeSetup = readFileSync("app/merchant/store-setup.tsx", "utf8");
const merchantProduct = readFileSync("app/merchant/product/[id].tsx", "utf8");
const adminOverview = readFileSync("app/admin/marketplace-overview.tsx", "utf8");

test("unknown category becomes a critical moderation rejection", () => {
  const result = moderateProduct({
    name: "Ordinary Product",
    description: "A sufficiently detailed product description for review.",
    price: 100,
    currency: "RON",
    category: "Anything Goes",
    weight: 100,
    dimensions: { l: 10, w: 10, h: 10 },
    images: ["https://example.test/product.jpg"],
    isFragile: false,
    requiresSpecialPackaging: false,
    stock: 1,
  }, { trustScore: 90, totalOrders: 100, previousRejections: 0 });

  assert.equal(result.autoAction, "reject");
  assert.ok(result.violations.some((violation) => violation.rule === "CATEGORY_NOT_ELIGIBLE" && violation.severity === "critical"));
});

test("public store and product discovery are explicitly zone scoped", () => {
  assert.match(marketplaceRouter, /getById: publicProcedure[\s\S]*zone: z\.string\(\)\.min\(1\)\.max\(100\)/);
  assert.match(marketplaceRouter, /listActive: publicProcedure[\s\S]*zone: z\.string\(\)\.min\(1\)\.max\(100\)/);
  assert.match(marketplaceRouter, /eq\(stores\.status, "active"\)/);
  assert.match(marketplaceRouter, /eq\(products\.zone, zone\)/);
  assert.match(marketplaceRouter, /eq\(stores\.zone, zone\)/);
});

test("public product discovery suppresses unstocked and uncontrolled listings", () => {
  assert.match(marketplaceRouter, /inArray\(products\.category, MARKETPLACE_CATEGORY_LABELS\)/);
  assert.match(marketplaceRouter, /or\(isNull\(products\.stock\), gt\(products\.stock, 0\)\)/);
  assert.match(marketplaceRouter, /JSON_CONTAINS/);
  assert.match(marketplaceRouter, /gte\(products\.price/);
  assert.match(marketplaceRouter, /lte\(products\.price/);
});

test("merchant product detail is private and public detail cannot expose drafts", () => {
  assert.match(marketplaceRouter, /getOwnedById: protectedProcedure/);
  assert.match(merchantProduct, /trpc\.product\.getOwnedById\.useQuery/);
  assert.doesNotMatch(merchantProduct, /trpc\.product\.getById\.useQuery/);
  assert.match(marketplaceRouter, /eq\(products\.status, "approved"\)/);
  assert.match(marketplaceRouter, /eq\(products\.isActive, true\)/);
});

test("admin approval reruns policy and blocks critical violations", () => {
  assert.match(marketplaceRouter, /if \(input\.action === "approve"\)/);
  assert.match(marketplaceRouter, /const policyCheck = moderateProduct/);
  assert.match(marketplaceRouter, /violation\.severity === "critical"/);
});

test("product zone derives from store and merchant form cannot override it", () => {
  assert.match(marketplaceRouter, /const storeZone = normalizeMarketplaceZone\(store\.zone\)/);
  assert.match(marketplaceRouter, /zone: storeZone/);
  assert.doesNotMatch(productNew, /const \[zone, setZone\]/);
  assert.doesNotMatch(productNew, /zone: zone\.trim\(\)/);
  assert.match(productNew, /Product listings inherit the store zone and cannot override it/);
});


test("moving a store to another zone forces approved listings back through review", () => {
  assert.match(marketplaceRouter, /updateData\.zone && !sameMarketplaceZone\(updateData\.zone, store\.zone\)/);
  assert.match(marketplaceRouter, /status: "pending_review", isActive: false/);
  assert.match(marketplaceRouter, /eq\(products\.status, "approved"\)/);
});

test("store setup uses governed categories and no fake default zone or category", () => {
  assert.match(storeSetup, /MARKETPLACE_CATEGORY_POLICIES/);
  assert.doesNotMatch(storeSetup, /zone: zone\.trim\(\) \|\| "default"/);
  assert.doesNotMatch(storeSetup, /category: category\.trim\(\) \|\| "general"/);
});

test("checkout prep requires zone and validates listing visibility", () => {
  assert.match(operationsRouter, /zone: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(100\)/);
  assert.match(orderService, /requestedZone = normalizeMarketplaceZone\(input\.zone\)/);
  assert.match(orderService, /evaluateMarketplaceListingVisibility/);
  assert.match(orderService, /zone: requestedZone/);
});

test("admin overview no longer misuses public product discovery for moderation stats", () => {
  assert.match(adminOverview, /trpc\.product\.pendingReview\.useQuery/);
  assert.doesNotMatch(adminOverview, /trpc\.product\.listActive\.useQuery/);
});
