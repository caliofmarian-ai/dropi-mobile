export const INCIDENT_EVENT_TYPES = ["fallback", "stop", "delivery_failed"] as const;
export const INCIDENT_TRACE_CHANNELS = ["C1", "C2"] as const;
export const INCIDENT_TIMELINE_SOURCES = [
  "operational_event",
  "telemetry",
  "proof",
  "attestation",
  "audit",
] as const;

export const INCIDENT_RECONSTRUCTION_DISCLAIMER =
  "This reconstruction is a factual assembly of persisted DROPi evidence. It does not infer root cause, fault, legal responsibility, or regulatory compliance.";

export type IncidentEventType = (typeof INCIDENT_EVENT_TYPES)[number];
export type IncidentTraceChannel = (typeof INCIDENT_TRACE_CHANNELS)[number];
export type IncidentTimelineSource = (typeof INCIDENT_TIMELINE_SOURCES)[number];

export type IncidentTimelineItem = {
  key: string;
  timestamp: string;
  source: IncidentTimelineSource;
  kind: string;
  actorUserId: number | null;
  actorRole: string | null;
  severity: string | null;
  evidenceHash: string | null;
  data: Record<string, unknown>;
};

const SOURCE_ORDER: Record<IncidentTimelineSource, number> = {
  operational_event: 0,
  telemetry: 1,
  proof: 2,
  attestation: 3,
  audit: 4,
};

export function isIncidentEventType(value: string): value is IncidentEventType {
  return (INCIDENT_EVENT_TYPES as readonly string[]).includes(value);
}

export function compareIncidentTimelineItems(a: IncidentTimelineItem, b: IncidentTimelineItem): number {
  const byTime = a.timestamp.localeCompare(b.timestamp);
  if (byTime !== 0) return byTime;
  const bySource = SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source];
  if (bySource !== 0) return bySource;
  return a.key.localeCompare(b.key);
}

export function assertIncidentChannel(value: string): IncidentTraceChannel {
  if (!(INCIDENT_TRACE_CHANNELS as readonly string[]).includes(value)) {
    throw new Error("Incident reconstruction is currently available only for persisted C1/C2 operational evidence.");
  }
  return value as IncidentTraceChannel;
}
