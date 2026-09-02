import { createHash, randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  deliveryProofAttestations,
  deliveryProofs,
  flightTelemetrySamples,
  operationalEvidenceEvents,
} from "../drizzle/operational-trace-schema";
import {
  ATTESTATION_KINDS,
  RECEPTION_METHODS,
  TRACE_CHANNELS,
  TRACE_EVENT_TYPES,
  TRACE_TARGET_TYPES,
  assertCompletionProof,
  type CompletionProofInput,
} from "../shared/operational-trace-policy";
import { getDb } from "./db";

type TraceChannel = (typeof TRACE_CHANNELS)[number];
type TraceTargetType = (typeof TRACE_TARGET_TYPES)[number];
type TraceEventType = (typeof TRACE_EVENT_TYPES)[number];
type ReceptionMethod = (typeof RECEPTION_METHODS)[number];
type AttestationKind = (typeof ATTESTATION_KINDS)[number];

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

export function hashOperationalEvidence(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export type OperationalEventInput = {
  channel: TraceChannel;
  targetType: TraceTargetType;
  targetId: number;
  physicalDeliveryId?: number | null;
  actorUserId?: number | null;
  actorRole?: string | null;
  eventType: TraceEventType;
  custodyFromUserId?: number | null;
  custodyToUserId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  vehicleType?: string | null;
  details?: Record<string, unknown> | null;
  occurredAt?: Date;
};

export async function appendOperationalEventWithDb(db: any, input: OperationalEventInput) {
  const eventUid = randomUUID();
  const occurredAt = input.occurredAt ?? new Date();
  const evidenceHash = hashOperationalEvidence({ eventUid, ...input, occurredAt: occurredAt.toISOString() });
  await db.insert(operationalEvidenceEvents).values({
    eventUid,
    channel: input.channel,
    targetType: input.targetType,
    targetId: input.targetId,
    physicalDeliveryId: input.physicalDeliveryId ?? null,
    actorUserId: input.actorUserId ?? null,
    actorRole: input.actorRole ?? null,
    eventType: input.eventType,
    custodyFromUserId: input.custodyFromUserId ?? null,
    custodyToUserId: input.custodyToUserId ?? null,
    latitude: input.latitude != null ? input.latitude.toFixed(8) : null,
    longitude: input.longitude != null ? input.longitude.toFixed(8) : null,
    vehicleType: input.vehicleType ?? null,
    details: input.details ?? null,
    evidenceHash,
    occurredAt,
  });
  return { eventUid, evidenceHash, occurredAt };
}

export async function appendOperationalEvent(input: OperationalEventInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return appendOperationalEventWithDb(db, input);
}

export async function recordTelemetrySample(input: {
  channel: TraceChannel;
  targetType: TraceTargetType;
  targetId: number;
  pilotUserId: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude?: number | null;
  vehicleType: string;
  recordedAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const recordedAt = input.recordedAt ?? new Date();
  const evidenceHash = hashOperationalEvidence({ ...input, recordedAt: recordedAt.toISOString() });
  await db.insert(flightTelemetrySamples).values({
    channel: input.channel,
    targetType: input.targetType,
    targetId: input.targetId,
    pilotUserId: input.pilotUserId,
    latitude: input.latitude.toFixed(8),
    longitude: input.longitude.toFixed(8),
    speed: input.speed.toFixed(3),
    heading: input.heading.toFixed(3),
    altitude: input.altitude != null ? input.altitude.toFixed(3) : null,
    vehicleType: input.vehicleType,
    evidenceHash,
    recordedAt,
  });
  return { evidenceHash, recordedAt };
}

export async function createDeliveryProofWithDb(db: any, input: {
  channel: TraceChannel;
  targetType: TraceTargetType;
  targetId: number;
  recordedByUserId: number;
  recordedByRole: string;
  recipientUserId?: number | null;
  proof: CompletionProofInput;
  completedAt?: Date;
}) {
  const proof = assertCompletionProof(input.proof);
  const proofUid = randomUUID();
  const completedAt = input.completedAt ?? new Date();
  const evidenceHash = hashOperationalEvidence({
    proofUid,
    channel: input.channel,
    targetType: input.targetType,
    targetId: input.targetId,
    recordedByUserId: input.recordedByUserId,
    recipientUserId: input.recipientUserId ?? null,
    proof,
    completedAt: completedAt.toISOString(),
  });
  const inserted = await db
    .insert(deliveryProofs)
    .values({
      proofUid,
      channel: input.channel,
      targetType: input.targetType,
      targetId: input.targetId,
      receptionMethod: proof.receptionMethod as ReceptionMethod,
      recordedByUserId: input.recordedByUserId,
      recipientUserId: input.recipientUserId ?? null,
      artifactUrl: proof.artifactUrl?.trim() || null,
      artifactHash: proof.artifactHash?.trim() || null,
      notes: proof.notes?.trim() || null,
      latitude: proof.latitude != null ? proof.latitude.toFixed(8) : null,
      longitude: proof.longitude != null ? proof.longitude.toFixed(8) : null,
      evidenceHash,
      completedAt,
    })
    .$returningId();
  const proofId = inserted[0]?.id;
  if (!proofId) throw new Error("Delivery proof could not be persisted.");

  const attestedAt = completedAt;
  const attestationHash = hashOperationalEvidence({
    proofId,
    signerUserId: input.recordedByUserId,
    kind: "recorded_by",
    attestedAt: attestedAt.toISOString(),
  });
  await db.insert(deliveryProofAttestations).values({
    proofId,
    signerUserId: input.recordedByUserId,
    signerRole: input.recordedByRole,
    attestationKind: "recorded_by",
    evidenceHash: attestationHash,
    attestedAt,
  });
  return { proofId, proofUid, evidenceHash, completedAt };
}

export async function attestDeliveryProof(input: {
  proofId: number;
  signerUserId: number | null;
  signerRole: string;
  kind: Extract<AttestationKind, "recipient_confirmed" | "system_verified">;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const attestedAt = new Date();
  const evidenceHash = hashOperationalEvidence({
    proofId: input.proofId,
    signerUserId: input.signerUserId,
    kind: input.kind,
    attestedAt: attestedAt.toISOString(),
  });
  await db.insert(deliveryProofAttestations).values({
    proofId: input.proofId,
    signerUserId: input.signerUserId,
    signerRole: input.signerRole,
    attestationKind: input.kind,
    evidenceHash,
    attestedAt,
  });
  return { evidenceHash, attestedAt };
}

export async function getOperationalTrace(channel: TraceChannel, targetType: TraceTargetType, targetId: number) {
  const db = await getDb();
  if (!db) return { events: [], telemetry: [], proofs: [] };
  const [events, telemetry, proofs] = await Promise.all([
    db
      .select()
      .from(operationalEvidenceEvents)
      .where(and(eq(operationalEvidenceEvents.channel, channel), eq(operationalEvidenceEvents.targetType, targetType), eq(operationalEvidenceEvents.targetId, targetId)))
      .orderBy(asc(operationalEvidenceEvents.occurredAt)),
    db
      .select()
      .from(flightTelemetrySamples)
      .where(and(eq(flightTelemetrySamples.channel, channel), eq(flightTelemetrySamples.targetType, targetType), eq(flightTelemetrySamples.targetId, targetId)))
      .orderBy(asc(flightTelemetrySamples.recordedAt)),
    db
      .select()
      .from(deliveryProofs)
      .where(and(eq(deliveryProofs.channel, channel), eq(deliveryProofs.targetType, targetType), eq(deliveryProofs.targetId, targetId)))
      .orderBy(asc(deliveryProofs.completedAt)),
  ]);
  const proofIds = proofs.map((proof) => proof.id);
  const attestations = proofIds.length === 0
    ? []
    : await db
        .select()
        .from(deliveryProofAttestations)
        .where(inArray(deliveryProofAttestations.proofId, proofIds))
        .orderBy(asc(deliveryProofAttestations.attestedAt));
  const byProof = new Map<number, typeof attestations>();
  for (const attestation of attestations) {
    const list = byProof.get(attestation.proofId) ?? [];
    list.push(attestation);
    byProof.set(attestation.proofId, list);
  }
  return {
    events,
    telemetry,
    proofs: proofs.map((proof) => ({ ...proof, attestations: byProof.get(proof.id) ?? [] })),
  };
}
