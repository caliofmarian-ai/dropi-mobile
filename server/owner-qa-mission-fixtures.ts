import { and, eq, inArray } from "drizzle-orm";
import {
  deliveries,
  orders,
  users,
} from "../drizzle/schema";
import {
  deliveryProofAttestations,
  deliveryProofs,
  flightTelemetrySamples,
  operationalEvidenceEvents,
} from "../drizzle/operational-trace-schema";
import {
  OWNER_QA_MISSION_FIXTURE_ISSUE,
  OWNER_QA_MISSION_UIDS,
  readOwnerQaMissionMetadata,
  type OwnerQaMissionKind,
} from "../shared/owner-qa-mission-fixtures";
import { TEST_ROLE_IDENTITIES } from "../shared/test-role-accounts";
import { buildAuditAttribution, type AuditSessionLike } from "./audit-policy";
import { createAuditLog, getDb } from "./db";
import { getTestAccountProvisioningStatus } from "./test-account-provisioning";

const REQUIRED_TEST_ROLES = ["customer", "merchant", "delivery_partner"] as const;
type RequiredTestRole = (typeof REQUIRED_TEST_ROLES)[number];

export type OwnerQaFixtureActor = {
  id: number;
  dropiRole?: string | null;
};

type ResolvedTestIdentity = {
  id: number;
  email: string;
  role: RequiredTestRole;
  channel: "C1";
  zone: string;
  isActive: boolean;
  isVerified: boolean;
};

const FIXTURE_SPECS: Record<OwnerQaMissionKind, {
  label: string;
  deliveryMode: "drone" | "terrestrial";
  vehicleType: "drone" | "van";
  vehicleId: string;
  itemName: string;
  packageWeightKg: string;
  totalAmount: string;
  estimatedTime: number;
}> = {
  drone: {
    label: "OWNER QA · DRONE · #380",
    deliveryMode: "drone",
    vehicleType: "drone",
    vehicleId: "QA-DRONE-380",
    itemName: "OWNER QA lightweight drone parcel",
    packageWeightKg: "0.45",
    totalAmount: "1.00",
    estimatedTime: 12,
  },
  terrestrial: {
    label: "OWNER QA · TERRESTRIAL · #380",
    deliveryMode: "terrestrial",
    vehicleType: "van",
    vehicleId: "QA-VAN-380",
    itemName: "OWNER QA terrestrial van parcel",
    packageWeightKg: "3.20",
    totalAmount: "2.00",
    estimatedTime: 18,
  },
};

function canonicalHumanEmail(role: RequiredTestRole): string {
  const identity = TEST_ROLE_IDENTITIES.find((candidate) => candidate.role === role);
  if (!identity) throw new Error(`Canonical TEST HUMAN identity missing for ${role}`);
  return identity.humanEmail.trim().toLowerCase();
}

async function resolveRequiredTestIdentities(): Promise<Record<RequiredTestRole, ResolvedTestIdentity>> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const emails = REQUIRED_TEST_ROLES.map(canonicalHumanEmail);
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      dropiRole: users.dropiRole,
      channel: users.channel,
      zone: users.zone,
      isActive: users.isActive,
      isVerified: users.isVerified,
      isAIAgent: users.isAIAgent,
    })
    .from(users)
    .where(inArray(users.email, emails));

  const byEmail = new Map(rows.map((row) => [row.email?.trim().toLowerCase() || "", row]));
  const resolved = {} as Record<RequiredTestRole, ResolvedTestIdentity>;

  for (const role of REQUIRED_TEST_ROLES) {
    const email = canonicalHumanEmail(role);
    const row = byEmail.get(email);
    if (!row) throw new Error(`Canonical TEST HUMAN ${role} account is not provisioned`);
    if (row.isAIAgent || row.dropiRole !== role || row.channel !== "C1") {
      throw new Error(`Canonical TEST HUMAN ${role} identity does not match the governed C1 role boundary`);
    }
    if (!row.zone?.trim()) throw new Error(`Canonical TEST HUMAN ${role} account has no operating zone`);
    resolved[role] = {
      id: row.id,
      email,
      role,
      channel: "C1",
      zone: row.zone.trim(),
      isActive: row.isActive,
      isVerified: row.isVerified,
    };
  }

  const zones = new Set(REQUIRED_TEST_ROLES.map((role) => resolved[role].zone.toLowerCase()));
  if (zones.size !== 1) {
    throw new Error("Canonical C1 TEST HUMAN identities must share one operating zone before owner QA fixtures can be reconciled");
  }
  return resolved;
}

