import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { auditLogs } from "../drizzle/schema";
import { operationalEvidenceEvents } from "../drizzle/operational-trace-schema";
import {
  INCIDENT_EVENT_TYPES,
  INCIDENT_RECONSTRUCTION_DISCLAIMER,
  compareIncidentTimelineItems,
  type IncidentTimelineItem,
  type IncidentTraceChannel,
} from "../shared/incident-reconstruction-policy";
import { getDb } from "./db";
import { getOperationalTrace } from "./operational-trace-service";

export async function listIncidentAnchors(input: {
  channel: IncidentTraceChannel;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  return db
    .select({
      id: operationalEvidenceEvents.id,
      eventUid: operationalEvidenceEvents.eventUid,
      channel: operationalEvidenceEvents.channel,
      targetType: operationalEvidenceEvents.targetType,
      targetId: operationalEvidenceEvents.targetId,
      eventType: operationalEvidenceEvents.eventType,
      actorUserId: operationalEvidenceEvents.actorUserId,
      actorRole: operationalEvidenceEvents.actorRole,
      details: operationalEvidenceEvents.details,
      evidenceHash: operationalEvidenceEvents.evidenceHash,
      occurredAt: operationalEvidenceEvents.occurredAt,
    })
    .from(operationalEvidenceEvents)
    .where(and(
      eq(operationalEvidenceEvents.channel, input.channel),
      inArray(operationalEvidenceEvents.eventType, [...INCIDENT_EVENT_TYPES]),
    ))
    .orderBy(desc(operationalEvidenceEvents.occurredAt), desc(operationalEvidenceEvents.id))
    .limit(limit);
}

function numeric(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function buildIncidentReconstruction(input: {
  channel: IncidentTraceChannel;
  incidentEventUid: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const incidentRows = await db
    .select()
    .from(operationalEvidenceEvents)
    .where(and(
      eq(operationalEvidenceEvents.channel, input.channel),
      eq(operationalEvidenceEvents.eventUid, input.incidentEventUid),
      inArray(operationalEvidenceEvents.eventType, [...INCIDENT_EVENT_TYPES]),
    ))
    .limit(1);
  const incident = incidentRows[0];
  if (!incident) throw new Error("Incident evidence anchor was not found in the selected channel.");

  const trace = await getOperationalTrace(input.channel, incident.targetType, incident.targetId);
  const resourceTypes = incident.targetType === "order"
    ? ["order"]
    : ["b2b", "b2bDelivery", "b2b_delivery"];
  const decisionSignals = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userRole: auditLogs.userRole,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      details: auditLogs.details,
      severity: auditLogs.severity,
      isAIAction: auditLogs.isAIAction,
      isPhantomMode: auditLogs.isPhantomMode,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(and(
      eq(auditLogs.channel, input.channel),
      eq(auditLogs.resourceId, String(incident.targetId)),
      inArray(auditLogs.resourceType, resourceTypes),
    ))
    .orderBy(asc(auditLogs.createdAt), asc(auditLogs.id));

  const timeline: IncidentTimelineItem[] = [];
  for (const event of trace.events) {
    timeline.push({
      key: `operational:${event.id}`,
      timestamp: event.occurredAt.toISOString(),
      source: "operational_event",
      kind: event.eventType,
      actorUserId: event.actorUserId ?? null,
      actorRole: event.actorRole ?? null,
      severity: event.eventType === "stop" || event.eventType === "fallback" || event.eventType === "delivery_failed" ? "critical" : null,
      evidenceHash: event.evidenceHash,
      data: {
        eventUid: event.eventUid,
        physicalDeliveryId: event.physicalDeliveryId ?? null,
        custodyFromUserId: event.custodyFromUserId ?? null,
        custodyToUserId: event.custodyToUserId ?? null,
        latitude: numeric(event.latitude),
        longitude: numeric(event.longitude),
        vehicleType: event.vehicleType ?? null,
        details: event.details ?? null,
      },
    });
  }

  for (const sample of trace.telemetry) {
    timeline.push({
      key: `telemetry:${sample.id}`,
      timestamp: sample.recordedAt.toISOString(),
      source: "telemetry",
      kind: "position_sample",
      actorUserId: sample.pilotUserId,
      actorRole: "delivery_partner",
      severity: null,
      evidenceHash: sample.evidenceHash,
      data: {
        latitude: numeric(sample.latitude),
        longitude: numeric(sample.longitude),
        speed: numeric(sample.speed),
        heading: numeric(sample.heading),
        altitude: numeric(sample.altitude),
        vehicleType: sample.vehicleType,
      },
    });
  }

  for (const proof of trace.proofs) {
    timeline.push({
      key: `proof:${proof.id}`,
      timestamp: proof.completedAt.toISOString(),
      source: "proof",
      kind: "delivery_proof",
      actorUserId: proof.recordedByUserId,
      actorRole: null,
      severity: null,
      evidenceHash: proof.evidenceHash,
      data: {
        proofUid: proof.proofUid,
        receptionMethod: proof.receptionMethod,
        recipientUserId: proof.recipientUserId ?? null,
        artifactUrl: proof.artifactUrl ?? null,
        artifactHash: proof.artifactHash ?? null,
        notes: proof.notes ?? null,
        latitude: numeric(proof.latitude),
        longitude: numeric(proof.longitude),
      },
    });
    for (const attestation of proof.attestations) {
      timeline.push({
        key: `attestation:${attestation.id}`,
        timestamp: attestation.attestedAt.toISOString(),
        source: "attestation",
        kind: attestation.attestationKind,
        actorUserId: attestation.signerUserId ?? null,
        actorRole: attestation.signerRole,
        severity: null,
        evidenceHash: attestation.evidenceHash,
        data: { proofId: proof.id, proofUid: proof.proofUid },
      });
    }
  }

  for (const signal of decisionSignals) {
    timeline.push({
      key: `audit:${signal.id}`,
      timestamp: signal.createdAt.toISOString(),
      source: "audit",
      kind: signal.action,
      actorUserId: signal.userId ?? null,
      actorRole: signal.userRole ?? null,
      severity: signal.severity ?? null,
      evidenceHash: null,
      data: {
        resourceType: signal.resourceType,
        resourceId: signal.resourceId,
        isAIAction: signal.isAIAction,
        isPhantomMode: signal.isPhantomMode,
        details: signal.details ?? null,
      },
    });
  }

  timeline.sort(compareIncidentTimelineItems);
  const incidentTimestamp = incident.occurredAt.toISOString();
  const incidentTimelineIndex = timeline.findIndex((item) => item.source === "operational_event" && item.data.eventUid === incident.eventUid);

  return {
    schema: "DROPI_INCIDENT_RECONSTRUCTION",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    disclaimer: INCIDENT_RECONSTRUCTION_DISCLAIMER,
    incident: {
      eventUid: incident.eventUid,
      eventType: incident.eventType,
      occurredAt: incidentTimestamp,
      actorUserId: incident.actorUserId ?? null,
      actorRole: incident.actorRole ?? null,
      evidenceHash: incident.evidenceHash,
      details: incident.details ?? null,
    },
    scope: {
      channel: input.channel,
      targetType: incident.targetType,
      targetId: incident.targetId,
      contextRule: "Complete persisted trace for the same target is included; no inferred incident window is invented.",
    },
    counts: {
      operationalEvents: trace.events.length,
      telemetrySamples: trace.telemetry.length,
      proofs: trace.proofs.length,
      attestations: trace.proofs.reduce((sum, proof) => sum + proof.attestations.length, 0),
      auditDecisionSignals: decisionSignals.length,
      timelineItems: timeline.length,
    },
    incidentTimelineIndex,
    timeline,
  };
}
