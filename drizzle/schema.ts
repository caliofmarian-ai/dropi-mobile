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
  // Verification status (delivery partners start as unverified)
  isVerified: boolean("isVerified").default(true).notNull(),
  // Real Auth fields
  passwordHash: varchar("passwordHash", { length: 255 }),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  // AI Agent fields
  isAIAgent: boolean("isAIAgent").default(false).notNull(),
  agentMode: mysqlEnum("agentMode", ["autonomous", "assistant"]),
  humanPairId: int("humanPairId"),
  // Email verification
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerifyToken: varchar("emailVerifyToken", { length: 10 }),
  emailVerifyExpires: timestamp("emailVerifyExpires"),
  // Security fields
  lastIp: varchar("lastIp", { length: 45 }),
  lastDevice: varchar("lastDevice", { length: 255 }),
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  // Profile
  profilePhotoUrl: varchar("profilePhotoUrl", { length: 512 }),
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

/**
 * Verifications table — Delivery Partners submit documents to prove authorization.
 * Admin reviews and approves/rejects. Until approved, pilot cannot receive missions.
 */
export const verifications = mysqlTable("verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentType: mysqlEnum("documentType", ["driving_license", "drone_license", "vehicle_registration", "insurance", "background_check", "other"]).notNull(),
  documentUrl: varchar("documentUrl", { length: 500 }),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  expiryDate: timestamp("expiryDate"),
  vehicleType: mysqlEnum("vehicleType", ["drone", "car", "van", "ebike", "motorcycle"]),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  rejectionReason: text("rejectionReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = typeof verifications.$inferInsert;

/**
 * Role Applications table — Users apply for operational roles (C2/C3/Admin).
 * Admin evaluates qualifications and approves/rejects.
 * On approval, user's dropiRole and channel are updated.
 */
export const roleApplications = mysqlTable("roleApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  requestedRole: mysqlEnum("requestedRole", [...ALL_DROPI_ROLES]).notNull(),
  requestedChannel: mysqlEnum("requestedChannel", ["C1", "C2", "C3", "ADMIN"]).notNull(),
  motivation: text("motivation"),
  qualifications: text("qualifications"),
  documentUrls: json("documentUrls"),
  status: mysqlEnum("status", ["pending", "under_review", "approved", "rejected", "withdrawn"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoleApplication = typeof roleApplications.$inferSelect;
export type InsertRoleApplication = typeof roleApplications.$inferInsert;

// ===== MARKETPLACE TABLES (Sprint A — Blueprint Implementation) =====

/**
 * Stores table — represents a merchant's commercial entity in the DROPi ecosystem.
 * Supports two types: 'internal' (products listed in DROPi marketplace) and 'external' (redirect to partner site + Logistic API).
 */
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logoUrl", { length: 500 }),
  coverImageUrl: varchar("coverImageUrl", { length: 500 }),
  type: mysqlEnum("type", ["internal", "external"]).default("internal").notNull(),
  externalUrl: varchar("externalUrl", { length: 500 }),
  apiKey: varchar("apiKey", { length: 64 }),
  webhookUrl: varchar("webhookUrl", { length: 500 }),
  zone: varchar("zone", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended", "closed"]).default("pending").notNull(),
  trustScore: int("trustScore").default(0).notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  totalReviews: int("totalReviews").default(0).notNull(),
  // Internal store fields
  workingHours: json("workingHours"),
  physicalAddress: text("physicalAddress"),
  contactPhone: varchar("contactPhone", { length: 20 }),
  // Suspension
  suspendedAt: timestamp("suspendedAt"),
  suspensionReason: text("suspensionReason"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/**
 * Products table — items listed in the DROPi marketplace by merchants.
 * Each product goes through moderation (pending_review → approved/rejected).
 * Badge-eligible delivery modes are calculated from weight/dimensions.
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 300 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RON").notNull(),
  images: json("images"), // array of URLs
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  weight: decimal("weight", { precision: 8, scale: 2 }).notNull(), // grams
  dimensions: json("dimensions"), // { l, w, h } in cm
  deliveryModes: json("deliveryModes"), // calculated: ["drone", "terrestrial", "multimodal"]
  cancellationPolicy: json("cancellationPolicy"), // per-state refund rules
  stock: int("stock"), // null = unlimited
  zone: varchar("zone", { length: 100 }).notNull(),
  // Moderation
  status: mysqlEnum("status", ["draft", "pending_review", "approved", "rejected", "suspended"]).default("draft").notNull(),
  moderationNote: text("moderationNote"),
  moderatedBy: int("moderatedBy"),
  moderatedAt: timestamp("moderatedAt"),
  isActive: boolean("isActive").default(false).notNull(),
  // Flags
  isFragile: boolean("isFragile").default(false).notNull(),
  requiresSpecialPackaging: boolean("requiresSpecialPackaging").default(false).notNull(),
  // Stats
  viewCount: int("viewCount").default(0).notNull(),
  orderCount: int("orderCount").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product Reviews — collected exclusively after confirmed delivery.
 * Cannot be modified or deleted by seller. One review per order.
 */
export const productReviews = mysqlTable("productReviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  storeId: int("storeId").notNull(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  overallRating: int("overallRating").notNull(), // 1-5
  qualityRating: int("qualityRating").notNull(), // 1-5 (quality vs description)
  comment: text("comment"),
  isVerifiedPurchase: boolean("isVerifiedPurchase").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

/**
 * Seller Badges — auto-assigned based on trust score and behavior.
 * Only one badge active per store at a time (highest priority wins).
 * Manual override requires justification (audited).
 */
export const sellerBadges = mysqlTable("sellerBadges", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  type: mysqlEnum("type", ["high_trust", "new_activity", "high_risk", "restricted"]).notNull(),
  reason: text("reason").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  overriddenBy: int("overriddenBy"),
  overrideReason: text("overrideReason"),
});

export type SellerBadge = typeof sellerBadges.$inferSelect;
export type InsertSellerBadge = typeof sellerBadges.$inferInsert;

/**
 * Delivery Badges — calculated per product based on weight, dimensions, zone.
 * Indicates which delivery modes are eligible (drone, terrestrial, multimodal).
 */
export const deliveryBadges = mysqlTable("deliveryBadges", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  mode: mysqlEnum("mode", ["drone", "terrestrial", "multimodal"]).notNull(),
  isEligible: boolean("isEligible").default(true).notNull(),
  conditions: text("conditions"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type DeliveryBadge = typeof deliveryBadges.$inferSelect;
export type InsertDeliveryBadge = typeof deliveryBadges.$inferInsert;

/**
 * Store Analytics — pre-calculated aggregate statistics for merchant dashboard.
 * Updated daily and monthly by a scheduled job.
 */
export const storeAnalytics = mysqlTable("storeAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  period: varchar("period", { length: 10 }).notNull(), // YYYY-MM-DD or YYYY-MM
  periodType: mysqlEnum("periodType", ["daily", "monthly"]).notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  completedOrders: int("completedOrders").default(0).notNull(),
  cancelledOrders: int("cancelledOrders").default(0).notNull(),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  commissionPaid: decimal("commissionPaid", { precision: 12, scale: 2 }).default("0").notNull(),
  refundsIssued: decimal("refundsIssued", { precision: 12, scale: 2 }).default("0").notNull(),
  newReviews: int("newReviews").default(0).notNull(),
  productViews: int("productViews").default(0).notNull(),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type StoreAnalytics = typeof storeAnalytics.$inferSelect;
export type InsertStoreAnalytics = typeof storeAnalytics.$inferInsert;


// ===== B2B LOGISTIC API TABLES =====

/**
 * API keys for B2B partner integration.
 * Each external store gets a unique API key for authentication.
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  keyHash: varchar("keyHash", { length: 128 }).notNull(), // SHA-256 hash of the actual key
  keyPrefix: varchar("keyPrefix", { length: 12 }).notNull(), // First 8 chars for identification (dropi_xxxx)
  name: varchar("name", { length: 100 }).notNull(), // Friendly name (e.g., "Production Key")
  permissions: text("permissions"), // JSON array of allowed endpoints
  isActive: boolean("isActive").default(true).notNull(),
  rateLimit: int("rateLimit").default(100).notNull(), // Requests per minute
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Webhook endpoints registered by B2B partners.
 * DROPi sends delivery status updates to these URLs.
 */
export const webhookEndpoints = mysqlTable("webhookEndpoints", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  events: text("events").notNull(), // JSON array: ["delivery.status_changed", "delivery.completed", "delivery.cancelled"]
  secret: varchar("secret", { length: 128 }).notNull(), // HMAC secret for signature verification
  isActive: boolean("isActive").default(true).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  lastFailureReason: text("lastFailureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type InsertWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

/**
 * B2B delivery requests from partner stores.
 * Created when a partner calls POST /api/v1/delivery/request.
 */
export const b2bDeliveries = mysqlTable("b2bDeliveries", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  externalOrderId: varchar("externalOrderId", { length: 200 }).notNull(),
  trackingCode: varchar("trackingCode", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", [
    "pending",       // Received, awaiting pilot assignment
    "assigned",      // Pilot assigned
    "pickup_enroute", // Pilot heading to pickup
    "picked_up",     // Package collected
    "in_transit",    // On the way to delivery address
    "delivered",     // Successfully delivered
    "cancelled",     // Cancelled by partner or system
    "failed",        // Delivery attempt failed
  ]).default("pending").notNull(),
  // Pickup info
  pickupAddress: text("pickupAddress").notNull(),
  pickupContactName: varchar("pickupContactName", { length: 200 }),
  pickupContactPhone: varchar("pickupContactPhone", { length: 30 }),
  pickupReadyAt: timestamp("pickupReadyAt"),
  // Delivery info
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryContactName: varchar("deliveryContactName", { length: 200 }),
  deliveryContactPhone: varchar("deliveryContactPhone", { length: 30 }),
  deliveryNotes: text("deliveryNotes"),
  // Package info
  packageWeight: int("packageWeight"), // grams
  packageDimensionsL: int("packageDimensionsL"), // cm
  packageDimensionsW: int("packageDimensionsW"), // cm
  packageDimensionsH: int("packageDimensionsH"), // cm
  packageFragile: boolean("packageFragile").default(false),
  packageDescription: text("packageDescription"),
  // Delivery preferences
  preferredMode: mysqlEnum("preferredMode", ["drone", "terrestrial", "any"]).default("any"),
  urgency: mysqlEnum("urgency", ["standard", "express", "scheduled"]).default("standard"),
  scheduledAt: timestamp("scheduledAt"),
  // Assignment & tracking
  assignedPilotId: int("assignedPilotId"),
  deliveryMode: mysqlEnum("deliveryMode", ["drone", "terrestrial"]),
  estimatedArrival: timestamp("estimatedArrival"),
  actualPickupAt: timestamp("actualPickupAt"),
  actualDeliveryAt: timestamp("actualDeliveryAt"),
  // Pricing
  quotedPrice: decimal("quotedPrice", { precision: 10, scale: 2 }),
  finalPrice: decimal("finalPrice", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("RON"),
  // Cancellation
  cancelledBy: mysqlEnum("cancelledBy", ["partner", "system", "pilot"]),
  cancellationReason: text("cancellationReason"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type B2bDelivery = typeof b2bDeliveries.$inferSelect;
export type InsertB2bDelivery = typeof b2bDeliveries.$inferInsert;

/**
 * Webhook delivery log — tracks each webhook attempt for debugging.
 */
export const webhookLogs = mysqlTable("webhookLogs", {
  id: int("id").autoincrement().primaryKey(),
  webhookEndpointId: int("webhookEndpointId").notNull(),
  deliveryId: int("deliveryId"),
  event: varchar("event", { length: 100 }).notNull(),
  payload: text("payload").notNull(), // JSON payload sent
  responseStatus: int("responseStatus"),
  responseBody: text("responseBody"),
  success: boolean("success").default(false).notNull(),
  attemptNumber: int("attemptNumber").default(1).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
});
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;


/**
 * API Request Logs — tracks every REST API call for analytics and auditing.
 * Records method, endpoint, response status, timing, and request metadata.
 */
export const apiRequestLogs = mysqlTable("apiRequestLogs", {
  id: int("id").autoincrement().primaryKey(),
  apiKeyId: int("apiKeyId").notNull(),
  storeId: int("storeId").notNull(),
  method: varchar("method", { length: 10 }).notNull(), // GET, POST, PUT, DELETE
  endpoint: varchar("endpoint", { length: 200 }).notNull(), // /api/v1/delivery/request
  statusCode: int("statusCode").notNull(),
  responseTimeMs: int("responseTimeMs").notNull(), // milliseconds
  requestBodySize: int("requestBodySize").default(0), // bytes
  responseBodySize: int("responseBodySize").default(0), // bytes
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  errorCode: varchar("errorCode", { length: 50 }), // null if success
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;
export type InsertApiRequestLog = typeof apiRequestLogs.$inferInsert;


// ===== PILOT SELECTION SYSTEM =====

/**
 * Pilot Profiles — extends delivery_partner users with performance metrics,
 * availability, and COS eligibility data for the pilot selection system.
 * 
 * Canonical reference: Delivery_Multimodal §5 — selection criteria:
 * eligibilitate tehnică, poziționare, rating, istoric livrări, mecanisme de rotație.
 * 
 * C1 (Marketplace): automatic selection only (no manual override)
 * C2/C3 (COS): manual selection allowed IF rating >= cosMinRating AND cosEligible = TRUE
 */
export const pilotProfiles = mysqlTable("pilotProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id (dropiRole = "delivery_partner")

  // === Rating Compozit (0.00 - 5.00) ===
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00").notNull(),

  // === Componente Rating ===
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }).default("100.00"), // % livrări finalizate cu succes
  onTimeRate: decimal("onTimeRate", { precision: 5, scale: 2 }).default("100.00"),         // % livrări la timp
  incidentRate: decimal("incidentRate", { precision: 5, scale: 2 }).default("0.00"),       // % livrări cu incidente
  customerRating: decimal("customerRating", { precision: 3, scale: 2 }).default("5.00"),   // Rating mediu clienți (1-5)

  // === Statistici ===
  totalDeliveries: int("totalDeliveries").default(0).notNull(),
  totalB2bDeliveries: int("totalB2bDeliveries").default(0).notNull(),
  totalFailedDeliveries: int("totalFailedDeliveries").default(0).notNull(),
  lastDeliveryAt: timestamp("lastDeliveryAt"),

  // === Disponibilitate ===
  isAvailable: boolean("isAvailable").default(false).notNull(),
  currentLat: decimal("currentLat", { precision: 10, scale: 8 }),
  currentLng: decimal("currentLng", { precision: 11, scale: 8 }),
  lastPositionUpdate: timestamp("lastPositionUpdate"),

  // === Capacități ===
  maxWeightGrams: int("maxWeightGrams").default(5000),
  vehicleTypes: json("vehicleTypes"), // JSON array: ["drone", "car", "van", "ebike", "motorcycle"]
  operatingZones: json("operatingZones"), // JSON array: ["zone_a", "zone_b"]

  // === COS Eligibilitate (C2/C3 manual selection gate) ===
  cosEligible: boolean("cosEligible").default(false).notNull(),
  cosMinRating: decimal("cosMinRating", { precision: 3, scale: 2 }).default("4.00"), // Rating minim pentru selecție manuală COS

  // === Rotație (echitate în distribuție) ===
  lastAssignedAt: timestamp("lastAssignedAt"),
  assignmentCount24h: int("assignmentCount24h").default(0),

  // === Timestamps ===
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PilotProfile = typeof pilotProfiles.$inferSelect;
export type InsertPilotProfile = typeof pilotProfiles.$inferInsert;

/**
 * Pilot Rating History — immutable audit trail for every rating change.
 * Each modification to a pilot's rating generates a log entry here.
 * 
 * Canonical reference: Cap. 6, §6.5.4 — Sistemul de audit și logare:
 * "Auditul este tehnic, informațional, orientat spre trasabilitate."
 */
export const pilotRatingHistory = mysqlTable("pilotRatingHistory", {
  id: int("id").autoincrement().primaryKey(),
  pilotProfileId: int("pilotProfileId").notNull(), // FK → pilotProfiles.id
  userId: int("userId").notNull(), // FK → users.id (for quick lookup)

  // === Rating Change ===
  previousRating: decimal("previousRating", { precision: 3, scale: 2 }).notNull(),
  newRating: decimal("newRating", { precision: 3, scale: 2 }).notNull(),

  // === Reason & Context ===
  reason: mysqlEnum("reason", [
    "delivery_completed",    // Livrare finalizată cu succes
    "delivery_failed",       // Livrare eșuată (pilot fault)
    "delivery_late",         // Livrare cu întârziere
    "customer_review",       // Review primit de la client
    "incident_reported",     // Incident raportat
    "periodic_recalculation", // Recalculare periodică (job zilnic)
    "admin_adjustment",      // Ajustare manuală admin (excepțional, auditat)
    "initial_calculation",   // Calcul inițial la creare profil
  ]).notNull(),

  // === Delivery Reference (optional) ===
  deliveryId: int("deliveryId"),
  deliveryType: mysqlEnum("deliveryType", ["marketplace", "b2b"]),

  // === Calculation Details (audit) ===
  calculationDetails: json("calculationDetails"), // JSON: weights, component scores, etc.

  // === Timestamp ===
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PilotRatingHistoryEntry = typeof pilotRatingHistory.$inferSelect;
export type InsertPilotRatingHistoryEntry = typeof pilotRatingHistory.$inferInsert;

// ===== PUSH NOTIFICATION TOKENS =====
/**
 * Stores Expo push tokens for each user device.
 * A user can have multiple tokens (multiple devices).
 */
export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 512 }).notNull(),
  platform: mysqlEnum("platform", ["ios", "android", "web"]).default("android").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;


// ============================================================
// IN-APP NOTIFICATIONS (Sprint 6B)
// ============================================================

export const inAppNotifications = mysqlTable("inAppNotifications", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("general"),
  // Categories: verification, mission, order, system, promotion, security
  isRead: boolean("isRead").notNull().default(false),
  data: text("data"), // JSON string with extra payload
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;

// ============================================================
// NOTIFICATION PREFERENCES (Sprint 6B)
// ============================================================

export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  // Push notification toggles per category
  pushVerification: boolean("pushVerification").notNull().default(true),
  pushMissions: boolean("pushMissions").notNull().default(true),
  pushOrders: boolean("pushOrders").notNull().default(true),
  pushSystem: boolean("pushSystem").notNull().default(true),
  pushPromotions: boolean("pushPromotions").notNull().default(false),
  pushSecurity: boolean("pushSecurity").notNull().default(true),
  // In-app notification toggles
  inAppVerification: boolean("inAppVerification").notNull().default(true),
  inAppMissions: boolean("inAppMissions").notNull().default(true),
  inAppOrders: boolean("inAppOrders").notNull().default(true),
  inAppSystem: boolean("inAppSystem").notNull().default(true),
  inAppPromotions: boolean("inAppPromotions").notNull().default(true),
  inAppSecurity: boolean("inAppSecurity").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;


// ============================================================
// AI AGENT ORCHESTRATOR (Sprint Agent)
// ============================================================

/**
 * Agent Tasks — queue of tasks dispatched by the orchestrator.
 * Each task targets one of the 29 DROPi roles.
 * Status lifecycle: pending → running → done / failed / cancelled
 */
export const agentTasks = mysqlTable("agentTasks", {
  id: int("id").autoincrement().primaryKey(),
  // Groups related tasks dispatched in one orchestrator run
  orchestratorRunId: varchar("orchestratorRunId", { length: 36 }),
  dropiRole: mysqlEnum("dropiRole", [...ALL_DROPI_ROLES]).notNull(),
  channel: mysqlEnum("channel", ["C1", "C2", "C3", "ADMIN"]).notNull(),
  // Task classification: audit, validate, simulate, report, custom
  taskType: varchar("taskType", { length: 100 }).notNull(),
  // Input context/instructions for the agent (JSON object)
  payload: json("payload"),
  status: mysqlEnum("status", ["pending", "running", "done", "failed", "cancelled"]).default("pending").notNull(),
  // 1 = highest, 10 = lowest
  priority: int("priority").default(5).notNull(),
  // Output produced by the agent (JSON)
  result: json("result"),
  errorMessage: text("errorMessage"),
  // Admin user who submitted this task (null = system-generated)
  createdBy: int("createdBy"),
  // AI agent user executing this task (FK → users.id where isAIAgent=true)
  agentUserId: int("agentUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
});
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = typeof agentTasks.$inferInsert;

/**
 * Agent State — live snapshot of each AI agent's current status.
 * One row per AI agent user (unique on agentUserId).
 * Updated by the orchestrator as tasks are dispatched and completed.
 */
export const agentState = mysqlTable("agentState", {
  id: int("id").autoincrement().primaryKey(),
  // FK → users.id (isAIAgent = true)
  agentUserId: int("agentUserId").notNull().unique(),
  dropiRole: mysqlEnum("dropiRole", [...ALL_DROPI_ROLES]).notNull(),
  channel: mysqlEnum("channel", ["C1", "C2", "C3", "ADMIN"]).notNull(),
  // idle: waiting for work | running: executing a task | waiting: blocked on dependency
  status: mysqlEnum("status", ["idle", "running", "waiting"]).default("idle").notNull(),
  // FK → agentTasks.id — populated while running
  currentTaskId: int("currentTaskId"),
  // Last known context passed to this agent (JSON — orchestrator-managed)
  context: json("context"),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  lastReportAt: timestamp("lastReportAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AgentStateRow = typeof agentState.$inferSelect;
export type InsertAgentState = typeof agentState.$inferInsert;

/**
 * Agent Reports — structured output generated after each task execution.
 * Immutable audit trail: one report per completed task.
 * Mirrors the canonical report format from AI_AGENT_SYSTEM.md §5.
 */
export const agentReports = mysqlTable("agentReports", {
  id: int("id").autoincrement().primaryKey(),
  agentUserId: int("agentUserId").notNull(),
  dropiRole: mysqlEnum("dropiRole", [...ALL_DROPI_ROLES]).notNull(),
  // FK → agentTasks.id
  taskId: int("taskId"),
  channel: mysqlEnum("channel", ["C1", "C2", "C3", "ADMIN"]).notNull(),
  mode: mysqlEnum("mode", ["autonomous", "assistant"]).default("autonomous").notNull(),
  // Period label, e.g. "2026-07-07" or "last-24h"
  period: varchar("period", { length: 50 }),
  // Arrays of action/issue/suggestion objects (JSON)
  actionsExecuted: json("actionsExecuted"),
  bugsFound: json("bugsFound"),
  logicIssues: json("logicIssues"),
  suggestions: json("suggestions"),
  edgeCases: json("edgeCases"),
  overallStatus: mysqlEnum("overallStatus", ["ok", "attention", "critical"]).default("ok").notNull(),
  // Plain-text executive summary
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AgentReport = typeof agentReports.$inferSelect;
export type InsertAgentReport = typeof agentReports.$inferInsert;