function assertFixtureEnvironmentEnabled() {
  const status = getTestAccountProvisioningStatus();
  if (!status.enabled) {
    throw new Error("Owner QA mission fixtures are disabled because canonical test-account provisioning is not enabled on this server");
  }
}

async function fixtureOrderRows() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select()
    .from(orders)
    .where(inArray(orders.orderUid, Object.values(OWNER_QA_MISSION_UIDS)));
}

async function deleteFixtureRuntimeData(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await fixtureOrderRows();
  const orderIds = existing.map((row) => row.id);
  if (orderIds.length === 0) return 0;

  await db.transaction(async (tx) => {
    const proofs = await tx
      .select({ id: deliveryProofs.id })
      .from(deliveryProofs)
      .where(and(
        eq(deliveryProofs.channel, "C1"),
        eq(deliveryProofs.targetType, "order"),
        inArray(deliveryProofs.targetId, orderIds),
      ));
    const proofIds = proofs.map((proof) => proof.id);
    if (proofIds.length > 0) {
      await tx.delete(deliveryProofAttestations).where(inArray(deliveryProofAttestations.proofId, proofIds));
      await tx.delete(deliveryProofs).where(inArray(deliveryProofs.id, proofIds));
    }

    await tx.delete(flightTelemetrySamples).where(and(
      eq(flightTelemetrySamples.channel, "C1"),
      eq(flightTelemetrySamples.targetType, "order"),
      inArray(flightTelemetrySamples.targetId, orderIds),
    ));
    await tx.delete(operationalEvidenceEvents).where(and(
      eq(operationalEvidenceEvents.channel, "C1"),
      eq(operationalEvidenceEvents.targetType, "order"),
      inArray(operationalEvidenceEvents.targetId, orderIds),
    ));
    await tx.delete(deliveries).where(inArray(deliveries.orderId, orderIds));
    await tx.delete(orders).where(inArray(orders.id, orderIds));
  });

  return existing.length;
}

async function auditFixtureAction(input: {
  actor: OwnerQaFixtureActor;
  session?: AuditSessionLike;
  action: "owner_qa.mission_fixtures_reconciled" | "owner_qa.mission_fixtures_reset";
  details: Record<string, unknown>;
}) {
  const attribution = buildAuditAttribution("ADMIN", input.session);
  await createAuditLog({
    userId: input.actor.id,
    userRole: input.actor.dropiRole || "system_administrator",
    action: input.action,
    resourceType: "owner_qa_fixture",
    resourceId: String(OWNER_QA_MISSION_FIXTURE_ISSUE),
    details: input.details,
    severity: "warning",
    channel: attribution.channel,
    isPhantomMode: attribution.isPhantomMode,
    phantomAdminId: attribution.phantomAdminId,
    isAIAction: false,
  });
}

export async function getOwnerQaMissionFixtureStatus() {
  assertFixtureEnvironmentEnabled();
  const identities = await resolveRequiredTestIdentities();
  const existing = await fixtureOrderRows();
  const expectedPilotId = identities.delivery_partner.id;

  const fixtures = (Object.keys(OWNER_QA_MISSION_UIDS) as OwnerQaMissionKind[]).map((kind) => {
    const uid = OWNER_QA_MISSION_UIDS[kind];
    const row = existing.find((candidate) => candidate.orderUid === uid);
    const metadata = row ? readOwnerQaMissionMetadata(row.items) : null;
    return {
      kind,
      orderUid: uid,
      exists: Boolean(row),
      orderId: row?.id ?? null,
      status: row?.status ?? null,
      targetPilotMatches: metadata?.targetPilotId === expectedPilotId,
      deliveryMode: metadata?.deliveryMode ?? null,
      vehicleType: metadata?.vehicleType ?? null,
      vehicleId: metadata?.vehicleId ?? null,
    };
  });

  return {
    enabled: true,
    issue: OWNER_QA_MISSION_FIXTURE_ISSUE,
    zone: identities.delivery_partner.zone,
    deliveryPartner: {
      id: identities.delivery_partner.id,
      email: identities.delivery_partner.email,
      active: identities.delivery_partner.isActive,
      operationallyVerified: identities.delivery_partner.isVerified,
    },
    fixtureCount: fixtures.filter((fixture) => fixture.exists).length,
    readyForRadar:
      identities.delivery_partner.isActive &&
      identities.delivery_partner.isVerified &&
      fixtures.every((fixture) => fixture.exists && fixture.status === "ready" && fixture.targetPilotMatches),
    fixtures,
  };
}

