import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const CART_KEY = "@dropi_marketplace_cart_v1";

export type MarketplaceCartItem = {
  productId: number;
  storeId: number;
  zone: string;
  name: string;
  unitPriceDisplay: number;
  currency: string;
  quantity: number;
  stock: number | null;
};

type CartState = {
  hydrated: boolean;
  items: MarketplaceCartItem[];
};

let state: CartState = { hydrated: false, items: [] };
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<(next: CartState) => void>();

function emit() {
  for (const listener of listeners) listener(state);
}

async function persist() {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(state.items));
}

export async function hydrateMarketplaceCart() {
  if (state.hydrated) return;
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        state = { hydrated: true, items: Array.isArray(parsed) ? parsed : [] };
      } catch {
        state = { hydrated: true, items: [] };
      }
      emit();
    })();
  }
  await hydrationPromise;
}

export async function addMarketplaceCartItem(item: MarketplaceCartItem) {
  await hydrateMarketplaceCart();
  if (!Number.isSafeInteger(item.productId) || item.productId <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
    throw new Error("Invalid cart item.");
  }
  const existingStoreId = state.items[0]?.storeId;
  const existingZone = state.items[0]?.zone;
  if (existingStoreId != null && existingStoreId !== item.storeId) {
    throw new Error("A Marketplace order can contain products from only one store.");
  }
  if (existingZone && existingZone.toLowerCase() !== item.zone.toLowerCase()) {
    throw new Error("A Marketplace order can contain products from only one zone.");
  }

  const current = state.items.find((entry) => entry.productId === item.productId);
  const nextQuantity = (current?.quantity || 0) + item.quantity;
  if (item.stock != null && nextQuantity > item.stock) {
    throw new Error("Requested quantity exceeds the currently displayed stock.");
  }
  const nextItem = { ...item, quantity: nextQuantity };
  state = {
    hydrated: true,
    items: current
      ? state.items.map((entry) => entry.productId === item.productId ? nextItem : entry)
      : [...state.items, nextItem],
  };
  emit();
  await persist();
}

export async function setMarketplaceCartQuantity(productId: number, quantity: number) {
  await hydrateMarketplaceCart();
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error("Invalid quantity.");
  if (quantity === 0) return removeMarketplaceCartItem(productId);
  const current = state.items.find((entry) => entry.productId === productId);
  if (!current) return;
  if (current.stock != null && quantity > current.stock) throw new Error("Requested quantity exceeds the currently displayed stock.");
  state = { hydrated: true, items: state.items.map((entry) => entry.productId === productId ? { ...entry, quantity } : entry) };
  emit();
  await persist();
}

export async function removeMarketplaceCartItem(productId: number) {
  await hydrateMarketplaceCart();
  state = { hydrated: true, items: state.items.filter((entry) => entry.productId !== productId) };
  emit();
  await persist();
}

export async function clearMarketplaceCart() {
  state = { hydrated: true, items: [] };
  emit();
  await AsyncStorage.removeItem(CART_KEY);
}

export function useMarketplaceCart() {
  const [snapshot, setSnapshot] = useState(state);
  useEffect(() => {
    const listener = (next: CartState) => setSnapshot(next);
    listeners.add(listener);
    void hydrateMarketplaceCart();
    return () => { listeners.delete(listener); };
  }, []);
  return snapshot;
}
