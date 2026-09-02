export const P2P_MAX_ACTIVE_COMMUNITY_LISTINGS = 3 as const;

export type P2pOfferType = "donation" | "free_transfer" | "fixed_price";

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
