// DROPi Marketplace Data — Products, Categories, Merchants, Cart, Delivery Modes

// ===== DELIVERY MODES (Multimodal) =====
export type DeliveryMode = "drone" | "auto" | "van" | "ebike" | "multimodal";

export interface DeliveryBadge {
  mode: DeliveryMode;
  label: string;
  icon: string;
  available: boolean;
  estimatedTime?: string;
  estimatedCost?: number;
}

export const DELIVERY_MODE_INFO: Record<DeliveryMode, { label: string; icon: string; color: string; description: string }> = {
  drone: { label: "Drone", icon: "🚁", color: "#0066FF", description: "Fast aerial delivery — eligible products only" },
  auto: { label: "Car", icon: "🚗", color: "#10B981", description: "Ground delivery by car" },
  van: { label: "Van", icon: "🚐", color: "#8B5CF6", description: "Ground delivery by van — large parcels" },
  ebike: { label: "E-Bike", icon: "🚲", color: "#F59E0B", description: "Electric bike delivery — urban zones" },
  multimodal: { label: "Multimodal", icon: "🔄", color: "#6366F1", description: "Combined: merchant → DronePort → client" },
};

// ===== PRODUCT CATEGORIES =====
export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  droneEligible: boolean;
  maxWeightDrone: number; // kg
  description: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: "food", name: "Food & Drinks", icon: "🍜", droneEligible: true, maxWeightDrone: 2.0, description: "Ready meals, drinks, snacks" },
  { id: "pharmacy", name: "Pharmacy", icon: "💊", droneEligible: true, maxWeightDrone: 1.5, description: "Medicines, vitamins, health products" },
  { id: "electronics", name: "Electronice", icon: "📱", droneEligible: true, maxWeightDrone: 1.0, description: "Telefoane, accesorii, gadgets mici" },
  { id: "groceries", name: "Groceries", icon: "🛒", droneEligible: true, maxWeightDrone: 3.0, description: "Food products, fruits, vegetables" },
  { id: "documents", name: "Documents", icon: "📄", droneEligible: true, maxWeightDrone: 0.5, description: "Envelopes, documents, correspondence" },
  { id: "flowers", name: "Flori & Cadouri", icon: "💐", droneEligible: true, maxWeightDrone: 1.5, description: "Buchete, cadouri mici" },
  { id: "furniture", name: "Furniture", icon: "🪑", droneEligible: false, maxWeightDrone: 0, description: "Furniture, large decorations" },
  { id: "heavy", name: "Heavy Parcels", icon: "📦", droneEligible: false, maxWeightDrone: 0, description: "Packages >5kg, equipment" },
  { id: "fragile", name: "Fragile", icon: "⚠️", droneEligible: false, maxWeightDrone: 0, description: "Fragile items requiring special transport" },
  { id: "community", name: "Community", icon: "🤝", droneEligible: true, maxWeightDrone: 2.0, description: "Donations, free transfers, occasional sales" },
];

// ===== MERCHANT TYPES =====
export type MerchantType = "authorized" | "artisan" | "community_seller" | "p2p";

export interface Merchant {
  id: number;
  name: string;
  type: MerchantType;
  category: string;
  zone: string;
  rating: number;
  totalOrders: number;
  description: string;
  image: string;
  trustBadge: "verified" | "trusted" | "new" | "community";
  isOpen: boolean;
  deliveryModes: DeliveryMode[];
}

// ===== PRODUCT =====
export interface Product {
  id: number;
  merchantId: number;
  merchantName: string;
  name: string;
  description: string;
  price: number;
  category: string;
  weight: number; // kg
  dimensions: { length: number; width: number; height: number }; // cm
  image: string;
  deliveryBadges: DeliveryBadge[];
  inStock: boolean;
  zone: string;
}

// ===== CART =====
export interface CartItem {
  product: Product;
  quantity: number;
}

// ===== CHECKOUT =====
export interface CheckoutData {
  items: CartItem[];
  deliveryMode: DeliveryMode;
  deliveryAddress: string;
  zone: string;
  totalAmount: number;
  deliveryCost: number;
  estimatedTime: string;
  droneAccepted?: boolean; // Client accepted drone conditions
  droneTutorialCompleted?: boolean;
  receptionPoint?: "door" | "gate" | "yard" | "droneport" | "personal";
}

// ===== MOCK DATA =====

