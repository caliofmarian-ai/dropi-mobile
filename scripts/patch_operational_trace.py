from pathlib import Path
import re


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {text.count(old)}")
    return text.replace(old, new, 1)

# --- operational trace service imports ---
p = "server/operational-trace-service.ts"
s = read(p)
s = replace_once(
    s,
    '''import {\n  ATTESTATION_KINDS,\n  RECEPTION_METHODS,\n  TRACE_CHANNELS,\n  TRACE_EVENT_TYPES,\n  TRACE_TARGET_TYPES,\n  deliveryProofAttestations,\n  deliveryProofs,\n  flightTelemetrySamples,\n  operationalEvidenceEvents,\n} from "../drizzle/operational-trace-schema";\nimport { assertCompletionProof, type CompletionProofInput } from "../shared/operational-trace-policy";''',
    '''import {\n  deliveryProofAttestations,\n  deliveryProofs,\n  flightTelemetrySamples,\n  operationalEvidenceEvents,\n} from "../drizzle/operational-trace-schema";\nimport {\n  ATTESTATION_KINDS,\n  RECEPTION_METHODS,\n  TRACE_CHANNELS,\n  TRACE_EVENT_TYPES,\n  TRACE_TARGET_TYPES,\n  assertCompletionProof,\n  type CompletionProofInput,\n} from "../shared/operational-trace-policy";''',
    "trace service import layering",
)
write(p, s)

# --- C1 order management integration ---
p = "server/order-management-service.ts"
s = read(p)
s = replace_once(
    s,
    'import { evaluateMarketplaceListingVisibility, normalizeMarketplaceZone, sameMarketplaceZone } from "../shared/marketplace-policy";\n',
    'import { evaluateMarketplaceListingVisibility, normalizeMarketplaceZone, sameMarketplaceZone } from "../shared/marketplace-policy";\nimport type { CompletionProofInput } from "../shared/operational-trace-policy";\nimport { appendOperationalEventWithDb, createDeliveryProofWithDb } from "./operational-trace-service";\n',
    "order trace imports",
)
s = replace_once(
    s,
    '''  reason?: string;\n  auditSession?: AuditSessionLike;\n}): Promise<{ previousStatus: OrderStatus; status: OrderStatus; pilotId: number | null; readyPilotNotifications: number }> {''',
    '''  reason?: string;\n  completionProof?: CompletionProofInput;\n  auditSession?: AuditSessionLike;\n}): Promise<{ previousStatus: OrderStatus; status: OrderStatus; pilotId: number | null; readyPilotNotifications: number; proofId: number | null }> {''',
    "order transition signature",
)
s = replace_once(
    s,
    '''  const pilotId = authorization.assignPilotId ?? order.pilotId ?? null;\n  const update: Partial<typeof orders.$inferInsert> = { status: input.newStatus };''',
    '''  if (input.newStatus === "completed" && !input.completionProof) {\n    throw new Error("Proof of delivery is required before an order can be completed.");\n  }\n\n  const pilotId = authorization.assignPilotId ?? order.pilotId ?? null;\n  const update: Partial<typeof orders.$inferInsert> = { status: input.newStatus };''',
    "completion proof gate",
)
s = replace_once(
    s,
    '''  await db.update(orders).set(update).where(eq(orders.id, order.id));\n\n  const attribution = buildAuditAttribution("C1", input.auditSession);''',
    '''  let completionProofId: number | null = null;\n  await db.transaction(async (tx) => {\n    await tx.update(orders).set(update).where(eq(orders.id, order.id));\n\n    if (input.newStatus === "accepted") {\n      await appendOperationalEventWithDb(tx, {\n        channel: "C1",\n        targetType: "order",\n        targetId: order.id,\n        actorUserId: input.actor.id,\n        actorRole: authorization.actorKind,\n        eventType: "assignment",\n        custodyToUserId: pilotId,\n        details: { orderUid: order.orderUid, previousStatus, newStatus: input.newStatus },\n      });\n    }\n    if (input.newStatus === "in_execution") {\n      await appendOperationalEventWithDb(tx, {\n        channel: "C1",\n        targetType: "order",\n        targetId: order.id,\n        actorUserId: input.actor.id,\n        actorRole: authorization.actorKind,\n        eventType: "pickup",\n        custodyFromUserId: order.merchantId,\n        custodyToUserId: pilotId,\n        details: { orderUid: order.orderUid, previousStatus, newStatus: input.newStatus },\n      });\n    }\n    if (input.newStatus === "fallback") {\n      await appendOperationalEventWithDb(tx, {\n        channel: "C1",\n        targetType: "order",\n        targetId: order.id,\n        actorUserId: input.actor.id,\n        actorRole: authorization.actorKind,\n        eventType: "fallback",\n        details: { orderUid: order.orderUid, previousStatus, reason: input.reason || null },\n      });\n    }\n    if (input.newStatus === "completed" && input.completionProof) {\n      const proofResult = await createDeliveryProofWithDb(tx, {\n        channel: "C1",\n        targetType: "order",\n        targetId: order.id,\n        recordedByUserId: input.actor.id,\n        recordedByRole: authorization.actorKind,\n        recipientUserId: order.customerId,\n        proof: input.completionProof,\n      });\n      completionProofId = proofResult.proofId;\n      await appendOperationalEventWithDb(tx, {\n        channel: "C1",\n        targetType: "order",\n        targetId: order.id,\n        actorUserId: input.actor.id,\n        actorRole: authorization.actorKind,\n        eventType: "delivery_completed",\n        custodyFromUserId: pilotId,\n        custodyToUserId: order.customerId,\n        latitude: input.completionProof.latitude ?? null,\n        longitude: input.completionProof.longitude ?? null,\n        details: {\n          orderUid: order.orderUid,\n          proofId: proofResult.proofId,\n          receptionMethod: input.completionProof.receptionMethod,\n          previousStatus,\n        },\n      });\n    }\n  });\n\n  const attribution = buildAuditAttribution("C1", input.auditSession);''',
    "transactional operational evidence",
)
s = replace_once(
    s,
    '''      reason: input.reason || null,\n      pilotId,\n    },''',
    '''      reason: input.reason || null,\n      pilotId,\n      completionProofId,\n    },''',
    "audit proof linkage",
)
s = replace_once(
    s,
    '''  return { previousStatus, status: input.newStatus, pilotId, readyPilotNotifications };''',
    '''  return { previousStatus, status: input.newStatus, pilotId, readyPilotNotifications, proofId: completionProofId };''',
    "order transition result",
)
write(p, s)

