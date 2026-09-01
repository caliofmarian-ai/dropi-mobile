import assert from "node:assert/strict";
import test from "node:test";
import { assertVerifiedMarketplaceReview, extractMarketplaceOrderProductIds } from "../server/marketplace-review-policy";

const actor = { id: 7, dropiRole: "customer", isActive: true };
const order = {
  id: 33,
  customerId: 7,
  merchantId: 21,
  status: "completed",
  items: [
    { productId: 101, name: "A", quantity: 1 },
    { productId: 102, name: "B", quantity: 2 },
  ],
};
const product = { id: 101, storeOwnerId: 21 };

test("extracts only valid positive product ids from order snapshots", () => {
  assert.deepEqual(extractMarketplaceOrderProductIds(order.items), [101, 102]);
  assert.deepEqual(extractMarketplaceOrderProductIds([{ productId: 0 }, { productId: "bad" }, null]), []);
});

test("completed owned purchase containing product is reviewable", () => {
  assert.doesNotThrow(() => assertVerifiedMarketplaceReview({ actor, order, product }));
});

test("non-customer actors cannot create verified purchase reviews", () => {
  assert.throws(
    () => assertVerifiedMarketplaceReview({ actor: { ...actor, dropiRole: "merchant" }, order, product }),
    /active customer/i,
  );
});

test("customer cannot review another customer's order", () => {
  assert.throws(
    () => assertVerifiedMarketplaceReview({ actor: { ...actor, id: 8 }, order, product }),
    /does not belong/i,
  );
});

test("order must be completed before review", () => {
  assert.throws(
    () => assertVerifiedMarketplaceReview({ actor, order: { ...order, status: "in_execution" }, product }),
    /confirmed delivery/i,
  );
});

test("product must belong to the merchant that fulfilled the order", () => {
  assert.throws(
    () => assertVerifiedMarketplaceReview({ actor, order, product: { ...product, storeOwnerId: 999 } }),
    /merchant that fulfilled/i,
  );
});

test("product must be present in the immutable order snapshot", () => {
  assert.throws(
    () => assertVerifiedMarketplaceReview({ actor, order, product: { ...product, id: 999 } }),
    /not present/i,
  );
});
