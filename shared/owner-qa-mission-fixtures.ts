export const OWNER_QA_MISSION_FIXTURE_ISSUE = 380 as const;
export const OWNER_QA_MISSION_UIDS = {
  drone: "QA380-C1-DRONE",
  terrestrial: "QA380-C1-TERRESTRIAL",
} as const;

export type OwnerQaMissionKind = keyof typeof OWNER_QA_MISSION_UIDS;
export type OwnerQaDeliveryMode = "drone" | "terrestrial";
export type OwnerQaVehicleType = "drone" | "van";

export type OwnerQaMissionMetadata = {
  issue: typeof OWNER_QA_MISSION_FIXTURE_ISSUE;
  kind: OwnerQaMissionKind;
  label: string;
  targetPilotId: number;
  deliveryMode: OwnerQaDeliveryMode;
  vehicleType: OwnerQaVehicleType;
  vehicleId: string;
};

export type OwnerQaSnapshotItem = {
  name?: unknown;
  quantity?: unknown;
  weight?: unknown;
  ownerQaFixture?: unknown;
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function readOwnerQaMissionMetadata(items: unknown): OwnerQaMissionMetadata | null {
  if (!Array.isArray(items)) return null;
  for (const item of items as OwnerQaSnapshotItem[]) {
    if (!item || typeof item !== "object") continue;
    const raw = item.ownerQaFixture;
    if (!raw || typeof raw !== "object") continue;
    const metadata = raw as Record<string, unknown>;
    const kind = metadata.kind;
    const deliveryMode = metadata.deliveryMode;
    const vehicleType = metadata.vehicleType;
    if (
      metadata.issue !== OWNER_QA_MISSION_FIXTURE_ISSUE ||
      (kind !== "drone" && kind !== "terrestrial") ||
      !isPositiveInteger(metadata.targetPilotId) ||
      (deliveryMode !== "drone" && deliveryMode !== "terrestrial") ||
      (vehicleType !== "drone" && vehicleType !== "van") ||
      typeof metadata.label !== "string" ||
      typeof metadata.vehicleId !== "string"
    ) {
      return null;
    }
    return {
      issue: OWNER_QA_MISSION_FIXTURE_ISSUE,
      kind,
      label: metadata.label,
      targetPilotId: metadata.targetPilotId,
      deliveryMode,
      vehicleType,
      vehicleId: metadata.vehicleId,
    };
  }
  return null;
}

export function isOwnerQaMissionOrderUid(orderUid: string): boolean {
  return Object.values(OWNER_QA_MISSION_UIDS).includes(orderUid as (typeof OWNER_QA_MISSION_UIDS)[OwnerQaMissionKind]);
}

export function canActorSeeOwnerQaMission(items: unknown, actorId: number): boolean {
  const metadata = readOwnerQaMissionMetadata(items);
  return !metadata || metadata.targetPilotId === actorId;
}