# --- operations router: proof input, trace retrieval, recipient attestation ---
p = "server/operations-router.ts"
s = read(p)
s = replace_once(
    s,
    'import { b2bDeliveries, deliveries, orders, stores, users } from "../drizzle/schema";\n',
    'import { b2bDeliveries, deliveries, orders, stores, users } from "../drizzle/schema";\nimport { deliveryProofAttestations, deliveryProofs } from "../drizzle/operational-trace-schema";\n',
    "operations trace schema import",
)
s = replace_once(
    s,
    '} from "./order-management-service";\n',
    '} from "./order-management-service";\nimport { RECEPTION_METHODS } from "../shared/operational-trace-policy";\nimport { attestDeliveryProof, getOperationalTrace } from "./operational-trace-service";\n',
    "operations trace service import",
)
s = replace_once(
    s,
    '''type MobileDeliveryMode = "drone" | "auto" | "van" | "ebike" | "multimodal";''',
    '''const COMPLETION_PROOF_SCHEMA = z.object({\n  receptionMethod: z.enum(RECEPTION_METHODS),\n  artifactUrl: z.string().trim().max(1000).optional(),\n  artifactHash: z.string().trim().min(8).max(128).optional(),\n  notes: z.string().trim().max(1000).optional(),\n  latitude: z.number().min(-90).max(90).optional(),\n  longitude: z.number().min(-180).max(180).optional(),\n});\n\ntype MobileDeliveryMode = "drone" | "auto" | "van" | "ebike" | "multimodal";''',
    "completion proof schema",
)
s = replace_once(
    s,
    '''        reason: z.string().trim().min(1).max(500).optional(),\n      }),''',
    '''        reason: z.string().trim().min(1).max(500).optional(),\n        completionProof: COMPLETION_PROOF_SCHEMA.optional(),\n      }),''',
    "transition proof input",
)
s = replace_once(
    s,
    '''        reason: input.reason,\n        auditSession: ctx.session,''',
    '''        reason: input.reason,\n        completionProof: input.completionProof,\n        auditSession: ctx.session,''',
    "transition proof forwarding",
)
s = s.replace('receptionType: "personal" as const,', 'receptionType: null as string | null,')
anchor = '''  myOrders: protectedProcedure\n'''
if anchor not in s:
    raise SystemExit("operations trace endpoint anchor missing")
