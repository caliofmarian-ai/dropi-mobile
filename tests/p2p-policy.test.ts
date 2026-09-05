import assert from "node:assert/strict";
import test from "node:test";
import {
  assertP2pActiveListingLimit,
  assertP2pActor,
  assertPrivateParcel,
  normalizeP2pCommunityOffer,
  P2P_MAX_ACTIVE_COMMUNITY_LISTINGS,
} from "../server/p2p-policy";
import {
  MARKETPLACE_LISTING_POLICY_VERSION,
  MARKETPLACE_MAX_LISTING_IMAGES,
  assertMarketplaceListingAttestation,
  isFoodMarketplaceCategory,
} from "../shared/marketplace-policy";

const customer = { dropiRole: "customer", channel: "C1", isActive: true };

test("P2P is an active C1 customer capability", () => {
  assert.doesNotThrow(() => assertP2pActor(customer));
  assert.throws(() => assertP2pActor({ ...customer, dropiRole: "merchant" }), /not a merchant storefront/i);
  assert.throws(() => assertP2pActor({ ...customer, channel: "C2" }), /Channel 1/i);
  assert.throws(() => assertP2pActor({ ...customer, isActive: false }), /Inactive/i);
});

test("community offer active limit is exactly three", () => {
  assert.equal(P2P_MAX_ACTIVE_COMMUNITY_LISTINGS, 3);
  assert.doesNotThrow(() => assertP2pActiveListingLimit(2));
  assert.throws(() => assertP2pActiveListingLimit(3), /at most 3/i);
});

test("donation and free transfer cannot carry a price", () => {
  const expiresAt = new Date("2030-01-01T00:00:00Z");
  assert.equal(normalizeP2pCommunityOffer({ offerType: "donation", expiresAt, now: new Date("2029-01-01T00:00:00Z") }).fixedPrice, null);
  assert.throws(() => normalizeP2pCommunityOffer({ offerType: "free_transfer", fixedPrice: 1, expiresAt, now: new Date("2029-01-01T00:00:00Z") }), /cannot carry/i);
});

test("occasional sale is fixed-price only and positive", () => {
  const expiresAt = new Date("2030-01-01T00:00:00Z");
  assert.equal(normalizeP2pCommunityOffer({ offerType: "fixed_price", fixedPrice: 12.5, expiresAt, now: new Date("2029-01-01T00:00:00Z") }).fixedPrice, "12.50");
  assert.throws(() => normalizeP2pCommunityOffer({ offerType: "fixed_price", fixedPrice: 0, expiresAt, now: new Date("2029-01-01T00:00:00Z") }), /positive fixed price/i);
});

test("community offers must be time-limited", () => {
  assert.throws(() => normalizeP2pCommunityOffer({ offerType: "donation", expiresAt: new Date("2029-01-01T00:00:00Z"), now: new Date("2029-01-01T00:00:00Z") }), /future expiry/i);
});

test("private parcel validates addresses, description and bounded positive weight", () => {
  assert.doesNotThrow(() => assertPrivateParcel({ pickupAddress: "A", deliveryAddress: "B", packageDescription: "Books", weightGrams: 1200 }));
  assert.throws(() => assertPrivateParcel({ pickupAddress: "", deliveryAddress: "B", packageDescription: "Books", weightGrams: 1200 }), /addresses/i);
  assert.throws(() => assertPrivateParcel({ pickupAddress: "A", deliveryAddress: "B", packageDescription: "Books", weightGrams: 50001 }), /50000/i);
});

test("Marketplace listing attestation is versioned and fail-closed", () => {
  assert.match(MARKETPLACE_LISTING_POLICY_VERSION, /^marketplace-listing-v\d/);
  assert.equal(MARKETPLACE_MAX_LISTING_IMAGES, 3);
  const valid = {
    rulesAccepted: true,
    truthfulListing: true,
    authorizedToOffer: true,
    notProhibitedRestricted: true,
    moderationAcknowledged: true,
  };
  assert.doesNotThrow(() => assertMarketplaceListingAttestation(valid));
  assert.throws(() => assertMarketplaceListingAttestation({ ...valid, rulesAccepted: false }), /rules must be accepted/i);
  assert.throws(() => assertMarketplaceListingAttestation({ ...valid, authorizedToOffer: false }), /authorization/i);
});

test("food category activates consumption safeguards", () => {
  assert.equal(isFoodMarketplaceCategory("Food & Groceries"), true);
  assert.equal(isFoodMarketplaceCategory("food-groceries"), true);
  assert.equal(isFoodMarketplaceCategory("Electronics"), false);
});
