import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("Marketplace discovery uses live APIs and contains no product or merchant mocks", () => {
  const file = source("app/(tabs)/marketplace.tsx");
  assert.match(file, /trpc\.product\.listActive\.useQuery/);
  assert.match(file, /trpc\.p2p\.publicCommunityOffers\.useQuery/);
  assert.doesNotMatch(file, /MOCK_PRODUCTS|MOCK_MERCHANTS/);
  assert.doesNotMatch(file, /Manila-Central/);
});

test("product detail reads the governed public product and store endpoints", () => {
  const file = source("app/product/[id].tsx");
  assert.match(file, /trpc\.product\.getById\.useQuery/);
  assert.match(file, /trpc\.store\.getById\.useQuery/);
  assert.match(file, /addMarketplaceCartItem/);
  assert.doesNotMatch(file, /MOCK_PRODUCTS|MOCK_MERCHANTS|estimatedCost|estimatedTime/);
});

test("cart reuses canonical operations.placeOrder and has no simulated checkout", () => {
  const file = source("app/cart.tsx");
  assert.match(file, /trpc\.operations\.placeOrder\.useMutation/);
  assert.match(file, /deliveryAddress/);
  assert.doesNotMatch(file, /DEMO_CART|Simulated cart|deliveryCost|estimatedTime/);
});

test("canonical checkout atomically consumes finite stock before order creation", () => {
  const file = source("server/order-management-service.ts");
  assert.match(file, /db\.transaction\(async \(tx\)/);
  assert.match(file, /stock: sql`\$\{products\.stock\} - \$\{line\.quantity\}`/);
  assert.match(file, /gte\(products\.stock, line\.quantity\)/);
  assert.match(file, /no longer has enough stock/);
  assert.match(file, /await tx[\s\S]*?\.insert\(orders\)/);
});

test("P2P is a separate router and private parcel discovery is not public", () => {
  const router = source("server/p2p-router.ts");
  const appRouter = source("server/routers.ts");
  assert.match(appRouter, /p2p: p2pRouter/);
  assert.match(router, /publicCommunityOffers: publicProcedure/);
  assert.match(router, /createPrivateParcel: protectedProcedure/);
  assert.match(router, /myPrivateParcels: protectedProcedure/);
  assert.doesNotMatch(router, /publicPrivateParcel|publicParcelRequests/);
});

test("P2P persistence is not implemented as merchant store/product/order rows", () => {
  const schema = source("drizzle/p2p-schema.ts");
  assert.match(schema, /p2pCommunityListings/);
  assert.match(schema, /p2pParcelRequests/);
  assert.doesNotMatch(schema, /storeId|merchantId/);
});

test("registration no longer creates a P2P merchant subtype or default geographic fiction", () => {
  const file = source("app/register.tsx");
  assert.doesNotMatch(file, /p2p_seller|P2P Seller|Manila-Central/);
  assert.match(file, /P2P is included as a non-commercial C1 customer capability/);
  assert.match(file, /C1 Operating Zone/);
});