export async function reconcileOwnerQaMissionFixtures(input: {
  actor: OwnerQaFixtureActor;
  session?: AuditSessionLike;
}) {
  assertFixtureEnvironmentEnabled();
  const identities = await resolveRequiredTestIdentities();
  const deletedBeforeCreate = await deleteFixtureRuntimeData();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const targetPilotId = identities.delivery_partner.id;
  const zone = identities.delivery_partner.zone;
  const created: Array<{ kind: OwnerQaMissionKind; orderId: number; orderUid: string }> = [];

  await db.transaction(async (tx) => {
    for (const kind of Object.keys(FIXTURE_SPECS) as OwnerQaMissionKind[]) {
      const spec = FIXTURE_SPECS[kind];
      const orderUid = OWNER_QA_MISSION_UIDS[kind];
      const inserted = await tx
        .insert(orders)
        .values({
          orderUid,
          customerId: identities.customer.id,
          merchantId: identities.merchant.id,
          pilotId: null,
          status: "ready",
          items: [
            {
              name: spec.itemName,
              quantity: 1,
              unitPrice: Number(spec.totalAmount),
              weight: Number(spec.packageWeightKg),
              ownerQaFixture: {
                issue: OWNER_QA_MISSION_FIXTURE_ISSUE,
                kind,
                label: spec.label,
                targetPilotId,
                deliveryMode: spec.deliveryMode,
                vehicleType: spec.vehicleType,
                vehicleId: spec.vehicleId,
              },
            },
          ],
          totalAmount: spec.totalAmount,
          deliveryAddress: `[OWNER QA #380] ${kind === "drone" ? "Drone reception point" : "Terrestrial delivery point"} · ${zone}`,
          pickupAddress: `[OWNER QA #380] TEST HUMAN Merchant pickup · ${zone}`,
          zone,
          estimatedTime: spec.estimatedTime,
          packageWeight: spec.packageWeightKg,
        })
        .$returningId();
      const orderId = inserted[0]?.id;
      if (!orderId) throw new Error(`Failed to materialize ${kind} owner QA order`);
      created.push({ kind, orderId, orderUid });
    }
  });

  await auditFixtureAction({
    actor: input.actor,
    session: input.session,
    action: "owner_qa.mission_fixtures_reconciled",
    details: {
      issue: OWNER_QA_MISSION_FIXTURE_ISSUE,
      zone,
      deletedBeforeCreate,
      targetPilotId,
      testCustomerId: identities.customer.id,
      testMerchantId: identities.merchant.id,
      fixtures: created,
      productionUsersAffected: 0,
    },
  });

  return getOwnerQaMissionFixtureStatus();
}

export async function resetOwnerQaMissionFixtures(input: {
  actor: OwnerQaFixtureActor;
  session?: AuditSessionLike;
}) {
  assertFixtureEnvironmentEnabled();
  const deleted = await deleteFixtureRuntimeData();
  await auditFixtureAction({
    actor: input.actor,
    session: input.session,
    action: "owner_qa.mission_fixtures_reset",
    details: {
      issue: OWNER_QA_MISSION_FIXTURE_ISSUE,
      deleted,
      productionUsersAffected: 0,
      auditHistoryRetained: true,
    },
  });
  return { success: true, deleted };
}
