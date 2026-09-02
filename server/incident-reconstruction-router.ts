import { z } from "zod";
import {
  AUTHORITY_REPORT_DISCLAIMER,
  AUTHORITY_REPORT_TARGETS,
  authorityTemplate,
  csvCell,
} from "../shared/authority-report-policy";
import { INCIDENT_TRACE_CHANNELS } from "../shared/incident-reconstruction-policy";
import { auditInvestigatorProcedure, router } from "./_core/trpc";
import { buildIncidentReconstruction, listIncidentAnchors } from "./incident-reconstruction-service";

const channelSchema = z.enum(INCIDENT_TRACE_CHANNELS);
const authorityTargetSchema = z.enum(AUTHORITY_REPORT_TARGETS);
const incidentRefSchema = z.object({
  channel: channelSchema,
  incidentEventUid: z.string().uuid(),
});

type IncidentAuthorityPack = Awaited<ReturnType<typeof buildIncidentAuthorityPack>>;

export async function buildIncidentAuthorityPack(input: {
  channel: (typeof INCIDENT_TRACE_CHANNELS)[number];
  incidentEventUid: string;
  target: (typeof AUTHORITY_REPORT_TARGETS)[number];
}) {
  const reconstruction = await buildIncidentReconstruction({
    channel: input.channel,
    incidentEventUid: input.incidentEventUid,
  });
  const template = authorityTemplate(input.target);
  return {
    schema: "DROPI_INCIDENT_AUTHORITY_EVIDENCE_PACK",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    target: input.target,
    adaptationContext: template.adaptationContext,
    purpose: "Per-incident factual operational reconstruction for internal review and authority adaptation.",
    disclaimer: AUTHORITY_REPORT_DISCLAIMER,
    reconstructionDisclaimer: reconstruction.disclaimer,
    reconstruction,
  };
}

export function serializeIncidentAuthorityPackCsv(pack: IncidentAuthorityPack): string {
  const header = [
    "incidentEventUid",
    "channel",
    "targetType",
    "targetId",
    "timestamp",
    "source",
    "kind",
    "actorUserId",
    "actorRole",
    "severity",
    "evidenceHash",
    "data",
  ];
  const rows = pack.reconstruction.timeline.map((item) => [
    pack.reconstruction.incident.eventUid,
    pack.reconstruction.scope.channel,
    pack.reconstruction.scope.targetType,
    pack.reconstruction.scope.targetId,
    item.timestamp,
    item.source,
    item.kind,
    item.actorUserId,
    item.actorRole,
    item.severity,
    item.evidenceHash,
    item.data,
  ]);
  return [header.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");
}

export const incidentReconstructionRouter = router({
  list: auditInvestigatorProcedure
    .input(z.object({ channel: channelSchema, limit: z.number().int().min(1).max(100).optional() }))
    .query(async ({ input }) => {
      const incidents = await listIncidentAnchors(input);
      return {
        channel: input.channel,
        incidents: incidents.map((incident) => ({
          ...incident,
          occurredAt: incident.occurredAt.toISOString(),
        })),
      };
    }),

  reconstruct: auditInvestigatorProcedure
    .input(incidentRefSchema)
    .query(async ({ input }) => {
      const reconstruction = await buildIncidentReconstruction(input);
      const previewLimit = 1000;
      return {
        ...reconstruction,
        timeline: reconstruction.timeline.slice(0, previewLimit),
        preview: {
          returnedTimelineItems: Math.min(reconstruction.timeline.length, previewLimit),
          totalTimelineItems: reconstruction.timeline.length,
          truncated: reconstruction.timeline.length > previewLimit,
        },
      };
    }),

  export: auditInvestigatorProcedure
    .input(incidentRefSchema.extend({
      target: authorityTargetSchema,
      format: z.enum(["json", "csv"]),
    }))
    .query(async ({ input }) => {
      const pack = await buildIncidentAuthorityPack(input);
      const stamp = pack.reconstruction.incident.occurredAt.replace(/[:.]/g, "-");
      if (input.format === "csv") {
        return {
          filename: `dropi-incident-${input.target}-${input.channel}-${stamp}.csv`,
          contentType: "text/csv;charset=utf-8",
          content: serializeIncidentAuthorityPackCsv(pack),
          disclaimer: pack.disclaimer,
        };
      }
      return {
        filename: `dropi-incident-${input.target}-${input.channel}-${stamp}.json`,
        contentType: "application/json;charset=utf-8",
        content: JSON.stringify(pack, null, 2),
        disclaimer: pack.disclaimer,
      };
    }),
});
