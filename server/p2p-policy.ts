import {
  MARKETPLACE_LISTING_POLICY_VERSION,
  assertMarketplacePosterAttestation,
  isMarketplaceFoodCategory,
  normalizeMarketplaceCategory,
  type MarketplaceItemCondition,
  type MarketplacePosterAttestation,
} from "../shared/marketplace-policy";

export const P2P_MAX_ACTIVE_COMMUNITY_LISTINGS = 3 as const;
export const P2P_MAX_LISTING_IMAGES = 5 as const;
export const P2P_MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;

export type P2pOfferType = "donation" | "free_transfer" | "fixed_price";

export type P2pFoodSafetyInput = {
  ingredients: string;
  allergens: string;
  storageInstructions: string;
  useBy?: Date | null;
};

export function assertP2pActor(actor: {
  dropiRole?: string | null;
  channel?: string | null;
  isActive?: boolean | null;
}) {
  if (!actor.isActive) throw new Error("Inactive accounts cannot use P2P.");
  if (actor.channel !== "C1") throw new Error("P2P is available only in Channel 1.");
  if (actor.dropiRole !== "customer") {
    throw new Error("P2P is a non-commercial customer capability, not a merchant storefront.");
  }
}

export function normalizeP2pCommunityOffer(input: {
  offerType: P2pOfferType;
  fixedPrice?: number | null;
  currency?: string;
  expiresAt: Date;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (!(input.expiresAt instanceof Date) || Number.isNaN(input.expiresAt.getTime()) || input.expiresAt <= now) {
    throw new Error("Community offers must have a future expiry time.");
  }

  if (input.offerType === "fixed_price") {
    if (input.fixedPrice == null || !Number.isFinite(input.fixedPrice) || input.fixedPrice <= 0) {
      throw new Error("Occasional fixed-price offers require a positive fixed price.");
    }
  } else if (input.fixedPrice != null) {
    throw new Error("Donation and free-transfer offers cannot carry a sale price.");
  }

  const currency = (input.currency || "RON").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must use a 3-letter code.");

  return {
    fixedPrice: input.offerType === "fixed_price" ? input.fixedPrice!.toFixed(2) : null,
    currency,
    expiresAt: input.expiresAt,
  };
}

export function normalizeP2pListingGovernance(input: {
  actorId: number;
  category: string;
  itemCondition: MarketplaceItemCondition;
  imagePaths: string[];
  policyVersion: string;
  posterDeclarations: MarketplacePosterAttestation;
  foodSafety?: P2pFoodSafetyInput | null;
  now?: Date;
}) {
  const category = normalizeMarketplaceCategory(input.category);
  if (!Number.isSafeInteger(input.actorId) || input.actorId <= 0) throw new Error("Invalid P2P listing owner.");
  if (!Array.isArray(input.imagePaths) || input.imagePaths.length < 1 || input.imagePaths.length > P2P_MAX_LISTING_IMAGES) {
    throw new Error(`Community offers require 1-${P2P_MAX_LISTING_IMAGES} real item photos before moderation.`);
  }

  const expectedPrefix = `/manus-storage/p2p/community-offers/${input.actorId}/`;
  const uniquePaths = Array.from(new Set(input.imagePaths.map((path) => path.trim())));
  if (uniquePaths.length !== input.imagePaths.length) throw new Error("Duplicate listing images are not allowed.");
  if (uniquePaths.some((path) => !path.startsWith(expectedPrefix) || !/\.(?:jpe?g|png|webp)$/i.test(path))) {
    throw new Error("Listing images must come from this account's governed P2P upload flow.");
  }

  assertMarketplacePosterAttestation({
    policyVersion: input.policyVersion,
    attestation: input.posterDeclarations,
  });

  let foodSafety: { ingredients: string; allergens: string; storageInstructions: string; useBy?: string | null } | null = null;
  if (isMarketplaceFoodCategory(category)) {
    const provided = input.foodSafety;
    if (!provided) throw new Error("Food and grocery offers require safety information before moderation.");
    const ingredients = provided.ingredients.trim();
    const allergens = provided.allergens.trim();
    const storageInstructions = provided.storageInstructions.trim();
    if (ingredients.length < 2) throw new Error("Food ingredients or contents are required.");
    if (allergens.length < 2) throw new Error("Food allergen information is required. Use 'none known' when appropriate.");
    if (storageInstructions.length < 2) throw new Error("Food storage instructions are required.");

    let useBy: string | null = null;
    if (provided.useBy) {
      if (!(provided.useBy instanceof Date) || Number.isNaN(provided.useBy.getTime())) throw new Error("Invalid food use-by date.");
      if (provided.useBy <= (input.now ?? new Date())) throw new Error("Food use-by date must be in the future.");
      useBy = provided.useBy.toISOString();
    }
    if (input.itemCondition === "prepared" && !useBy) {
      throw new Error("Prepared food requires a future use-by date.");
    }
    foodSafety = { ingredients, allergens, storageInstructions, useBy };
  }

  return {
    category,
    itemCondition: input.itemCondition,
    imagePaths: uniquePaths,
    foodSafety,
    posterDeclarations: input.posterDeclarations,
    policyVersion: MARKETPLACE_LISTING_POLICY_VERSION,
    policyAcceptedAt: new Date(),
  };
}

export function assertP2pListingReadyForApproval(listing: {
  ownerId: number;
  category?: string | null;
  itemCondition?: string | null;
  imagePaths?: string[] | null;
  policyVersion?: string | null;
  posterDeclarations?: MarketplacePosterAttestation | null;
  foodSafety?: { ingredients?: string; allergens?: string; storageInstructions?: string; useBy?: string | null } | null;
}) {
  if (!listing.category || !listing.itemCondition || !listing.policyVersion || !listing.posterDeclarations) {
    throw new Error("Legacy or incomplete community offer cannot be approved. Required governance evidence is missing.");
  }
  normalizeP2pListingGovernance({
    actorId: Number(listing.ownerId),
    category: listing.category,
    itemCondition: listing.itemCondition as MarketplaceItemCondition,
    imagePaths: listing.imagePaths || [],
    policyVersion: listing.policyVersion,
    posterDeclarations: listing.posterDeclarations,
    foodSafety: listing.foodSafety
      ? {
          ingredients: String(listing.foodSafety.ingredients || ""),
          allergens: String(listing.foodSafety.allergens || ""),
          storageInstructions: String(listing.foodSafety.storageInstructions || ""),
          useBy: listing.foodSafety.useBy ? new Date(listing.foodSafety.useBy) : null,
        }
      : null,
  });
}

export function assertP2pActiveListingLimit(activeCount: number) {
  if (!Number.isSafeInteger(activeCount) || activeCount < 0) throw new Error("Invalid active listing count.");
  if (activeCount >= P2P_MAX_ACTIVE_COMMUNITY_LISTINGS) {
    throw new Error(`P2P users may have at most ${P2P_MAX_ACTIVE_COMMUNITY_LISTINGS} active community offers.`);
  }
}

export function assertPrivateParcel(input: {
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  weightGrams: number;
}) {
  if (!input.pickupAddress.trim() || !input.deliveryAddress.trim()) throw new Error("Pickup and delivery addresses are required.");
  if (!input.packageDescription.trim()) throw new Error("Package description is required.");
  if (!Number.isSafeInteger(input.weightGrams) || input.weightGrams <= 0 || input.weightGrams > 50000) {
    throw new Error("Package weight must be between 1 and 50000 grams.");
  }
}
