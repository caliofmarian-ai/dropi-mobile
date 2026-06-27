import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

// ===== ALL 29 DROPI ROLES =====
const ALL_DROPI_ROLES = [
  // C1 Marketplace (9)
  "customer", "merchant", "delivery_partner", "support_agent",
  "analyst", "compliance_officer", "fraud_detection",
  "performance_monitor", "incident_responder",
  // C2 COS (8)
  "operations_manager", "logistics_coordinator", "fleet_manager",
  "c2_compliance_officer", "c2_performance_monitor", "c2_incident_responder",
  "data_analyst", "quality_assurance",
  // C3 EOC (6)
  "emergency_coordinator", "dispatch_manager", "resource_allocator",
  "communication_officer", "c3_data_analyst", "incident_commander",
  // Admin (6)
  "system_administrator", "security_officer", "audit_manager",
  "configuration_manager", "analytics_manager", "support_coordinator",
] as const;

/**
 * Core user table backing auth flow.
 * Extended with DROPi RBAC + real auth fields.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // DROPi RBAC
  dropiRole: mysqlEnum("dropiRole", [...ALL_DROPI_ROLES]).default("customer").notNull(),
  channel: mysqlEnum("channel", ["C1", "C2", "C3", "ADMIN"]).default("C1").notNull(),
  zone: varchar("zone", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  // Real Auth fields
  passwordHash: varchar("passwordHash", { length: 255 }),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  // AI Agent fields
  isAIAgent: boolean("isAIAgent").default(false).notNull(),
  agentMode: mysqlEnum("agentMode", ["autonomous", "assistant"]),
  humanPairId: int("humanPairId"),
  // Security fields
  lastIp: varchar("lastIp", { length: 45 }),
  lastDevice: varchar("lastDevice", { length: 255 }),
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Sessions table — tracks active login sessions.
 * Supports phantom mode (admin viewing as another user).
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 500 }).notNull(),
  deviceInfo: varchar("deviceInfo", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  isPhantom: boolean("isPhantom").default(false).notNull(),
  phantomAdminId: int("phantomAdminId"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

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
  estimatedTime: int("estimatedTime"),
  actualTime: int("actualTime"),
  packageWeight: decimal("packageWeight", { precision: 5, scale: 2 }),
  cancellationReason: text("cancellationReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Deliveries table - represents the physical execution of an order.
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
 * Audit logs table - immutable record of ALL actions in the system.
 * Every state change, decision, and intervention is logged here.
 * Conforms to Blueprint L6 (Audit Core) requirements.
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
  // Location
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  // L6 Audit Core extensions
  channel: mysqlEnum("channel", ["C1", "C2", "C3", "ADMIN"]),
  isAIAction: boolean("isAIAction").default(false).notNull(),
  isPhantomMode: boolean("isPhantomMode").default(false).notNull(),
  phantomAdminId: int("phantomAdminId"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  sessionId: varchar("sessionId", { length: 100 }),
  duration: int("duration"),
  // Timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
