import { decimal, index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const TRACE_CHANNELS = ["C1", "C2", "C3", "ADMIN"] as const;
export const TRACE_TARGET_TYPES = ["order", "b2b"] as const;
export const TRACE_EVENT_TYPES = [
  "assignment",
  "pickup",
  "execution_started",
  "transfer",
  "geofence_entered",
  "fallback",
  "stop",
  "delivery_completed",
  "delivery_failed",
] as const;
export const RECEPTION_METHODS = [
  "personal_handover",
  "leave_at_door",
  "leave_at_gate",
  "leave_in_yard",
  "drone_reception",
  "droneport_pickup",
  "fallback_handover",
] as const;
export const ATTESTATION_KINDS = ["recorded_by", "recipient_confirmed", "system_verified"] as const;

/**
 * Immutable operational evidence distinct from Audit Core. Audit says who invoked
 * an action; this table records what happened to the parcel/mission and custody.
 */
export const operationalEvidenceEvents = mysqlTable("operationalEvidenceEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventUid: varchar("eventUid", { length: 36 }).notNull().unique(),
  channel: mysqlEnum("channel", [...TRACE_CHANNELS]).notNull(),
  targetType: mysqlEnum("targetType", [...TRACE_TARGET_TYPES]).notNull(),
  targetId: int("targetId").notNull(),
  physicalDeliveryId: int("physicalDeliveryId"),
  actorUserId: int("actorUserId"),
  actorRole: varchar("actorRole", { length: 64 }),
  eventType: mysqlEnum("eventType", [...TRACE_EVENT_TYPES]).notNull(),
  custodyFromUserId: int("custodyFromUserId"),
  custodyToUserId: int("custodyToUserId"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  vehicleType: varchar("vehicleType", { length: 32 }),
  details: json("details"),
  evidenceHash: varchar("evidenceHash", { length: 64 }).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("operationalEvidence_target_time_idx").on(table.channel, table.targetType, table.targetId, table.occurredAt),
  index("operationalEvidence_actor_idx").on(table.actorUserId, table.occurredAt),
]);

/** Append-only validated trajectory samples accepted by the tracking server. */
export const flightTelemetrySamples = mysqlTable("flightTelemetrySamples", {
  id: int("id").autoincrement().primaryKey(),
  channel: mysqlEnum("channel", [...TRACE_CHANNELS]).notNull(),
  targetType: mysqlEnum("targetType", [...TRACE_TARGET_TYPES]).notNull(),
  targetId: int("targetId").notNull(),
  pilotUserId: int("pilotUserId").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  speed: decimal("speed", { precision: 8, scale: 3 }).notNull(),
  heading: decimal("heading", { precision: 7, scale: 3 }).notNull(),
  altitude: decimal("altitude", { precision: 10, scale: 3 }),
  vehicleType: varchar("vehicleType", { length: 32 }).notNull(),
  evidenceHash: varchar("evidenceHash", { length: 64 }).notNull(),
  recordedAt: timestamp("recordedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("flightTelemetry_target_time_idx").on(table.channel, table.targetType, table.targetId, table.recordedAt),
]);

/** Completion evidence. No base64/media bytes are stored here; only references/hashes. */
export const deliveryProofs = mysqlTable("deliveryProofs", {
  id: int("id").autoincrement().primaryKey(),
  proofUid: varchar("proofUid", { length: 36 }).notNull().unique(),
  channel: mysqlEnum("channel", [...TRACE_CHANNELS]).notNull(),
  targetType: mysqlEnum("targetType", [...TRACE_TARGET_TYPES]).notNull(),
  targetId: int("targetId").notNull(),
  receptionMethod: mysqlEnum("receptionMethod", [...RECEPTION_METHODS]).notNull(),
  recordedByUserId: int("recordedByUserId").notNull(),
  recipientUserId: int("recipientUserId"),
  artifactUrl: varchar("artifactUrl", { length: 1000 }),
  artifactHash: varchar("artifactHash", { length: 128 }),
  notes: text("notes"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  evidenceHash: varchar("evidenceHash", { length: 64 }).notNull(),
  completedAt: timestamp("completedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("deliveryProof_target_idx").on(table.channel, table.targetType, table.targetId, table.completedAt),
]);

/** Actor attestations linked to a proof; not represented as legal e-signatures. */
export const deliveryProofAttestations = mysqlTable("deliveryProofAttestations", {
  id: int("id").autoincrement().primaryKey(),
  proofId: int("proofId").notNull(),
  signerUserId: int("signerUserId"),
  signerRole: varchar("signerRole", { length: 64 }).notNull(),
  attestationKind: mysqlEnum("attestationKind", [...ATTESTATION_KINDS]).notNull(),
  evidenceHash: varchar("evidenceHash", { length: 64 }).notNull(),
  attestedAt: timestamp("attestedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("deliveryProofAttestations_proof_idx").on(table.proofId, table.attestedAt),
]);

export type OperationalEvidenceEvent = typeof operationalEvidenceEvents.$inferSelect;
export type FlightTelemetrySample = typeof flightTelemetrySamples.$inferSelect;
export type DeliveryProof = typeof deliveryProofs.$inferSelect;
export type DeliveryProofAttestation = typeof deliveryProofAttestations.$inferSelect;
