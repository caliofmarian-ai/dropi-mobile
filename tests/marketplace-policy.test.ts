import assert from "node:assert/strict";
import test from "node:test";
import {
  MARKETPLACE_CATEGORY_POLICIES,
  evaluateMarketplaceListingVisibility,
  getMarketplaceCategoryPolicy,
  normalizeMarketplaceCategory,
  normalizeMarketplaceZone,
  sameMarketplaceZone,
} from "../shared/marketplace-policy";

test("controlled Marketplace exposes one non-empty category policy set", () => {
  assert.ok(MARKETPLACE_CATEGORY_POLICIES.length > 0);
  assert.equal(new Set(MARKETPLACE_CATEGORY_POLICIES.map((item) => item.id)).size, MARKETPLACE_CATEGORY_POLICIES.length);
  assert.equal(new Set(MARKETPLACE_CATEGORY_POLICIES.map((item) => item.label)).size, MARKETPLACE_CATEGORY_POLICIES.length);
});

test("category labels and stable ids normalize to the same governed category", () => {
  assert.equal(normalizeMarketplaceCategory("electronics"), "Electronics");
  assert.equal(normalizeMarketplaceCategory(" Electronics "), "Electronics");
  assert.equal(normalizeMarketplaceCategory("food-groceries"), "Food & Groceries");
  assert.equal(normalizeMarketplaceCategory("Food & Groceries"), "Food & Groceries");
});

test("unknown categories cannot enter the controlled Marketplace", () => {
  assert.equal(getMarketplaceCategoryPolicy("anything-goes"), null);
  assert.throws(() => normalizeMarketplaceCategory("anything-goes"), /not eligible/i);
});

test("category financial limits come from the same policy object", () => {
  const electronics = getMarketplaceCategoryPolicy("Electronics");
  assert.ok(electronics);
  assert.equal(electronics.minPrice, 5);
  assert.equal(electronics.maxPrice, 50000);
});

test("zones are normalized without inventing a geographic registry", () => {
  assert.equal(normalizeMarketplaceZone("  Manila   Central  "), "Manila Central");
  assert.equal(sameMarketplaceZone("Manila Central", " manila   central "), true);
  assert.equal(sameMarketplaceZone("Manila Central", "Makati"), false);
  assert.throws(() => normalizeMarketplaceZone("   "), /required/i);
});

test("approved listing is visible only when category, stock and all zone scopes agree", () => {
  const result = evaluateMarketplaceListingVisibility({
    status: "approved",
    isActive: true,
    stock: 4,
    category: "Electronics",
    productZone: "Manila Central",
    storeZone: "Manila Central",
    requestedZone: "manila central",
  });
  assert.deepEqual(result, { visible: true, purchasable: true, reasons: [] });
});

test("out-of-stock and cross-zone listings are suppressed", () => {
  const result = evaluateMarketplaceListingVisibility({
    status: "approved",
    isActive: true,
    stock: 0,
    category: "Electronics",
    productZone: "Makati",
    storeZone: "Makati",
    requestedZone: "Manila Central",
  });
  assert.equal(result.visible, false);
  assert.deepEqual(result.reasons.sort(), ["OUTSIDE_REQUESTED_ZONE", "OUT_OF_STOCK"].sort());
});

test("store/product zone mismatch is never considered purchasable", () => {
  const result = evaluateMarketplaceListingVisibility({
    status: "approved",
    isActive: true,
    stock: null,
    category: "Electronics",
    productZone: "Makati",
    storeZone: "Manila Central",
    requestedZone: "Makati",
  });
  assert.equal(result.purchasable, false);
  assert.ok(result.reasons.includes("STORE_PRODUCT_ZONE_MISMATCH"));
});
