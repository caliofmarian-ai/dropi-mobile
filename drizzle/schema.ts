import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with DROPi RBAC fields: dropiRole, channel, zone.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // DROPi RBAC
  dropiRole: mysqlEnum("dropiRole", ["client", "merchant", "pilot", "operator"]).default("client").notNull(),
  channel: mysqlEnum("channel", ["C1", "C2", "C3", "admin"]).default("C1").notNull(),
  zone: varchar("zone", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Orders table - represents the canonical order lifecycle.
 * States: initiated, validated, preparing, ready, accepted, in_execution, completed, cancelled, fallback
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderUid: varchar("orderUid", { length: 36 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  merchantId: int("merchantId").notNull(),
  pilotId: int("pilotId"),
  status: mysqlEnum("status", [
    "initiated", "validated", "preparing", "ready",
    "accepted", "in_execution", "completed", "cancelled", "fallback"
  ]).default("initiated").notNull(),
  items: json("items"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
  deliveryAddress: text("deliveryAddress"),
  pickupAddress: text("pickupAddress"),
  zone: varchar("zone", { length: 100 }),
  estimatedTime: int("estimatedTime"), // minutes
  actualTime: int("actualTime"), // minutes
  packageWeight: decimal("packageWeight", { precision: 5, scale: 2 }),
  cancellationReason: text("cancellationReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Deliveries table - represents the physical execution of an order.
 * Linked 1:1 with an order in ACCEPTED or later state.
 */
export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  deliveryUid: varchar("deliveryUid", { length: 36 }).notNull().unique(),
  orderId: int("orderId").notNull(),
  pilotId: int("pilotId").notNull(),
  droneId: varchar("droneId", { length: 100 }),
  status: mysqlEnum("status", [
    "pre_flight", "in_flight", "completed", "fallback", "stopped"
  ]).default("pre_flight").notNull(),
  pickupLat: decimal("pickupLat", { precision: 10, scale: 8 }),
  pickupLng: decimal("pickupLng", { precision: 11, scale: 8 }),
  deliveryLat: decimal("deliveryLat", { precision: 10, scale: 8 }),
  deliveryLng: decimal("deliveryLng", { precision: 11, scale: 8 }),
  currentLat: decimal("currentLat", { precision: 10, scale: 8 }),
  currentLng: decimal("currentLng", { precision: 11, scale: 8 }),
  fallbackReason: text("fallbackReason"),
  stopReason: text("stopReason"),
  preFlightChecks: json("preFlightChecks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;

/**
 * Audit logs table - immutable record of all actions in the system.
 * Every state change, decision, and intervention is logged here.
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userRole: varchar("userRole", { length: 50 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resourceType", { length: 100 }).notNull(),
  resourceId: varchar("resourceId", { length: 100 }),
  details: json("details"),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