trace_endpoints = '''  myOrderTrace: protectedProcedure\n    .input(z.object({ orderId: z.number().int().positive() }))\n    .query(async ({ ctx, input }) => {\n      const db = await getDb();\n      if (!db) return { events: [], telemetry: [], proofs: [] };\n      const rows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);\n      const order = rows[0];\n      if (!order) throw new Error("Order not found.");\n      const user = ctx.user as any;\n      const authorized = order.customerId === user.id || order.merchantId === user.id || order.pilotId === user.id || user.role === "admin" || user.dropiRole === "system_administrator" || user.dropiRole === "audit_manager";\n      if (!authorized) throw new Error("Operational trace not accessible for current user");\n      const trace = await getOperationalTrace("C1", "order", order.id);\n      return {\n        events: trace.events.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString(), createdAt: event.createdAt.toISOString() })),\n        telemetry: trace.telemetry.map((sample) => ({\n          id: sample.id,\n          pilotUserId: sample.pilotUserId,\n          latitude: Number(sample.latitude),\n          longitude: Number(sample.longitude),\n          speed: Number(sample.speed),\n          heading: Number(sample.heading),\n          altitude: sample.altitude == null ? null : Number(sample.altitude),\n          vehicleType: sample.vehicleType,\n          recordedAt: sample.recordedAt.toISOString(),\n          evidenceHash: sample.evidenceHash,\n        })),\n        proofs: trace.proofs.map((proof) => ({\n          ...proof,\n          completedAt: proof.completedAt.toISOString(),\n          createdAt: proof.createdAt.toISOString(),\n          latitude: proof.latitude == null ? null : Number(proof.latitude),\n          longitude: proof.longitude == null ? null : Number(proof.longitude),\n          attestations: proof.attestations.map((attestation) => ({\n            ...attestation,\n            attestedAt: attestation.attestedAt.toISOString(),\n            createdAt: attestation.createdAt.toISOString(),\n          })),\n        })),\n      };\n    }),\n\n  confirmOrderReceipt: protectedProcedure\n    .input(z.object({ orderId: z.number().int().positive(), proofId: z.number().int().positive() }))\n    .mutation(async ({ ctx, input }) => {\n      const db = await getDb();\n      if (!db) throw new Error("Database unavailable");\n      const orderRows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);\n      const order = orderRows[0];\n      if (!order || order.customerId !== ctx.user!.id || order.status !== "completed") {\n        throw new Error("Only the completed order customer can confirm receipt.");\n      }\n      const proofRows = await db.select().from(deliveryProofs).where(and(\n        eq(deliveryProofs.id, input.proofId),\n        eq(deliveryProofs.channel, "C1"),\n        eq(deliveryProofs.targetType, "order"),\n        eq(deliveryProofs.targetId, order.id),\n      )).limit(1);\n      if (!proofRows[0]) throw new Error("Delivery proof not found for this order.");\n      const existing = await db.select().from(deliveryProofAttestations).where(and(\n        eq(deliveryProofAttestations.proofId, input.proofId),\n        eq(deliveryProofAttestations.signerUserId, ctx.user!.id),\n        eq(deliveryProofAttestations.attestationKind, "recipient_confirmed"),\n      )).limit(1);\n      if (existing[0]) return { confirmed: true, alreadyConfirmed: true };\n      await attestDeliveryProof({\n        proofId: input.proofId,\n        signerUserId: ctx.user!.id,\n        signerRole: ctx.user!.dropiRole || "customer",\n        kind: "recipient_confirmed",\n      });\n      return { confirmed: true, alreadyConfirmed: false };\n    }),\n\n'''
s = s.replace(anchor, trace_endpoints + anchor, 1)
write(p, s)

# --- live tracking persistence; WebSocket completion no longer fabricates persisted completion ---
p = "server/live-tracking.ts"
s = read(p)
s = replace_once(
    s,
    '} from "./live-tracking-access";\n',
    '} from "./live-tracking-access";\nimport { appendOperationalEvent, recordTelemetrySample } from "./operational-trace-service";\nimport { traceChannelForTarget } from "../shared/operational-trace-policy";\n',
    "tracking trace imports",
)
old_completion = re.search(r'  if \(msg\.type === "delivery_complete"\) \{.*?\n  \}\n\n  if \(msg\.type !== "position"\)', s, re.S)
if not old_completion:
    raise SystemExit("tracking completion block missing")