export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 1, name: "Juan's Kitchen", type: "authorized", category: "food", zone: "Manila-Central",
    rating: 4.8, totalOrders: 1250, description: "Authentic Filipino cuisine, fresh daily",
    image: "🍜", trustBadge: "verified", isOpen: true,
    deliveryModes: ["drone", "auto", "ebike"],
  },
  {
    id: 2, name: "Fresh Pharmacy", type: "authorized", category: "pharmacy", zone: "Manila-Central",
    rating: 4.9, totalOrders: 3400, description: "Licensed pharmacy with fast delivery",
    image: "💊", trustBadge: "verified", isOpen: true,
    deliveryModes: ["drone", "auto", "ebike"],
  },
  {
    id: 3, name: "Tech Store PH", type: "authorized", category: "electronics", zone: "Makati",
    rating: 4.6, totalOrders: 890, description: "Gadgets, accessories, and electronics",
    image: "📱", trustBadge: "verified", isOpen: true,
    deliveryModes: ["drone", "auto"],
  },
  {
    id: 4, name: "Lola's Garden", type: "artisan", category: "flowers", zone: "Manila-Central",
    rating: 4.7, totalOrders: 320, description: "Handcrafted bouquets and floral arrangements",
    image: "💐", trustBadge: "trusted", isOpen: true,
    deliveryModes: ["auto", "ebike"],
  },
  {
    id: 5, name: "Manila Fresh Market", type: "authorized", category: "groceries", zone: "Manila-Central",
    rating: 4.5, totalOrders: 2100, description: "Fresh produce, meats, and daily essentials",
    image: "🛒", trustBadge: "verified", isOpen: true,
    deliveryModes: ["auto", "van", "ebike"],
  },
  {
    id: 6, name: "Maria's Crafts", type: "community_seller", category: "community", zone: "Quezon City",
    rating: 4.3, totalOrders: 45, description: "Handmade crafts and community donations",
    image: "🤝", trustBadge: "community", isOpen: true,
    deliveryModes: ["ebike", "auto"],
  },
  {
    id: 7, name: "Home Depot Express", type: "authorized", category: "heavy", zone: "Pasig",
    rating: 4.4, totalOrders: 670, description: "Hardware, tools, and home improvement",
    image: "📦", trustBadge: "verified", isOpen: true,
    deliveryModes: ["van", "auto"],
  },
  {
    id: 8, name: "DocuSend Manila", type: "authorized", category: "documents", zone: "Manila-Central",
    rating: 4.9, totalOrders: 5600, description: "Express document and envelope delivery",
    image: "📄", trustBadge: "verified", isOpen: true,
    deliveryModes: ["drone", "ebike", "auto"],
  },
];

