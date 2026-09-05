export const MARKETPLACE_CATEGORY_POLICIES = [
  { id: "food-groceries", label: "Food & Groceries", minPrice: 1, maxPrice: 5000 },
  { id: "electronics", label: "Electronics", minPrice: 5, maxPrice: 50000 },
  { id: "clothing-fashion", label: "Clothing & Fashion", minPrice: 5, maxPrice: 20000 },
  { id: "health-beauty", label: "Health & Beauty", minPrice: 2, maxPrice: 10000 },
  { id: "home-garden", label: "Home & Garden", minPrice: 5, maxPrice: 100000 },
  { id: "sports-outdoors", label: "Sports & Outdoors", minPrice: 5, maxPrice: 50000 },
  { id: "books-stationery", label: "Books & Stationery", minPrice: 1, maxPrice: 5000 },
  { id: "toys-games", label: "Toys & Games", minPrice: 3, maxPrice: 10000 },
  { id: "automotive", label: "Automotive", minPrice: 10, maxPrice: 200000 },
  { id: "pet-supplies", label: "Pet Supplies", minPrice: 2, maxPrice: 10000 },
  { id: "other", label: "Other", minPrice: 1, maxPrice: 50000 },
] as const;

export type MarketplaceCategoryPolicy = (typeof MARKETPLACE_CATEGORY_POLICIES)[number];
export type MarketplaceCategory = MarketplaceCategoryPolicy["label"];

const categoryByNormalizedKey = new Map<string, MarketplaceCategoryPolicy>();
for (const policy of MARKETPLACE_CATEGORY_POLICIES) {
  categoryByNormalizedKey.set(policy.id.toLowerCase(), policy);
  categoryByNormalizedKey.set(policy.label.toLowerCase(), policy);
}

export function getMarketplaceCategoryPolicy(value: string): MarketplaceCategoryPolicy | null {
  return categoryByNormalizedKey.get(value.trim().toLowerCase()) ?? null;
}

export function normalizeMarketplaceCategory(value: string): MarketplaceCategory {
  const policy = getMarketplaceCategoryPolicy(value);
  if (!policy) {
    throw new Error("Category is not eligible for the controlled DROPi Marketplace.");
  }
  return policy.label;
}

export function normalizeMarketplaceZone(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error("Marketplace zone is required.");
  if (normalized.length > 100) throw new Error("Marketplace zone exceeds 100 characters.");
  return normalized;
}

export function marketplaceZoneKey(value: string): string {
  return normalizeMarketplaceZone(value).toLocaleLowerCase("en-US");
}

export function sameMarketplaceZone(left: string, right: string): boolean {
  return marketplaceZoneKey(left) === marketplaceZoneKey(right);
}

export type ListingVisibilityInput = {
  status: string;
  isActive: boolean;
  stock: number | null;
  category: string;
  productZone: string;
  storeZone: string;
  requestedZone: string;
};

export type ListingVisibilityResult = {
  visible: boolean;
  purchasable: boolean;
  reasons: string[];
};

export function evaluateMarketplaceListingVisibility(input: ListingVisibilityInput): ListingVisibilityResult {
  const reasons: string[] = [];
  if (input.status !== "approved") reasons.push("NOT_APPROVED");
  if (!input.isActive) reasons.push("NOT_ACTIVE");
  if (input.stock !== null && input.stock <= 0) reasons.push("OUT_OF_STOCK");
  if (!getMarketplaceCategoryPolicy(input.category)) reasons.push("CATEGORY_NOT_ELIGIBLE");
  if (!sameMarketplaceZone(input.productZone, input.storeZone)) reasons.push("STORE_PRODUCT_ZONE_MISMATCH");
  if (!sameMarketplaceZone(input.productZone, input.requestedZone)) reasons.push("OUTSIDE_REQUESTED_ZONE");

  return {
    visible: reasons.length === 0,
    purchasable: reasons.length === 0,
    reasons,
  };
}

/**
 * One versioned Marketplace listing declaration is shared by every listing surface.
 * It records the poster's declaration; it is not a substitute for moderation or legal review.
 */
export const MARKETPLACE_LISTING_POLICY_VERSION = "marketplace-listing-v1-2026-09-05" as const;
export const MARKETPLACE_MAX_LISTING_IMAGES = 3 as const;
export const MARKETPLACE_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MARKETPLACE_ITEM_CONDITIONS = ["new", "used", "prepared", "other"] as const;
export type MarketplaceItemCondition = (typeof MARKETPLACE_ITEM_CONDITIONS)[number];

export type MarketplaceListingAttestation = {
  rulesAccepted: boolean;
  truthfulListing: boolean;
  authorizedToOffer: boolean;
  notProhibitedRestricted: boolean;
  moderationAcknowledged: boolean;
};

export function assertMarketplaceListingAttestation(attestation: MarketplaceListingAttestation): void {
  if (!attestation.rulesAccepted) throw new Error("Marketplace posting rules must be accepted.");
  if (!attestation.truthfulListing) throw new Error("The poster must confirm that listing information is truthful.");
  if (!attestation.authorizedToOffer) throw new Error("The poster must confirm authorization to offer the item.");
  if (!attestation.notProhibitedRestricted) throw new Error("The poster must confirm the item is not prohibited or restricted by Marketplace rules.");
  if (!attestation.moderationAcknowledged) throw new Error("Marketplace moderation and removal authority must be acknowledged.");
}

export function isFoodMarketplaceCategory(category: string): boolean {
  return normalizeMarketplaceCategory(category) === "Food & Groceries";
}
