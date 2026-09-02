from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


b2b_path = Path("server/b2b-router.ts")
s = b2b_path.read_text()
s = replace_once(
    s,
    'import { appendOperationalEvent, createDeliveryProofWithDb } from "./operational-trace-service";',
    'import { appendOperationalEventWithDb, createDeliveryProofWithDb } from "./operational-trace-service";',
    "B2B trace service import",
)
s = replace_once(
    s,
    'import { RECEPTION_METHODS } from "../shared/operational-trace-policy";',
    'import { RECEPTION_METHODS, assertB2bTransition } from "../shared/operational-trace-policy";',
    "B2B trace policy import",
)

pattern = re.compile(
    r'      // Validate forward-only transitions\n'
    r'      const statusOrder = \["pending", "assigned", "pickup_enroute", "picked_up", "in_transit", "delivered"\];\n'
    r'      const currentIndex = statusOrder\.indexOf\(delivery\[0\]\.status\);\n'
    r'      const newIndex = statusOrder\.indexOf\(input\.newStatus\);\n\n'
    r'      // Allow "failed" from any active status\n'
    r'      if \(input\.newStatus !== "failed"\) \{\n'
    r'        if \(newIndex <= currentIndex\) \{\n'
    r'          throw new Error\(`Invalid transition: cannot go from "\$\{delivery\[0\]\.status\}" to "\$\{input\.newStatus\}"\. Only forward transitions allowed\.`\);\n'
    r'        \}\n'
    r'      \}\n'
)
s, count = pattern.subn(
    '      // Custody evidence must be contiguous; pilots cannot skip operational stages.\n'
    '      assertB2bTransition(delivery[0].status, input.newStatus, { allowFailure: true });\n',
    s,
    count=1,
)
if count != 1:
    raise SystemExit(f"pilot transition guard: expected 1 replacement, found {count}")

admin_anchor = '''      if (previousStatus === input.newStatus) {
        return { success: true, message: "Status unchanged" };
      }
      if (input.newStatus === "delivered" && !input.completionProof) {'''
admin_replace = '''      if (previousStatus === input.newStatus) {
        return { success: true, message: "Status unchanged" };
      }
      assertB2bTransition(previousStatus, input.newStatus, { allowFailure: true, allowCancellation: true });
      if (input.newStatus === "delivered" && !input.completionProof) {'''
s = replace_once(s, admin_anchor, admin_replace, "admin transition guard")

# Every existing B2B domain-evidence write is expected to live inside one of the
# state transactions after the assignment block below is made transactional.
s = s.replace("await appendOperationalEvent({", "await appendOperationalEventWithDb(tx, {")

assign_sig = re.compile(r'(  assignPilot: adminProcedure.*?\.mutation\(async \(\{) input (\}\) => \{)', re.S)
s, count = assign_sig.subn(r'\1 ctx, input \2', s, count=1)
if count != 1:
    raise SystemExit(f"assignPilot ctx: expected 1 replacement, found {count}")

assign_old = '''      await db.update(b2bDeliveries)
        .set({
          status: "assigned",
          assignedPilotId: input.pilotId,
          updatedAt: new Date(),
        })
        .where(eq(b2bDeliveries.id, input.deliveryId));
      await appendOperationalEventWithDb(tx, {
        channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: null, actorRole: "operations_manager", eventType: "assignment", custodyToUserId: input.pilotId,
        details: { trackingCode: delivery[0].trackingCode, assignedPilotId: input.pilotId },
      });'''
assign_new = '''      await db.transaction(async (tx) => {
        await tx.update(b2bDeliveries)
          .set({
            status: "assigned",
            assignedPilotId: input.pilotId,
            updatedAt: new Date(),
          })
          .where(eq(b2bDeliveries.id, input.deliveryId));
        await appendOperationalEventWithDb(tx, {
          channel: "C2",
          targetType: "b2b",
          targetId: delivery[0].id,
          actorUserId: ctx.user!.id,
          actorRole: ctx.user!.dropiRole || "system_administrator",
          eventType: "assignment",
          custodyToUserId: input.pilotId,
          details: { trackingCode: delivery[0].trackingCode, assignedPilotId: input.pilotId },
        });
      });'''
s = replace_once(s, assign_old, assign_new, "atomic admin assignment")

pilot_pickup_anchor = '''        if (input.newStatus === "picked_up") {
          await appendOperationalEventWithDb(tx, {'''
pilot_pickup_replace = '''        if (input.newStatus === "pickup_enroute") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "execution_started", custodyToUserId: user.id,
            details: { trackingCode: delivery[0].trackingCode, previousStatus },
          });
        }
        if (input.newStatus === "picked_up") {
          await appendOperationalEventWithDb(tx, {'''
s = replace_once(s, pilot_pickup_anchor, pilot_pickup_replace, "pilot pickup_enroute evidence")

admin_pickup_anchor = '''        if (input.newStatus === "picked_up") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "pickup", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });
        }'''
admin_pickup_replace = '''        if (input.newStatus === "assigned") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "assignment", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });
        }
        if (input.newStatus === "pickup_enroute") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "execution_started", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });
        }
        if (input.newStatus === "picked_up") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "pickup", custodyToUserId: pilotId, details: { trackingCode: delivery[0].trackingCode, previousStatus } });
        }'''
s = replace_once(s, admin_pickup_anchor, admin_pickup_replace, "admin assignment/start evidence")

admin_failure_anchor = '''        if (input.newStatus === "failed") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "delivery_failed", details: { trackingCode: delivery[0].trackingCode, reason: input.cancellationReason || null } });
        }'''
admin_failure_replace = '''        if (input.newStatus === "failed" || input.newStatus === "cancelled") {
          await appendOperationalEventWithDb(tx, { channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: actorId, actorRole, eventType: "delivery_failed", details: { trackingCode: delivery[0].trackingCode, terminalStatus: input.newStatus, reason: input.cancellationReason || null } });
        }'''
s = replace_once(s, admin_failure_anchor, admin_failure_replace, "admin failure/cancellation evidence")

if "appendOperationalEvent({" in s:
    raise SystemExit("non-transactional B2B operational event writer remains")
if s.count("appendOperationalEventWithDb(tx, {") < 10:
    raise SystemExit("expected B2B transaction-bound evidence writes were not materialized")
b2b_path.write_text(s)

tracking_path = Path("server/live-tracking.ts")
t = tracking_path.read_text()
tracking_old = '''      await handlePilotMessage(ws, msg, authorization);
    });'''
tracking_new = '''      try {
        await handlePilotMessage(ws, msg, authorization);
      } catch (error) {
        console.error("[ws] Operational trace persistence failed", error);
        closeWithPolicyError(ws, "TRACE_PERSISTENCE_FAILED", "Operational evidence could not be persisted.");
      }
    });'''
t = replace_once(t, tracking_old, tracking_new, "tracking persistence failure guard")
tracking_path.write_text(t)
