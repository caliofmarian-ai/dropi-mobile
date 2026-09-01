import assert from "node:assert/strict";
import test from "node:test";
import { buildMerchantPortfolioSummary } from "../server/merchant-portfolio-service";

test("portfolio summary counts the complete product set instead of a recent-page sample", () => {
  const summary = buildMerchantPortfolioSummary({
    products: [
      { status: "approved", isActive: true, stock: 4 },
      { status: "approved", isActive: true, stock: 0 },
      { status: "pending_review", isActive: false, stock: 5 },
      { status: "draft", isActive: false, stock: null },
      { status: "rejected", isActive: false, stock: 1 },
      { status: "suspended", isActive: false, stock: 3 },
    ],
    orders: [],
  });

  assert.deepEqual(summary.products, {
    total: 6,
    live: 2,
    pendingReview: 1,
    drafts: 1,
    rejected: 1,
    suspended: 1,
    outOfStock: 1,
  });
  assert.equal(summary.listingQuality.needsAttention, 3);
});

test("portfolio summary derives order intake and revenue from real lifecycle states", () => {
  const summary = buildMerchantPortfolioSummary({
    products: [],
    orders: [
      { status: "initiated", totalAmount: "10.00" },
      { status: "validated", totalAmount: "20.00" },
      { status: "preparing", totalAmount: "30.00" },
      { status: "ready", totalAmount: "40.00" },
      { status: "accepted", totalAmount: "50.00" },
      { status: "in_execution", totalAmount: "60.00" },
      { status: "completed", totalAmount: "70.50" },
      { status: "completed", totalAmount: 29.5 },
      { status: "cancelled", totalAmount: "80.00" },
      { status: "fallback", totalAmount: "90.00" },
    ],
  });

  assert.deepEqual(summary.orders, {
    total: 10,
    new: 2,
    preparing: 1,
    ready: 1,
    accepted: 1,
    inExecution: 1,
    completed: 2,
    cancelled: 1,
    fallback: 1,
  });
  assert.equal(summary.completedRevenue, 100);
});

test("listing approval rate uses reviewed listings and stays null when there is no evidence", () => {
  assert.equal(buildMerchantPortfolioSummary({ products: [], orders: [] }).listingQuality.approvalRate, null);

  const summary = buildMerchantPortfolioSummary({
    products: [
      { status: "approved", isActive: true, stock: 1 },
      { status: "approved", isActive: true, stock: 1 },
      { status: "rejected", isActive: false, stock: 1 },
      { status: "draft", isActive: false, stock: 1 },
    ],
    orders: [],
  });
  assert.equal(summary.listingQuality.approvalRate, 67);
});
