import { z } from "zod";
import { auditInvestigatorProcedure, router } from "./_core/trpc";
import {
  INCIDENT_CHANNELS,
  INCIDENT_EVENT_TYPES,
  buildIncidentReconstruction,
  listOperationalIncidents,
} from "./incident-reconstruction-service";

const channelSchema = z.enum(INCIDENT_CHANNELS);
const eventTypeSchema = z.enum(INCIDENT_EVENT_TYPES);

export const incidentRouter = router({
  list: auditInvestigatorProcedure
    .input(z.object({
      channel: channelSchema,
      eventType: eventTypeSchema.optional(),
      limit: z.number().int().min(1).max(100).optional(),
      beforeId: z.number().int().positive().optional(),
    }))
    .query(({ input }) => listOperationalIncidents(input)),

  reconstruct: auditInvestigatorProcedure
    .input(z.object({
      channel: channelSchema,
      eventUid: z.string().uuid(),
    }))
    .query(({ input }) => buildIncidentReconstruction(input)),
});
