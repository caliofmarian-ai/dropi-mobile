import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const marketplaceRouter = readFileSync("server/marketplace-router.ts", "utf8");
const trustEngine = readFileSync("server/trust-engine.ts", "utf8");
const merchantDashboard = readFileSync("app/merchant/dashboard.tsx", "utf8");
const portfolioService = readFileSync("server/merchant-portfolio-service.ts", "utf8");

test("review submit verifies authenticated completed purchase before setting verified flag", () => {
  assert.match(marketplaceRouter, /assertVerifiedMarketplaceReview/);
  assert.match(marketplaceRouter, /db\.select\(\)\.from\(orders\).*eq\(orders\.id, input\.orderId\)/s);
  assert.match(marketplaceRouter, /storeOwnerId: store\.ownerId/);
  assert.match(marketplaceRouter, /isVerifiedPurchase: true/);
});

test("review submit reuses canonical trust engine instead of rating average shortcut", () => {
  assert.match(marketplaceRouter, /updateStoreTrustScore\(product\.storeId\)/);
  assert.doesNotMatch(marketplaceRouter, /const trustScore = Math\.round\(\(avgResult\.avg/);
});

test("trust engine derives order evidence from canonical Marketplace orders", () => {
  assert.match(trustEngine, /from\(orders\)/);
  assert.match(trustEngine, /eq\(orders\.merchantId, store\.ownerId\)/);
  assert.match(trustEngine, /order\.status === "completed"/);
  assert.match(trustEngine, /order\.status === "cancelled"/);
  assert.doesNotMatch(trustEngine, /\|\| store\.totalOrders/);
});

test("merchant portfolio endpoint is private and derives full DB aggregates", () => {
  assert.match(marketplaceRouter, /portfolioSummary: protectedProcedure/);
  assert.match(marketplaceRouter, /getMerchantPortfolioSummary\(user\.id\)/);
  assert.match(portfolioService, /where\(eq\(products\.storeId, store\.id\)\)/);
  assert.match(portfolioService, /where\(eq\(orders\.merchantId, ownerId\)\)/);
});

test("merchant dashboard uses portfolio summary for counts, not first five products", () => {
  assert.match(merchantDashboard, /trpc\.store\.portfolioSummary\.useQuery/);
  assert.match(merchantDashboard, /portfolio\?\.products\.live/);
  assert.match(merchantDashboard, /portfolio\?\.orders\.total/);
  assert.match(merchantDashboard, /portfolio\?\.orders\.new/);
  assert.match(merchantDashboard, /portfolio\?\.listingQuality\.needsAttention/);
  assert.doesNotMatch(merchantDashboard, /products\?\.products\.filter\(\(p: any\) => p\.status === "approved"\)/);
});

test("recent product query remains presentation-only", () => {
  assert.match(merchantDashboard, /trpc\.product\.myProducts\.useQuery\(\{ limit: 5 \}\)/);
  assert.match(merchantDashboard, /Recent Products/);
});