new_completion = '''  if (msg.type === "delivery_complete") {\n    // WebSocket telemetry is not authoritative completion. A proof-backed tRPC\n    // transition must record the actual reception method before state completion.\n    sendJson(ws, {\n      type: "proof_required",\n      target: authorization.target,\n      deliveryId: authorization.resourceId,\n      message: "Record proof of delivery before completing this mission.",\n    });\n    return;\n  }\n\n  if (msg.type !== "position")'''
s = s[:old_completion.start()] + new_completion + s[old_completion.end():]
s = replace_once(
    s,
    '''  delivery.lastPosition = position;\n\n  let etaSeconds: number | null = null;''',
    '''  delivery.lastPosition = position;\n  await recordTelemetrySample({\n    channel: traceChannelForTarget(authorization.target),\n    targetType: authorization.target,\n    targetId: authorization.resourceId,\n    pilotUserId: authorization.pilotId!,\n    latitude: position.lat,\n    longitude: position.lng,\n    speed: position.speed,\n    heading: position.heading,\n    altitude: position.altitude ?? null,\n    vehicleType: position.vehicleType,\n    recordedAt: new Date(position.timestamp),\n  });\n\n  let etaSeconds: number | null = null;''',
    "telemetry persistence",
)
s = replace_once(
    s,
    '''      delivery.geofenceTriggered = true;\n      broadcastToSubscribers(delivery, {''',
    '''      delivery.geofenceTriggered = true;\n      await appendOperationalEvent({\n        channel: traceChannelForTarget(authorization.target),\n        targetType: authorization.target,\n        targetId: authorization.resourceId,\n        actorUserId: authorization.pilotId,\n        actorRole: "delivery_partner",\n        eventType: "geofence_entered",\n        latitude: position.lat,\n        longitude: position.lng,\n        vehicleType: position.vehicleType,\n        details: { distanceM: Math.round(distanceM), etaSeconds },\n      });\n      broadcastToSubscribers(delivery, {''',
    "geofence evidence",
)
write(p, s)

# --- B2B evidence hooks ---
p = "server/b2b-router.ts"
s = read(p)
# Add import next to transition notification import if not already present.
needle = 'import { notifyB2bDeliveryTransition } from "./b2b-transition-notifications";\n'
if needle not in s:
    raise SystemExit("B2B import anchor missing")
