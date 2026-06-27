import type { OrderStatus, DeliveryStatus, OrderItem } from "@/shared/types";
import type { DeliveryMode } from "@/lib/marketplace-data";

export interface MockOrder {
  id: number;
  orderUid: string;
  customerId: number;
  merchantId: number;
  merchantName: string;
  pilotId: number | null;
  pilotName: string | null;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  pickupAddress: string;
  zone: string;
  estimatedTime: number;
  packageWeight: number;
  createdAt: string;
  // Multimodal delivery fields
  deliveryMode: DeliveryMode;
  fallbackMode: DeliveryMode | null;
  receptionType: "personal" | "door" | "gate" | "yard" | "droneport";
  vehicleId: string | null;
  vehicleType: "drone" | "auto" | "van" | "ebike" | null;
}

export interface MockDelivery {
  id: number;
  deliveryUid: string;
  orderId: number;
  pilotId: number;
  vehicleId: string;
  vehicleType: "drone" | "auto" | "van" | "ebike";
  status: DeliveryStatus;
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  currentLat: number;
  currentLng: number;
}

export interface MockMission {
  id: number;
  orderId: number;
  pickupZone: string;
  deliveryZone: string;
  packageWeight: number;
  distance: number;
  estimatedTime: number;
  merchantName: string;
  status: "available" | "accepted" | "in_progress";
  vehicleType: "drone" | "auto" | "van" | "ebike";
  deliveryMode: DeliveryMode;
}

// Demo orders for client view — now with multimodal delivery info
export const CLIENT_ORDERS: MockOrder[] = [
  {
    id: 1,
    orderUid: "ORD-2026-001",
    customerId: 1,
    merchantId: 2,
    merchantName: "Juan's Kitchen",
    pilotId: 3,
    pilotName: "Carlos R.",
    status: "in_execution",
    items: [{ name: "Chicken Adobo", quantity: 2, weight: 0.8 }, { name: "Rice", quantity: 2, weight: 0.5 }],
    totalAmount: 535,
    deliveryAddress: "123 Rizal Ave, Manila",
    pickupAddress: "Juan's Kitchen, Quezon City",
    zone: "Manila-Central",
    estimatedTime: 12,
    packageWeight: 1.3,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    deliveryMode: "drone",
    fallbackMode: "ebike",
    receptionType: "personal",
    vehicleId: "DRN-007",
    vehicleType: "drone",
  },
  {
    id: 2,
    orderUid: "ORD-2026-002",
    customerId: 1,
    merchantId: 5,
    merchantName: "Fresh Pharmacy",
    pilotId: null,
    pilotName: null,
    status: "preparing",
    items: [{ name: "Vitamins Pack", quantity: 1, weight: 0.2 }],
    totalAmount: 225,
    deliveryAddress: "123 Rizal Ave, Manila",
    pickupAddress: "Fresh Pharmacy, Makati",
    zone: "Manila-Central",
    estimatedTime: 25,
    packageWeight: 0.2,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    deliveryMode: "ebike",
    fallbackMode: null,
    receptionType: "door",
    vehicleId: null,
    vehicleType: null,
  },
  {
    id: 3,
    orderUid: "ORD-2026-003",
    customerId: 1,
    merchantId: 2,
    merchantName: "Juan's Kitchen",
    pilotId: 3,
    pilotName: "Carlos R.",
    status: "completed",
    items: [{ name: "Sinigang", quantity: 1, weight: 0.9 }],
    totalAmount: 405,
    deliveryAddress: "123 Rizal Ave, Manila",
    pickupAddress: "Juan's Kitchen, Quezon City",
    zone: "Manila-Central",
    estimatedTime: 15,
    packageWeight: 0.9,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    deliveryMode: "drone",
    fallbackMode: null,
    receptionType: "personal",
    vehicleId: "DRN-003",
    vehicleType: "drone",
  },
  {
    id: 7,
    orderUid: "ORD-2026-007",
    customerId: 1,
    merchantId: 8,
    merchantName: "Tech Store PH",
    pilotId: 9,
    pilotName: "Miguel S.",
    status: "in_execution",
    items: [{ name: "USB-C Hub", quantity: 1, weight: 0.3 }, { name: "Phone Case", quantity: 1, weight: 0.1 }],
    totalAmount: 890,
    deliveryAddress: "123 Rizal Ave, Manila",
    pickupAddress: "Tech Store PH, Ortigas",
    zone: "Manila-East",
    estimatedTime: 18,
    packageWeight: 0.4,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    deliveryMode: "auto",
    fallbackMode: null,
    receptionType: "gate",
    vehicleId: "VAN-012",
    vehicleType: "auto",
  },
  {
    id: 8,
    orderUid: "ORD-2026-008",
    customerId: 1,
    merchantId: 3,
    merchantName: "Manila Blooms",
    pilotId: null,
    pilotName: null,
    status: "validated",
    items: [{ name: "Rose Bouquet Premium", quantity: 1, weight: 0.8 }],
    totalAmount: 650,
    deliveryAddress: "123 Rizal Ave, Manila",
    pickupAddress: "Manila Blooms, BGC",
    zone: "Manila-South",
    estimatedTime: 30,
    packageWeight: 0.8,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    deliveryMode: "multimodal",
    fallbackMode: "van",
    receptionType: "personal",
    vehicleId: null,
    vehicleType: null,
  },
];