function computeDeliveryBadges(weight: number, category: string, zone: string): DeliveryBadge[] {
  const cat = PRODUCT_CATEGORIES.find((c) => c.id === category);
  const badges: DeliveryBadge[] = [];

  // Drone eligibility
  if (cat?.droneEligible && weight <= (cat?.maxWeightDrone || 0)) {
    badges.push({ mode: "drone", label: "Drone", icon: "🚁", available: true, estimatedTime: "8-15 min", estimatedCost: 85 });
  } else {
    badges.push({ mode: "drone", label: "Drone", icon: "🚁", available: false });
  }

  // E-bike eligibility (up to 5kg, urban zones)
  if (weight <= 5) {
    badges.push({ mode: "ebike", label: "E-Bike", icon: "🚲", available: true, estimatedTime: "15-25 min", estimatedCost: 45 });
  }

  // Auto eligibility (up to 20kg)
  if (weight <= 20) {
    badges.push({ mode: "auto", label: "Car", icon: "🚗", available: true, estimatedTime: "20-35 min", estimatedCost: 65 });
  }

  // Van eligibility (any weight)
  if (weight > 5 || category === "heavy" || category === "furniture") {
    badges.push({ mode: "van", label: "Van", icon: "🚐", available: true, estimatedTime: "30-50 min", estimatedCost: 120 });
  }

  // Multimodal (drone + droneport for eligible items in different zones)
  if (cat?.droneEligible && weight <= (cat?.maxWeightDrone || 0)) {
    badges.push({ mode: "multimodal", label: "Multimodal", icon: "🔄", available: true, estimatedTime: "20-30 min", estimatedCost: 95 });
  }

  return badges;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1, merchantId: 1, merchantName: "Juan's Kitchen",
    name: "Chicken Adobo Family Pack", description: "Traditional Filipino chicken adobo, serves 4-5 persons",
    price: 350, category: "food", weight: 1.2, dimensions: { length: 25, width: 20, height: 10 },
    image: "🍗", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(1.2, "food", "Manila-Central"),
  },
  {
    id: 2, merchantId: 1, merchantName: "Juan's Kitchen",
    name: "Sinigang na Baboy", description: "Pork sinigang with vegetables, 1 liter",
    price: 280, category: "food", weight: 1.5, dimensions: { length: 20, width: 20, height: 15 },
    image: "🍲", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(1.5, "food", "Manila-Central"),
  },
  {
    id: 3, merchantId: 1, merchantName: "Juan's Kitchen",
    name: "Halo-Halo Special", description: "Classic Filipino dessert with all toppings",
    price: 120, category: "food", weight: 0.5, dimensions: { length: 10, width: 10, height: 15 },
    image: "🍧", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(0.5, "food", "Manila-Central"),
  },
  {
    id: 4, merchantId: 2, merchantName: "Fresh Pharmacy",
    name: "Vitamin C 1000mg (30 tablets)", description: "Immune support supplement",
    price: 180, category: "pharmacy", weight: 0.1, dimensions: { length: 8, width: 5, height: 3 },
    image: "💊", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(0.1, "pharmacy", "Manila-Central"),
  },
  {
    id: 5, merchantId: 2, merchantName: "Fresh Pharmacy",
    name: "First Aid Kit Complete", description: "Emergency first aid kit with 50+ items",
    price: 650, category: "pharmacy", weight: 0.8, dimensions: { length: 25, width: 15, height: 8 },
    image: "🩹", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(0.8, "pharmacy", "Manila-Central"),
  },
  {
    id: 6, merchantId: 3, merchantName: "Tech Store PH",
    name: "Wireless Earbuds Pro", description: "Bluetooth 5.3, noise cancelling, 24h battery",
    price: 1200, category: "electronics", weight: 0.15, dimensions: { length: 8, width: 8, height: 4 },
    image: "🎧", inStock: true, zone: "Makati",
    deliveryBadges: computeDeliveryBadges(0.15, "electronics", "Makati"),
  },
  {
    id: 7, merchantId: 3, merchantName: "Tech Store PH",
    name: "Phone Case Premium", description: "Shockproof case for latest smartphones",
    price: 450, category: "electronics", weight: 0.08, dimensions: { length: 16, width: 8, height: 2 },
    image: "📱", inStock: true, zone: "Makati",
    deliveryBadges: computeDeliveryBadges(0.08, "electronics", "Makati"),
  },
  {
    id: 8, merchantId: 4, merchantName: "Lola's Garden",
    name: "Rose Bouquet Deluxe", description: "12 premium red roses with baby's breath",
    price: 800, category: "flowers", weight: 0.6, dimensions: { length: 40, width: 20, height: 20 },
    image: "🌹", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(0.6, "flowers", "Manila-Central"),
  },
  {
    id: 9, merchantId: 5, merchantName: "Manila Fresh Market",
    name: "Fresh Fruit Basket", description: "Seasonal fruits: mango, papaya, banana, pineapple",
    price: 450, category: "groceries", weight: 3.5, dimensions: { length: 35, width: 25, height: 20 },
    image: "🍎", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(3.5, "groceries", "Manila-Central"),
  },
  {
    id: 10, merchantId: 5, merchantName: "Manila Fresh Market",
    name: "Daily Essentials Pack", description: "Rice 2kg, eggs, cooking oil, condiments",
    price: 380, category: "groceries", weight: 4.0, dimensions: { length: 30, width: 25, height: 25 },
    image: "🛒", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(4.0, "groceries", "Manila-Central"),
  },
  {
    id: 11, merchantId: 7, merchantName: "Home Depot Express",
    name: "Power Drill Set", description: "Cordless drill with 20 bits and carrying case",
    price: 2500, category: "heavy", weight: 3.2, dimensions: { length: 35, width: 30, height: 15 },
    image: "🔧", inStock: true, zone: "Pasig",
    deliveryBadges: computeDeliveryBadges(3.2, "heavy", "Pasig"),
  },
  {
    id: 12, merchantId: 8, merchantName: "DocuSend Manila",
    name: "Express Document Envelope", description: "Same-day document delivery, up to A4 size",
    price: 95, category: "documents", weight: 0.1, dimensions: { length: 33, width: 24, height: 1 },
    image: "📄", inStock: true, zone: "Manila-Central",
    deliveryBadges: computeDeliveryBadges(0.1, "documents", "Manila-Central"),
  },
  {
    id: 13, merchantId: 6, merchantName: "Maria's Crafts",
    name: "Handmade Bracelet Set", description: "Community donation — handcrafted beaded bracelets",
    price: 0, category: "community", weight: 0.05, dimensions: { length: 10, width: 10, height: 3 },
    image: "📿", inStock: true, zone: "Quezon City",
    deliveryBadges: computeDeliveryBadges(0.05, "community", "Quezon City"),
  },
];

// Helper: get products by merchant
export function getProductsByMerchant(merchantId: number): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.merchantId === merchantId);
}

// Helper: get products by category
export function getProductsByCategory(categoryId: string): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.category === categoryId);
}

// Helper: get available delivery modes for a product
export function getAvailableDeliveryModes(product: Product): DeliveryBadge[] {
  return product.deliveryBadges.filter((b) => b.available);
}

// Helper: check if drone eligible
export function isDroneEligible(product: Product): boolean {
  return product.deliveryBadges.some((b) => b.mode === "drone" && b.available);
}