s = s.replace(needle, needle + 'import { appendOperationalEvent, createDeliveryProofWithDb } from "./operational-trace-service";\nimport { RECEPTION_METHODS } from "../shared/operational-trace-policy";\n', 1)
# Pilot input accepts proof only for delivered.
s = replace_once(
    s,
    '''      failureReason: z.string().optional(),\n    }))''',
    '''      failureReason: z.string().optional(),\n      completionProof: z.object({\n        receptionMethod: z.enum(RECEPTION_METHODS),\n        artifactUrl: z.string().trim().max(1000).optional(),\n        artifactHash: z.string().trim().min(8).max(128).optional(),\n        notes: z.string().trim().max(1000).optional(),\n        latitude: z.number().min(-90).max(90).optional(),\n        longitude: z.number().min(-180).max(180).optional(),\n      }).optional(),\n    }))''',
    "B2B pilot proof input",
)
s = replace_once(
    s,
    '''      const previousStatus = delivery[0].status;\n      const updateData: Record<string, any> = { status: input.newStatus };''',
    '''      const previousStatus = delivery[0].status;\n      if (input.newStatus === "delivered" && !input.completionProof) {\n        throw new Error("Proof of delivery is required before a B2B mission can be delivered.");\n      }\n      const updateData: Record<string, any> = { status: input.newStatus };''',
    "B2B proof gate",
)
s = replace_once(
    s,
    '''      await db.update(b2bDeliveries)\n        .set(updateData)\n        .where(eq(b2bDeliveries.id, input.deliveryId));\n\n      // Trigger rating hooks based on status''',
    '''      await db.transaction(async (tx) => {\n        await tx.update(b2bDeliveries).set(updateData).where(eq(b2bDeliveries.id, input.deliveryId));\n        if (input.newStatus === "assigned") {\n          await appendOperationalEvent({\n            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "assignment", custodyToUserId: user.id,\n            details: { trackingCode: delivery[0].trackingCode, previousStatus },\n          });\n        }\n        if (input.newStatus === "picked_up") {\n          await appendOperationalEvent({\n            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "pickup", custodyToUserId: user.id,\n            details: { trackingCode: delivery[0].trackingCode, previousStatus },\n          });\n        }\n        if (input.newStatus === "in_transit") {\n          await appendOperationalEvent({\n            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "transfer", custodyToUserId: user.id,\n            details: { trackingCode: delivery[0].trackingCode, previousStatus },\n          });\n        }\n        if (input.newStatus === "delivered" && input.completionProof) {\n          const proof = await createDeliveryProofWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, recordedByUserId: user.id, recordedByRole: "delivery_partner", proof: input.completionProof });\n          await appendOperationalEvent({\n            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "delivery_completed", custodyFromUserId: user.id,\n            latitude: input.completionProof.latitude ?? null, longitude: input.completionProof.longitude ?? null,\n            details: { trackingCode: delivery[0].trackingCode, proofId: proof.proofId, receptionMethod: input.completionProof.receptionMethod },\n          });\n        }\n        if (input.newStatus === "failed") {\n          await appendOperationalEvent({\n            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "delivery_failed",\n            details: { trackingCode: delivery[0].trackingCode, reason: input.failureReason || null },\n          });\n        }\n      });\n\n      // Trigger rating hooks based on status''',
    "B2B pilot operational evidence",
)
# Admin transitions: delivered must carry proof; record core events after update. Extend input.
s = replace_once(
    s,
    '''      cancelledBy: z.enum(["system", "pilot"]).optional(),\n    }))''',
    '''      cancelledBy: z.enum(["system", "pilot"]).optional(),\n      completionProof: z.object({\n        receptionMethod: z.enum(RECEPTION_METHODS),\n        artifactUrl: z.string().trim().max(1000).optional(),\n        artifactHash: z.string().trim().min(8).max(128).optional(),\n        notes: z.string().trim().max(1000).optional(),\n        latitude: z.number().min(-90).max(90).optional(),\n        longitude: z.number().min(-180).max(180).optional(),\n      }).optional(),\n    }))''',
    "B2B admin proof input",
)
# For admin update, insert proof gate after previousStatus (second occurrence).
admin_anchor = '''      const previousStatus = delivery[0].status;\n      if (previousStatus === input.newStatus) {\n        return { success: true, message: "Status unchanged" };\n      }\n\n      // Build update payload'''
admin_repl = '''      const previousStatus = delivery[0].status;\n      if (previousStatus === input.newStatus) {\n        return { success: true, message: "Status unchanged" };\n      }\n      if (input.newStatus === "delivered" && !input.completionProof) {\n        throw new Error("Proof of delivery is required before a B2B mission can be delivered.");\n      }\n\n      // Build update payload'''
s = replace_once(s, admin_anchor, admin_repl, "B2B admin proof gate")
admin_update = '''      await db.update(b2bDeliveries)\n        .set(updateData)\n        .where(eq(b2bDeliveries.id, input.deliveryId));\n\n      // Trigger rating hooks based on status'''
admin_update_repl = '''      await db.transaction(async (tx) => {\n        await tx.update(b2bDeliveries).set(updateData).where(eq(b2bDeliveries.id, input.deliveryId));\n        const actorId = ctx.user!.id;\n        const actorRole = ctx.user!.dropiRole || "system_administrator";\n        if (input.newStatus === "picked_up") {\n          await appendOperationalEvent({ channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "pickup", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });\n        }\n        if (input.newStatus === "in_transit") {\n          await appendOperationalEvent({ channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "transfer", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });\n        }\n        if (input.newStatus === "delivered" && input.completionProof) {\n          const proof = await createDeliveryProofWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, recordedByUserId: actorId, recordedByRole: actorRole, proof: input.completionProof });\n          await appendOperationalEvent({ channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "delivery_completed", custodyFromUserId: pilotId, latitude: input.completionProof.latitude ?? null, longitude: input.completionProof.longitude ?? null, details: { trackingCode: delivery[0].trackingCode, proofId: proof.proofId, receptionMethod: input.completionProof.receptionMethod } });\n        }\n        if (input.newStatus === "failed") {\n          await appendOperationalEvent({ channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "delivery_failed", details: { trackingCode: delivery[0].trackingCode, reason: input.cancellationReason || null } });\n        }\n      });\n\n      // Trigger rating hooks based on status'''
# This old block occurs twice originally; pilot one was already replaced, so now exactly one should remain.
s = replace_once(s, admin_update, admin_update_repl, "B2B admin operational evidence")
# assignment path evidence after DB update
s = replace_once(
    s,
    '''      await db.update(b2bDeliveries)\n        .set({\n          status: "assigned",\n          assignedPilotId: input.pilotId,\n          updatedAt: new Date(),\n        })\n        .where(eq(b2bDeliveries.id, input.deliveryId));\n\n      // Trigger webhooks''',
    '''      await db.update(b2bDeliveries)\n        .set({\n          status: "assigned",\n          assignedPilotId: input.pilotId,\n          updatedAt: new Date(),\n        })\n        .where(eq(b2bDeliveries.id, input.deliveryId));\n      await appendOperationalEvent({\n        channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: null, actorRole: "operations_manager", eventType: "assignment", custodyToUserId: input.pilotId,\n        details: { trackingCode: delivery[0].trackingCode, assignedPilotId: input.pilotId },\n      });\n\n      // Trigger webhooks''',
    "B2B dispatch assignment evidence",
)
write(p, s)

