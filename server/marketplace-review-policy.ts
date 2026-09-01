export type MarketplaceReviewActor = {
  id: number;
  dropiRole?: string | null;
  isActive?: boolean | null;
};

export type MarketplaceReviewOrder = {
  id: number;
  customerId: number;
  merchantId: number;
  status: string;
  items: unknown;
};

export type MarketplaceReviewProduct = {
  id: number;
  storeOwnerId: number;
};

export function extractMarketplaceOrderProductIds(items: unknown): number[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const productId = Number((item as Record<string, unknown>).productId);
      return Number.isSafeInteger(productId) && productId > 0 ? productId : null;
    })
    .filter((id): id is number => id !== null);
}

export function assertVerifiedMarketplaceReview(input: {
  actor: MarketplaceReviewActor;
  order: MarketplaceReviewOrder;
  product: MarketplaceReviewProduct;
}): void {
  const { actor, order, product } = input;

  if (actor.dropiRole !== "customer" || actor.isActive === false) {
    throw new Error("Only an active customer can submit a verified purchase review.");
  }

  if (order.customerId !== actor.id) {
    throw new Error("Review order does not belong to the authenticated customer.");
  }

  if (order.status !== "completed") {
    throw new Error("A review can be submitted only after confirmed delivery.");
  }

  if (order.merchantId !== product.storeOwnerId) {
    throw new Error("Reviewed product does not belong to the merchant that fulfilled this order.");
  }

  if (!extractMarketplaceOrderProductIds(order.items).includes(product.id)) {
    throw new Error("Reviewed product is not present in the completed order snapshot.");
  }
}
