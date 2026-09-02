import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { auditLogs, b2bDeliveries, orders } from "../drizzle/schema";
import {
  deliveryProofAttestations,
  deliveryProofs,
  flightTelemetrySamples,
  operationalEvidenceEvents,
} from "../drizzle/operational-trace-schema";
import { getDb } from "./db";

export const INCIDENT_EVENT_TYPES = ["stop", "fallback", "delivery_failed"] as const;
export const INCIDENT_CHANNELS = ["C1", "C2"] as const;

export type IncidentEventType = (typeof INCIDENT_EVENT_TYPES)[number];
export type IncidentChannel = (typeof INCIDENT_CHANNELS)[number];

type IncidentTargetType = "order" | "b2b";

const EVENT_LIMIT = 2_000;
const TELEMETRY_LIMIT = 5_000;
const PROOF_LIMIT = 100;
const AUDIT_LIMIT = 2_000;

function targetTypeForChannel(channel: IncidentChannel): IncidentTargetType {
  return channel === "C1" ? "order" : "b2b";
}

function number(value: unknown): number {
  return Number(value || 0);
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function listOperationalIncidents(input: {
  channel: IncidentChannel;
  eventType?: IncidentEventType;
  limit?: number;
  beforeId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const filters = [
    eq(operationalEvidenceEvents.channel, input.channel),
    eq(operationalEvidenceEvents.targetType, targetTypeForChannel(input.channel)),
    input.eventType
      ? eq(operationalEvidenceEvents.eventType, input.eventType)
      : inArray(operationalEvidenceEvents.eventType, [...INCIDENT_EVENT_TYPES]),
  ];
  if (input.beforeId) filters.push(lt(operationalEvidenceEvents.id, input.beforeId));

  const rows = await db
    .select()
    .from(operationalEvidenceEvents)
    .where(and(...filters))
    .orderBy(desc(operationalEvidenceEvents.id))
    .limit(limit);

  return {
    incidents: rows.map((row) => ({
      id: row.id,
      eventUid: row.eventUid,
      channel: row.channel,
      targetType: row.targetType,
      targetId: row.targetId,
      eventType: row.eventType,
      actorUserId: row.actorUserId,
      actorRole: row.actorRole,
      details: row.details,
      evidenceHash: row.evidenceHash,
      occurredAt: iso(row.occurredAt),
    })),
    nextCursor: rows.length === limit ? rows[rows.length - 1]!.id : null,
  };
}

async function requireIncident(channel: IncidentChannel, eventUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db
    .select()
    .from(operationalEvidenceEvents)
    .where(and(
      eq(operationalEvidenceEvents.channel, channel),
      eq(operationalEvidenceEvents.targetType, targetTypeForChannel(channel)),
      eq(operationalEvidenceEvents.eventUid, eventUid),
      inArray(operationalEvidenceEvents.eventType, [...INCIDENT_EVENT_TYPES]),
    ))
    .limit(1);
  const incident = rows[0];
  if (!incident) throw new Error("Operational incident not found in the selected channel.");
  return incident;
}

async function targetSnapshot(channel: IncidentChannel, targetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (channel === "C1") {
    const rows = await db.select({
      id: orders.id,
      orderUid: orders.orderUid,
      status: orders.status,
      customerId: orders.customerId,
      merchantId: orders.merchantId,
      pilotId: orders.pilotId,
      pickupAddress: orders.pickupAddress,
      deliveryAddress: orders.deliveryAddress,
      zone: orders.zone,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    }).from(orders).where(eq(orders.id, targetId)).limit(1);
    const row = rows[0];
    return row ? { ...row, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) } : null;
  }
  const rows = await db.select({
    id: b2bDeliveries.id,
    trackingCode: b2bDeliveries.trackingCode,
    externalOrderId: b2bDeliveries.externalOrderId,
    status: b2bDeliveries.status,
    storeId: b2bDeliveries.storeId,
    assignedPilotId: b2bDeliveries.assignedPilotId,
    pickupAddress: b2bDeliveries.pickupAddress,
    deliveryAddress: b2bDeliveries.deliveryAddress,
    deliveryMode: b2bDeliveries.deliveryMode,
    createdAt: b2bDeliveries.createdAt,
    updatedAt: b2bDeliveries.updatedAt,
  }).from(b2bDeliveries).where(eq(b2bDeliveries.id, targetId)).limit(1);
  const row = rows[0];
  return row ? { ...row, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) } : null;
}