# --- Pilot dashboard uses proof screen, and start label reflects pickup ---
p = "app/(tabs)/index.tsx"
s = read(p)
s = replace_once(
    s,
    '''                  onPress={() => transitionMarketplaceOrder.mutate({ orderId: item.id, newStatus: "in_execution" })}\n                >\n                  <Text className="text-white text-sm font-bold">Start Delivery</Text>''',
    '''                  onPress={() => transitionMarketplaceOrder.mutate({ orderId: item.id, newStatus: "in_execution" })}\n                >\n                  <Text className="text-white text-sm font-bold">Confirm pickup & start delivery</Text>''',
    "pilot pickup label",
)
s = replace_once(
    s,
    '''                  disabled={transitionMarketplaceOrder.isPending}\n                  onPress={() => transitionMarketplaceOrder.mutate({ orderId: item.id, newStatus: "completed" })}\n                >\n                  <Text className="text-white text-sm font-bold">Complete Delivery</Text>''',
    '''                  onPress={() => router.push({ pathname: "/pilot/complete-order", params: { orderId: String(item.id) } } as any)}\n                >\n                  <Text className="text-white text-sm font-bold">Record proof & complete</Text>''',
    "pilot completion route",
)
write(p, s)

# --- Order detail consumes only persisted trace; no demo route/hardcoded reception ---
p = "app/order/[id].tsx"
s = read(p)
s = s.replace('import { DeliveryMap, createDemoRoute } from "@/components/delivery-map";\nimport type { VehicleType } from "@/components/delivery-map";\n', '')
s = replace_once(s, 'import { trpc } from "@/lib/trpc";\n', 'import { trpc } from "@/lib/trpc";\nimport { useDropiAuth } from "@/lib/auth-context";\n', "order detail auth import")
s = replace_once(s, '''  const colors = useColors();\n  const orderId = Number(id);''', '''  const colors = useColors();\n  const { user } = useDropiAuth();\n  const orderId = Number(id);''', "order detail auth hook")
s = replace_once(
    s,
    '''  const timelineQuery = trpc.operations.myOrderTimeline.useQuery(\n    { orderId },\n    { enabled: Number.isFinite(orderId) },\n  );\n  const transitionOrder = trpc.operations.transitionOrder.useMutation({''',
    '''  const timelineQuery = trpc.operations.myOrderTimeline.useQuery(\n    { orderId },\n    { enabled: Number.isFinite(orderId) },\n  );\n  const traceQuery = trpc.operations.myOrderTrace.useQuery(\n    { orderId },\n    { enabled: Number.isFinite(orderId) },\n  );\n  const confirmReceipt = trpc.operations.confirmOrderReceipt.useMutation({\n    onSuccess: async () => { await traceQuery.refetch(); },\n  });\n  const transitionOrder = trpc.operations.transitionOrder.useMutation({''',
    "order trace hooks",
)
s = replace_once(s, '  const auditEvents = timelineQuery.data?.events ?? [];\n', '  const auditEvents = timelineQuery.data?.events ?? [];\n  const operationalTrace = traceQuery.data;\n  const latestProof = operationalTrace?.proofs?.[operationalTrace.proofs.length - 1] ?? null;\n  const recipientConfirmed = latestProof?.attestations?.some((attestation) => attestation.attestationKind === "recipient_confirmed") ?? false;\n', "order trace derived data")
# Reception block becomes proof-derived.
reception_pattern = re.compile(r'\n            \{\/\* Reception type \*\/\}.*?\n            <\/View>\n          <\/View>', re.S)
m = reception_pattern.search(s)
if not m:
    raise SystemExit("order reception block missing")
