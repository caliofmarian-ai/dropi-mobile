#!/usr/bin/env python3
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, found {count}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


def replace_after(path: str, marker: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    marker_index = text.find(marker)
    if marker_index < 0:
        raise SystemExit(f"{path}: marker not found: {marker!r}")
    before = text[:marker_index]
    tail = text[marker_index:]
    count = tail.count(old)
    if count < 1:
        raise SystemExit(f"{path}: replacement not found after marker: {old[:120]!r}")
    first = tail.find(old)
    tail = tail[:first] + new + tail[first + len(old):]
    p.write_text(before + tail, encoding="utf-8")


# Centralized notifier imports.
replace_once(
    "server/b2b-router.ts",
    'import { onB2bDeliveryCompleted, onB2bDeliveryFailed } from "./pilot-rating-hooks";\n',
    'import { onB2bDeliveryCompleted, onB2bDeliveryFailed } from "./pilot-rating-hooks";\nimport { notifyB2bDeliveryTransition } from "./b2b-transition-notifications";\n',
)
replace_once(
    "server/rest-gateway.ts",
    'import { triggerWebhooks, buildWebhookPayload, getWebhookEvents } from "./webhook-trigger";\n',
    'import { triggerWebhooks, buildWebhookPayload, getWebhookEvents } from "./webhook-trigger";\nimport { notifyB2bDeliveryTransition } from "./b2b-transition-notifications";\n',
)

# Merchant tRPC cancellation: notify the assigned pilot, but not the merchant actor.
replace_once(
    "server/b2b-router.ts",
    '''      for (const event of events) {
        triggerWebhooks(storeResult[0].id, input.deliveryId, event, { ...payload, event });
      }

      return { success: true, message: "Delivery cancelled successfully" };
''',
    '''      for (const event of events) {
        triggerWebhooks(storeResult[0].id, input.deliveryId, event, { ...payload, event });
      }

      await notifyB2bDeliveryTransition({
        deliveryId: delivery[0].id,
        trackingCode: delivery[0].trackingCode,
        previousStatus,
        newStatus: "cancelled",
        storeOwnerId: storeResult[0].ownerId,
        assignedPilotId: delivery[0].assignedPilotId,
        actorUserId: storeResult[0].ownerId,
      });

      return { success: true, message: "Delivery cancelled successfully" };
''',
)

# Pilot transition: notify the store owner. Pilot identity comes from authenticated ctx.
replace_once(
    "server/b2b-router.ts",
    '''        } catch (e) { /* silent */ }
      }

      return {
        success: true,
        message: `Status updated: ${previousStatus} → ${input.newStatus}`,
''',
    '''        } catch (e) { /* silent */ }

        await notifyB2bDeliveryTransition({
          deliveryId: delivery[0].id,
          trackingCode: delivery[0].trackingCode,
          previousStatus,
          newStatus: input.newStatus,
          storeOwnerId: storeResult[0].ownerId,
          assignedPilotId: (updateData.assignedPilotId as number | undefined) ?? delivery[0].assignedPilotId ?? user.id,
          actorUserId: user.id,
        });
      }

      return {
        success: true,
        message: `Status updated: ${previousStatus} → ${input.newStatus}`,
''',
)

# Admin/system transition: notify both non-actor stakeholders according to preferences.
replace_after(
    "server/b2b-router.ts",
    "  updateStatus: adminProcedure",
    '''    .mutation(async ({ input }) => {
      const db = await getDb();
''',
    '''    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
''',
)
replace_once(
    "server/b2b-router.ts",
    '''      for (const event of events) {
        triggerWebhooks(delivery[0].storeId, delivery[0].id, event, { ...webhookPayload, event });
      }

      return {
        success: true,
        message: `Delivery status updated: ${previousStatus} → ${input.newStatus}`,
''',
    '''      for (const event of events) {
        triggerWebhooks(delivery[0].storeId, delivery[0].id, event, { ...webhookPayload, event });
      }

      const transitionStore = await db.select().from(stores)
        .where(eq(stores.id, delivery[0].storeId))
        .limit(1);
      if (transitionStore.length > 0) {
        await notifyB2bDeliveryTransition({
          deliveryId: delivery[0].id,
          trackingCode: delivery[0].trackingCode,
          previousStatus,
          newStatus: input.newStatus,
          storeOwnerId: transitionStore[0].ownerId,
          assignedPilotId: pilotId,
          actorUserId: ctx.user?.id ?? null,
        });
      }

      return {
        success: true,
        message: `Delivery status updated: ${previousStatus} → ${input.newStatus}`,
''',
)

# API-key REST cancellation: the store is the acting principal; notify assigned pilot only.
replace_once(
    "server/rest-gateway.ts",
    '''      for (const event of events) {
        triggerWebhooks(store.id, deliveryId, event, { ...payload, event });
      }

      res.json({
        success: true,
''',
    '''      for (const event of events) {
        triggerWebhooks(store.id, deliveryId, event, { ...payload, event });
      }

      await notifyB2bDeliveryTransition({
        deliveryId: delivery[0].id,
        trackingCode: delivery[0].trackingCode,
        previousStatus,
        newStatus: "cancelled",
        storeOwnerId: store.ownerId,
        assignedPilotId: delivery[0].assignedPilotId,
        actorUserId: store.ownerId,
      });

      res.json({
        success: true,
''',
)

print("Preference-aware B2B transition push wiring applied.")
