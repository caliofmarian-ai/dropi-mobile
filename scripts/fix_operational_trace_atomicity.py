from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def replace_first(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count < 1:
        raise SystemExit(f"{label}: expected at least one match, found {count}")
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

s = replace_once(
    s,
    '      failureReason: z.string().optional(),\n      completionProof: z.object({',
    '      failureReason: z.string().trim().max(1000).optional(),\n      incidentType: z.enum(["stop", "fallback", "failure"]).optional(),\n      completionProof: z.object({',
    "pilot incident schema",
)
s = replace_once(
    s,
    '      cancelledBy: z.enum(["system", "pilot"]).optional(),\n      completionProof: z.object({',
    '      cancelledBy: z.enum(["system", "pilot"]).optional(),\n      incidentType: z.enum(["stop", "fallback", "failure"]).optional(),\n      completionProof: z.object({',
    "admin incident schema",
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

pilot_incident_anchor = '''      const previousStatus = delivery[0].status;
      if (input.newStatus === "delivered" && !input.completionProof) {'''
pilot_incident_replace = '''      const previousStatus = delivery[0].status;
      if (input.newStatus === "failed" && !input.failureReason?.trim()) {
        throw new Error("A factual failure reason is required for STOP, fallback, or failed delivery evidence.");
      }
      const incidentType = input.incidentType ?? "failure";
      if (input.newStatus === "delivered" && !input.completionProof) {'''
s = replace_first(s, pilot_incident_anchor, pilot_incident_replace, "pilot incident requirement")

admin_anchor = '''      if (previousStatus === input.newStatus) {
        return { success: true, message: "Status unchanged" };
      }
      if (input.newStatus === "delivered" && !input.completionProof) {'''
admin_replace = '''      if (previousStatus === input.newStatus) {
        return { success: true, message: "Status unchanged" };
      }
      assertB2bTransition(previousStatus, input.newStatus, { allowFailure: true, allowCancellation: true });
      if ((input.newStatus === "failed" || input.newStatus === "cancelled") && !input.cancellationReason?.trim()) {
        throw new Error("A factual reason is required for failed or cancelled operational evidence.");
      }
      const incidentType = input.incidentType ?? "failure";
      if (input.newStatus === "delivered" && !input.completionProof) {'''
s = replace_once(s, admin_anchor, admin_replace, "admin transition and incident guard")

# Every B2B domain-evidence write must use the same transaction as its state change.
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
s = replace_first(s, pilot_pickup_anchor, pilot_pickup_replace, "pilot pickup_enroute evidence")

pilot_failure_anchor = '''        if (input.newStatus === "failed") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2", targetType: "b2b", targetId: delivery[0].id, actorUserId: user.id, actorRole: "delivery_partner", eventType: "delivery_failed",
            details: { trackingCode: delivery[0].trackingCode, reason: input.failureReason || null },
          });
        }'''
pilot_failure_replace = '''        if (input.newStatus === "failed") {
          await appendOperationalEventWithDb(tx, {
            channel: "C2",
            targetType: "b2b",
            targetId: delivery[0].id,
            actorUserId: user.id,
            actorRole: "delivery_partner",
            eventType: incidentType === "stop" ? "stop" : incidentType === "fallback" ? "fallback" : "delivery_failed",
            custodyFromUserId: user.id,
            details: {
              trackingCode: delivery[0].trackingCode,
              reason: input.failureReason!.trim(),
              incidentType,
              resultingStatus: "failed",
            },
          });
        }'''
s = replace_once(s, pilot_failure_anchor, pilot_failure_replace, "pilot STOP/fallback evidence")

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
          await appendOperationalEventWithDb(tx, {
            channel: "C2",
            targetType: "b2b",
            targetId: delivery[0].id,
            actorUserId: actorId,
            actorRole,
            eventType: incidentType === "stop" ? "stop" : incidentType === "fallback" ? "fallback" : "delivery_failed",
            custodyFromUserId: pilotId,
            details: {
              trackingCode: delivery[0].trackingCode,
              terminalStatus: input.newStatus,
              reason: input.cancellationReason!.trim(),
              incidentType,
              resultingStatus: input.newStatus,
            },
          });
        }'''
s = replace_once(s, admin_failure_anchor, admin_failure_replace, "admin STOP/fallback/failure evidence")

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

mission_path = Path("app/mission/[id].tsx")
m = mission_path.read_text()
m = replace_once(
    m,
    '  const syncStatusToServer = async (newStatus: string, extras?: { failureReason?: string }) => {',
    '  const syncStatusToServer = async (newStatus: string, extras?: { failureReason?: string; incidentType?: "stop" | "fallback" | "failure" }) => {',
    "mission sync signature",
)
m = replace_once(
    m,
    '''    try {
      await pilotUpdateStatus.mutateAsync({
        deliveryId: mission.orderId,
        newStatus: newStatus as any,
        ...(extras?.failureReason && { failureReason: extras.failureReason }),
      });
    } catch (e) {
      // Silent fail — local flow continues
    } finally {
      setStatusUpdating(false);
    }''',
    '''    try {
      await pilotUpdateStatus.mutateAsync({
        deliveryId: mission.orderId,
        newStatus: newStatus as any,
        ...(extras?.failureReason && { failureReason: extras.failureReason }),
        ...(extras?.incidentType && { incidentType: extras.incidentType }),
      });
    } finally {
      setStatusUpdating(false);
    }''',
    "mission fail-closed sync",
)
m = replace_once(
    m,
    '''      } catch (e) {
        // If we can't check, allow in demo mode but warn
        console.warn("Could not verify status:", e);
      }
      setCheckingVerification(false);''',
    '''      } catch (e) {
        console.warn("Could not verify status:", e);
        Alert.alert("Verification unavailable", "Mission acceptance is blocked until verification can be confirmed by the server.");
        setCheckingVerification(false);
        return;
      }
      setCheckingVerification(false);''',
    "verification fail closed",
)
m = replace_once(
    m,
    '''    // Sync to server: assigned
    syncStatusToServer("assigned");
    setPhase("preflight");''',
    '''    try {
      await syncStatusToServer("assigned");
      setPhase("preflight");
    } catch (error: any) {
      Alert.alert("Mission acceptance blocked", error?.message || "The assigned state could not be persisted.");
    }''',
    "assigned persistence gate",
)
m = replace_once(
    m,
    '''  const handleLaunch = () => {
    if (!allChecked) {
      Alert.alert("Incomplete Check", "All items must be confirmed before launch.");
      return;
    }
    // Sync to server: pickup_enroute → picked_up → in_transit (rapid progression)
    syncStatusToServer("pickup_enroute");
    setTimeout(() => syncStatusToServer("picked_up"), 500);
    setTimeout(() => syncStatusToServer("in_transit"), 1000);
    setPhase("inflight");
  };''',
    '''  const handleLaunch = async () => {
    if (!allChecked) {
      Alert.alert("Incomplete Check", "All items must be confirmed before launch.");
      return;
    }
    try {
      await syncStatusToServer("pickup_enroute");
      await syncStatusToServer("picked_up");
      await syncStatusToServer("in_transit");
      setPhase("inflight");
    } catch (error: any) {
      Alert.alert("Launch blocked", error?.message || "The operational state chain could not be persisted.");
    }
  };''',
    "sequential launch state chain",
)
m = replace_once(
    m,
    '''              onPress: () => {
            syncStatusToServer("failed", { failureReason: "Emergency stop executed by pilot" });
            Alert.alert("Vehicle Stopped", "Emergency stop executed. Creating incident report.");
            setPhase("complete");
          },''',
    '''          onPress: async () => {
            try {
              await syncStatusToServer("failed", { failureReason: "Emergency stop executed by pilot", incidentType: "stop" });
              Alert.alert("Vehicle Stopped", "Emergency stop was persisted in the operational incident chain.");
              setPhase("complete");
            } catch (error: any) {
              Alert.alert("STOP evidence failed", error?.message || "The STOP event could not be persisted.");
            }
          },''',
    "STOP evidence UI",
)
m = replace_once(
    m,
    '''            onPress: () => {
            syncStatusToServer("failed", { failureReason: isDrone ? "Fallback: drone returning to DronePort" : "Fallback: vehicle returning to depot" });
            Alert.alert("Fallback Active", isDrone ? "Drone returning to DronePort Alpha." : "Vehicle returning to depot.");
            setPhase("complete");
          },''',
    '''          onPress: async () => {
            try {
              await syncStatusToServer("failed", {
                failureReason: isDrone ? "Fallback activated: drone return requested to DronePort" : "Fallback activated: vehicle return requested to origin",
                incidentType: "fallback",
              });
              Alert.alert("Fallback recorded", "Fallback activation and resulting failed mission state were persisted.");
              setPhase("complete");
            } catch (error: any) {
              Alert.alert("Fallback blocked", error?.message || "Fallback evidence could not be persisted.");
            }
          },''',
    "fallback evidence UI",
)
m = replace_once(
    m,
    '''              onPress={() => {
                syncStatusToServer("delivered");
                setPhase("complete");
              }}''',
    '''              onPress={() => router.push({ pathname: "/pilot/complete-mission", params: { deliveryId: String(mission.orderId) } } as any)}''',
    "B2B proof completion route",
)
mission_path.write_text(m)
