import { RECEPTION_METHODS, TRACE_CHANNELS, TRACE_TARGET_TYPES } from "../drizzle/operational-trace-schema";

export type TraceChannel = (typeof TRACE_CHANNELS)[number];
export type TraceTargetType = (typeof TRACE_TARGET_TYPES)[number];
export type ReceptionMethod = (typeof RECEPTION_METHODS)[number];

export type CompletionProofInput = {
  receptionMethod: ReceptionMethod;
  artifactUrl?: string | null;
  artifactHash?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function assertCompletionProof(input: CompletionProofInput): CompletionProofInput {
  if (!RECEPTION_METHODS.includes(input.receptionMethod)) {
    throw new Error("Unsupported reception method.");
  }
  if (input.artifactUrl) {
    const value = input.artifactUrl.trim();
    if (value.length > 1000 || /^data:/i.test(value) || /base64/i.test(value)) {
      throw new Error("Proof artifacts must be stored as bounded external references, never inline/base64 data.");
    }
  }
  if (input.artifactHash && !/^[a-zA-Z0-9:_-]{8,128}$/.test(input.artifactHash.trim())) {
    throw new Error("Artifact hash/reference fingerprint is invalid.");
  }
  if (input.notes && input.notes.trim().length > 1000) {
    throw new Error("Proof notes exceed 1000 characters.");
  }
  if (input.latitude != null && (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90)) {
    throw new Error("Proof latitude is invalid.");
  }
  if (input.longitude != null && (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180)) {
    throw new Error("Proof longitude is invalid.");
  }
  return input;
}

export function requiresRecipientAttestation(method: ReceptionMethod): boolean {
  // Canon permits passive terrestrial reception and drone delivery without waiting
  // for the recipient. Even personal handover is recorded first by the pilot;
  // authenticated recipient confirmation is a separate optional attestation.
  return false;
}

export function traceChannelForTarget(targetType: TraceTargetType): TraceChannel {
  return targetType === "order" ? "C1" : "C2";
}
