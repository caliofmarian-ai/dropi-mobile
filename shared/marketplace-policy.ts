export const MARKETPLACE_LISTING_POLICY_VERSION = "2026-09-05.v1" as const;

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

export const MARKETPLACE_ITEM_CONDITIONS = [
  { id: "new", label: "New" },
  { id: "used", label: "Used" },
  { id: "prepared", label: "Prepared / homemade" },
  { id: "other", label: "Other" },
] as const;

export type MarketplaceItemCondition = (typeof MARKETPLACE_ITEM_CONDITIONS)[number]["id"];

export type MarketplacePosterAttestation = {
  rulesAccepted: boolean;
  truthfulListing: boolean;
  authorizedToOffer: boolean;
  notProhibitedOrRestricted: boolean;
  moderationAccepted: boolean;
};

export const MARKETPLACE_POSTING_RULES = [
  "Use clear, accurate descriptions and real photos of the item being offered.",
  "Do not list dangerous goods, hazardous materials, counterfeit items, prohibited substances, or other prohibited/restricted goods.",
  "You must own the item or be authorized to offer it, and the listing must be truthful.",
  "Safety-sensitive categories may require additional information and compliance review.",
  "DROPi moderation may reject, remove, or close a listing that does not meet Marketplace rules.",
] as const;

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

export function isMarketplaceFoodCategory(value: string): boolean {
  return getMarketplaceCategoryPolicy(value)?.id === "food-groceries";
}

export function assertMarketplacePosterAttestation(input: {
  policyVersion: string;
  attestation: MarketplacePosterAttestation;
}) {
  if (input.policyVersion !== MARKETPLACE_LISTING_POLICY_VERSION) {
    throw new Error("Marketplace rules changed. Review and accept the current posting rules before submission.");
  }
  const { attestation } = input;
  if (
    !attestation.rulesAccepted ||
    !attestation.truthfulListing ||
    !attestation.authorizedToOffer ||
    !attestation.notProhibitedOrRestricted ||
    !attestation.moderationAccepted
  ) {
    throw new Error("All Marketplace posting declarations must be accepted before moderation.");
  }
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