// Demo orders for merchant view
export const MERCHANT_ORDERS: MockOrder[] = [
  {
    id: 4,
    orderUid: "ORD-2026-004",
    customerId: 6,
    merchantId: 2,
    merchantName: "Juan's Kitchen",
    pilotId: null,
    pilotName: null,
    status: "validated",
    items: [{ name: "Lumpia Shanghai", quantity: 3, weight: 0.6 }, { name: "Halo-Halo", quantity: 2, weight: 0.4 }],
    totalAmount: 520,
    deliveryAddress: "45 Bonifacio St, Manila",
    pickupAddress: "Juan's Kitchen, Quezon City",
    zone: "Manila-Central",
    estimatedTime: 20,
    packageWeight: 1.0,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    deliveryMode: "drone",
    fallbackMode: "ebike",
    receptionType: "personal",
    vehicleId: null,
    vehicleType: null,
  },
  {
    id: 5,
    orderUid: "ORD-2026-005",
    customerId: 7,
    merchantId: 2,
    merchantName: "Juan's Kitchen",
    pilotId: null,
    pilotName: null,
    status: "preparing",
    items: [{ name: "Kare-Kare", quantity: 1, weight: 1.1 }],
    totalAmount: 380,
    deliveryAddress: "78 Mabini Ave, Manila",
    pickupAddress: "Juan's Kitchen, Quezon City",
    zone: "Manila-Central",
    estimatedTime: 15,
    packageWeight: 1.1,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    deliveryMode: "van",
    fallbackMode: null,
    receptionType: "door",
    vehicleId: null,
    vehicleType: null,
  },
  {
    id: 6,
    orderUid: "ORD-2026-006",
    customerId: 8,
    merchantId: 2,
    merchantName: "Juan's Kitchen",
    pilotId: 3,
    pilotName: "Carlos R.",
    status: "ready",
    items: [{ name: "Pancit Canton", quantity: 2, weight: 0.7 }],
    totalAmount: 290,
    deliveryAddress: "12 Taft Ave, Manila",
    pickupAddress: "Juan's Kitchen, Quezon City",
    zone: "Manila-Central",
    estimatedTime: 10,
    packageWeight: 0.7,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    deliveryMode: "ebike",
    fallbackMode: null,
    receptionType: "gate",
    vehicleId: "EBK-005",
    vehicleType: "ebike",
  },
];

// Demo missions for pilot view — now with vehicle type
export const PILOT_MISSIONS: MockMission[] = [
  {
    id: 1,
    orderId: 6,
    pickupZone: "Quezon City - District 4",
    deliveryZone: "Manila - Taft",
    packageWeight: 0.7,
    distance: 4.2,
    estimatedTime: 8,
    merchantName: "Juan's Kitchen",
    status: "available",
    vehicleType: "drone",
    deliveryMode: "drone",
  },
  {
    id: 2,
    orderId: 10,
    pickupZone: "Makati - Poblacion",
    deliveryZone: "Manila - Ermita",
    packageWeight: 0.3,
    distance: 2.8,
    estimatedTime: 5,
    merchantName: "Fresh Pharmacy",
    status: "available",
    vehicleType: "ebike",
    deliveryMode: "ebike",
  },
  {
    id: 3,
    orderId: 11,
    pickupZone: "Pasig - Ortigas",
    deliveryZone: "Mandaluyong - Shaw",
    packageWeight: 1.5,
    distance: 3.1,
    estimatedTime: 6,
    merchantName: "Tech Store PH",
    status: "available",
    vehicleType: "auto",
    deliveryMode: "auto",
  },
  {
    id: 4,
    orderId: 4,
    pickupZone: "Quezon City - District 4",
    deliveryZone: "Manila - Bonifacio",
    packageWeight: 1.0,
    distance: 5.5,
    estimatedTime: 10,
    merchantName: "Juan's Kitchen",
    status: "available",
    vehicleType: "drone",
    deliveryMode: "drone",
  },
  {
    id: 5,
    orderId: 12,
    pickupZone: "BGC - Taguig",
    deliveryZone: "Makati - Ayala",
    packageWeight: 2.5,
    distance: 3.8,
    estimatedTime: 12,
    merchantName: "Manila Blooms",
    status: "available",
    vehicleType: "van",
    deliveryMode: "multimodal",
  },
];

// Active delivery for tracking
export const ACTIVE_DELIVERY: MockDelivery = {
  id: 1,
  deliveryUid: "DEL-2026-001",
  orderId: 1,
  pilotId: 3,
  vehicleId: "DRN-007",
  vehicleType: "drone",
  status: "in_flight",
  pickupLat: 14.6507,
  pickupLng: 121.0495,
  deliveryLat: 14.5995,
  deliveryLng: 120.9842,
  currentLat: 14.6251,
  currentLng: 121.0168,
};