export async function buildIncidentReconstruction(input: {
  channel: IncidentChannel;
  eventUid: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const incident = await requireIncident(input.channel, input.eventUid);
  const targetType = incident.targetType as IncidentTargetType;
  const targetId = incident.targetId;
  const auditResourceTypes = targetType === "order" ? ["order", "operations"] : ["b2bDelivery", "operations"];
  const traceWhere = and(
    eq(operationalEvidenceEvents.channel, input.channel),
    eq(operationalEvidenceEvents.targetType, targetType),
    eq(operationalEvidenceEvents.targetId, targetId),
  );
  const telemetryWhere = and(
    eq(flightTelemetrySamples.channel, input.channel),
    eq(flightTelemetrySamples.targetType, targetType),
    eq(flightTelemetrySamples.targetId, targetId),
  );
  const proofWhere = and(
    eq(deliveryProofs.channel, input.channel),
    eq(deliveryProofs.targetType, targetType),
    eq(deliveryProofs.targetId, targetId),
  );
  const auditWhere = and(
    eq(auditLogs.channel, input.channel),
    eq(auditLogs.resourceId, String(targetId)),
    inArray(auditLogs.resourceType, auditResourceTypes),
  );

  const [
    eventCountRows,
    telemetryCountRows,
    proofCountRows,
    auditCountRows,
    events,
    telemetry,
    proofs,
    audit,
    target,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(operationalEvidenceEvents).where(traceWhere),
    db.select({ count: sql<number>`count(*)` }).from(flightTelemetrySamples).where(telemetryWhere),
    db.select({ count: sql<number>`count(*)` }).from(deliveryProofs).where(proofWhere),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(auditWhere),
    db.select().from(operationalEvidenceEvents).where(traceWhere).orderBy(asc(operationalEvidenceEvents.occurredAt), asc(operationalEvidenceEvents.id)).limit(EVENT_LIMIT),
    db.select().from(flightTelemetrySamples).where(telemetryWhere).orderBy(asc(flightTelemetrySamples.recordedAt), asc(flightTelemetrySamples.id)).limit(TELEMETRY_LIMIT),
    db.select().from(deliveryProofs).where(proofWhere).orderBy(asc(deliveryProofs.completedAt), asc(deliveryProofs.id)).limit(PROOF_LIMIT),
    db.select().from(auditLogs).where(auditWhere).orderBy(asc(auditLogs.createdAt), asc(auditLogs.id)).limit(AUDIT_LIMIT),
    targetSnapshot(input.channel, targetId),
  ]);

  const proofIds = proofs.map((proof) => proof.id);
  const attestations = proofIds.length === 0
    ? []
    : await db.select().from(deliveryProofAttestations)
        .where(inArray(deliveryProofAttestations.proofId, proofIds))
        .orderBy(asc(deliveryProofAttestations.attestedAt), asc(deliveryProofAttestations.id));

  const timeline: Array<Record<string, unknown> & { occurredAt: string; source: string; kind: string }> = [];
  for (const event of events) {
    timeline.push({
      occurredAt: iso(event.occurredAt),
      source: "operational_event",
      kind: event.eventType,
      recordId: event.id,
      eventUid: event.eventUid,
      actorUserId: event.actorUserId,
      actorRole: event.actorRole,
      custodyFromUserId: event.custodyFromUserId,
      custodyToUserId: event.custodyToUserId,
      latitude: event.latitude,
      longitude: event.longitude,
      vehicleType: event.vehicleType,
      details: event.details,
      evidenceHash: event.evidenceHash,
      incidentAnchor: event.id === incident.id,
    });
  }
  for (const sample of telemetry) {
    timeline.push({
      occurredAt: iso(sample.recordedAt),
      source: "telemetry",
      kind: "position",
      recordId: sample.id,
      actorUserId: sample.pilotUserId,
      latitude: sample.latitude,
      longitude: sample.longitude,
      speed: sample.speed,
      heading: sample.heading,
      altitude: sample.altitude,
      vehicleType: sample.vehicleType,
      evidenceHash: sample.evidenceHash,
    });
  }
  for (const proof of proofs) {
    timeline.push({
      occurredAt: iso(proof.completedAt),
      source: "proof",
      kind: proof.receptionMethod,
      recordId: proof.id,
      proofUid: proof.proofUid,
      actorUserId: proof.recordedByUserId,
      recipientUserId: proof.recipientUserId,
      latitude: proof.latitude,
      longitude: proof.longitude,
      artifactUrl: proof.artifactUrl,
      artifactHash: proof.artifactHash,
      notes: proof.notes,
      evidenceHash: proof.evidenceHash,
    });
  }
  for (const attestation of attestations) {
    timeline.push({
      occurredAt: iso(attestation.attestedAt),
      source: "attestation",
      kind: attestation.attestationKind,
      recordId: attestation.id,
      proofId: attestation.proofId,
      actorUserId: attestation.signerUserId,
      actorRole: attestation.signerRole,
      evidenceHash: attestation.evidenceHash,
    });
  }
  for (const row of audit) {
    timeline.push({
      occurredAt: iso(row.createdAt),
      source: "audit",
      kind: row.action,
      recordId: row.id,
      actorUserId: row.userId,
      actorRole: row.userRole,
      severity: row.severity,
      isAIAction: row.isAIAction,
      isPhantomMode: row.isPhantomMode,
      details: row.details,
    });
  }
  timeline.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.source.localeCompare(b.source));

  const counts = {
    operationalEvents: number(eventCountRows[0]?.count),
    telemetrySamples: number(telemetryCountRows[0]?.count),
    proofs: number(proofCountRows[0]?.count),
    attestations: attestations.length,
    auditEvents: number(auditCountRows[0]?.count),
  };

  return {
    schema: "DROPi_INCIDENT_RECONSTRUCTION",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    timezone: "UTC",
    incident: {
      id: incident.id,
      eventUid: incident.eventUid,
      channel: incident.channel,
      targetType: incident.targetType,
      targetId: incident.targetId,
      eventType: incident.eventType,
      occurredAt: iso(incident.occurredAt),
      actorUserId: incident.actorUserId,
      actorRole: incident.actorRole,
      details: incident.details,
      evidenceHash: incident.evidenceHash,
    },
    target,
    counts,
    truncation: {
      operationalEvents: counts.operationalEvents > EVENT_LIMIT,
      telemetrySamples: counts.telemetrySamples > TELEMETRY_LIMIT,
      proofs: counts.proofs > PROOF_LIMIT,
      auditEvents: counts.auditEvents > AUDIT_LIMIT,
      limits: { operationalEvents: EVENT_LIMIT, telemetrySamples: TELEMETRY_LIMIT, proofs: PROOF_LIMIT, auditEvents: AUDIT_LIMIT },
    },
    timeline,
  };
}