replacement = '''\n            {latestProof && (\n              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.border }}>\n                <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>RECORDED RECEPTION:</Text>\n                <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 4 }}>\n                  {latestProof.receptionMethod.replace(/_/g, " ")}\n                </Text>\n              </View>\n            )}\n          </View>'''
s = s[:m.start()] + replacement + s[m.end():]
# Replace interactive demo map with persisted telemetry evidence card.
map_pattern = re.compile(r'\n        \{\/\* Interactive Live Tracking Map \*\/\}.*?\n        \{canCancel && \(', re.S)
m = map_pattern.search(s)
if not m:
    raise SystemExit("demo map block missing")
telemetry_block = '''\n        {/* Persisted operational trace — never a simulated route */}\n        <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">\n          <Text className="text-base font-semibold text-foreground mb-2">Operational Evidence</Text>\n          <Text className="text-xs text-muted">\n            {operationalTrace?.telemetry?.length ?? 0} persisted telemetry samples • {operationalTrace?.events?.length ?? 0} custody/lifecycle events\n          </Text>\n          {operationalTrace?.telemetry?.length ? (() => {\n            const latest = operationalTrace.telemetry[operationalTrace.telemetry.length - 1];\n            return (\n              <View className="mt-3">\n                <Text className="text-sm text-foreground">Latest verified position</Text>\n                <Text className="text-xs text-muted mt-1">{latest.latitude.toFixed(6)}, {latest.longitude.toFixed(6)}</Text>\n                <Text className="text-xs text-muted">Speed {latest.speed.toFixed(1)} m/s • Heading {latest.heading.toFixed(0)}°{latest.altitude == null ? "" : ` • Alt ${latest.altitude.toFixed(0)}m`}</Text>\n                <Text className="text-[10px] text-muted mt-1">Evidence {latest.evidenceHash.slice(0, 16)}…</Text>\n              </View>\n            );\n          })() : (\n            <Text className="text-xs text-muted mt-2">No persisted trajectory samples yet.</Text>\n          )}\n          {latestProof && (\n            <View className="mt-3 pt-3 border-t border-border">\n              <Text className="text-sm font-semibold text-foreground">Proof of delivery</Text>\n              <Text className="text-xs text-muted mt-1">{latestProof.receptionMethod.replace(/_/g, " ")} • {new Date(latestProof.completedAt).toLocaleString()}</Text>\n              <Text className="text-[10px] text-muted mt-1">Proof {latestProof.evidenceHash.slice(0, 16)}…</Text>\n              {user?.id === order.customerId && !recipientConfirmed && (\n                <TouchableOpacity\n                  className="bg-primary rounded-lg py-2 items-center mt-3"\n                  disabled={confirmReceipt.isPending}\n                  onPress={() => confirmReceipt.mutate({ orderId, proofId: latestProof.id })}\n                >\n                  <Text className="text-white text-sm font-semibold">Confirm receipt</Text>\n                </TouchableOpacity>\n              )}\n              {recipientConfirmed && <Text className="text-xs text-success mt-2">Recipient confirmation recorded.</Text>}\n            </View>\n          )}\n        </View>\n\n        {canCancel && ('''
s = s[:m.start()] + telemetry_block + s[m.end():]
write(p, s)

# --- validate-db requires new persistent surfaces ---
p = "scripts/validate-db.ts"
s = read(p)
if '"operationalEvidenceEvents"' not in s:
    # insert before closing of required table list using known deliveries entry
    s = s.replace('  "deliveryBadges",\n', '  "deliveryBadges",\n  "operationalEvidenceEvents",\n  "flightTelemetrySamples",\n  "deliveryProofs",\n  "deliveryProofAttestations",\n', 1)
write(p, s)

print("Operational trace patch materialized")
