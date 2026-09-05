import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * C1 occasional community offers for non-commercial users.
 * This is intentionally separate from merchant stores/products: a P2P user is not a merchant storefront.
 */
export const p2pCommunityListings = mysqlTable("p2pCommunityListings", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  offerType: mysqlEnum("offerType", ["donation", "free_transfer", "fixed_price"]).notNull(),
  fixedPrice: decimal("fixedPrice", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("RON").notNull(),
  zone: varchar("zone", { length: 100 }).notNull(),
  // Nullable only for legacy rows created before the governed listing gate.
  category: varchar("category", { length: 100 }),
  itemCondition: mysqlEnum("itemCondition", ["new", "used", "prepared", "other"]),
  imageUrls: json("imageUrls").$type<string[]>(),
  foodSafety: json("foodSafety").$type<{
    ingredients: string;
    allergens: string;
    storageInstructions: string;
    useByDate?: string | null;
  }>(),
  attestationData: json("attestationData").$type<Record<string, boolean>>(),
  policyVersion: varchar("policyVersion", { length: 80 }),
  attestedAt: timestamp("attestedAt"),
  status: mysqlEnum("status", ["pending_review", "approved", "rejected", "closed"]).default("pending_review").notNull(),
  moderationNote: text("moderationNote"),
  moderatedBy: int("moderatedBy"),
  moderatedAt: timestamp("moderatedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type P2pCommunityListing = typeof p2pCommunityListings.$inferSelect;
export type InsertP2pCommunityListing = typeof p2pCommunityListings.$inferInsert;

/**
 * Private non-commercial parcel initiation.
 * No public discovery fields are exposed and this table is not a merchant order/store substitute.
 * Operational execution can consume this request through a later governed boundary.
 */
export const p2pParcelRequests = mysqlTable("p2pParcelRequests", {
  id: int("id").autoincrement().primaryKey(),
  requestUid: varchar("requestUid", { length: 36 }).notNull().unique(),
  ownerId: int("ownerId").notNull(),
  pickupAddress: text("pickupAddress").notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  packageDescription: text("packageDescription").notNull(),
  weightGrams: int("weightGrams").notNull(),
  zone: varchar("zone", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["initiated", "cancelled"]).default("initiated").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type P2pParcelRequest = typeof p2pParcelRequests.$inferSelect;
export type InsertP2pParcelRequest = typeof p2pParcelRequests.$inferInsert;
