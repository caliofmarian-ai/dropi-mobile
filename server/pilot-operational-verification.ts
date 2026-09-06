import { eq, inArray } from "drizzle-orm";
import { pilotProfiles, users, verifications } from "../drizzle/schema";
import { getDb } from "./db";
import { hasCurrentOperationalPilotVerification } from "./user-verification-policy";

export type OperationalPilotVerificationRefresh = {
  refreshed: boolean;
  verifiedUserIds: Set<number>;
};

type VerificationEvidenceRow = {
  userId: number;
  status: string;
  documentType: string;
  expiryDate: Date | null;
};

function groupEvidence(rows: VerificationEvidenceRow[]): Map<number, VerificationEvidenceRow[]> {
  const grouped = new Map<number, VerificationEvidenceRow[]>();
  for (const row of rows) {
    const current = grouped.get(row.userId) ?? [];
    current.push(row);
    grouped.set(row.userId, current);
  }
  return grouped;
}

/**
 * Reconcile the persisted users.isVerified materialized flag with authoritative
 * reviewed license evidence. Pilots without current qualifying evidence are
 * forced offline even when an older materialized flag was already false.
 */
export async function refreshOperationalPilotVerificationFlags(
  now: Date = new Date(),
): Promise<OperationalPilotVerificationRefresh> {
  const db = await getDb();
  if (!db) return { refreshed: false, verifiedUserIds: new Set<number>() };

  const pilotUsers = await db
    .select({ id: users.id, isVerified: users.isVerified })
    .from(users)
    .where(eq(users.dropiRole, "delivery_partner"));

  if (pilotUsers.length === 0) {
    return { refreshed: true, verifiedUserIds: new Set<number>() };
  }

  const userIds = pilotUsers.map((user) => user.id);
  const evidence = await db
    .select({
      userId: verifications.userId,
      status: verifications.status,
      documentType: verifications.documentType,
      expiryDate: verifications.expiryDate,
    })
    .from(verifications)
    .where(inArray(verifications.userId, userIds));

  const evidenceByUser = groupEvidence(evidence as VerificationEvidenceRow[]);
  const verifiedUserIds = new Set<number>();

  for (const user of pilotUsers) {
    if (hasCurrentOperationalPilotVerification(evidenceByUser.get(user.id) ?? [], now)) {
      verifiedUserIds.add(user.id);
    }
  }

  const invalidUserIds = pilotUsers
    .filter((user) => !verifiedUserIds.has(user.id))
    .map((user) => user.id);
  const toEnable = pilotUsers
    .filter((user) => verifiedUserIds.has(user.id) && !user.isVerified)
    .map((user) => user.id);
  const toDisable = pilotUsers
    .filter((user) => !verifiedUserIds.has(user.id) && user.isVerified)
    .map((user) => user.id);

  if (toEnable.length > 0) {
    await db.update(users).set({ isVerified: true }).where(inArray(users.id, toEnable));
  }

  if (toDisable.length > 0) {
    await db.update(users).set({ isVerified: false }).where(inArray(users.id, toDisable));
  }

  if (invalidUserIds.length > 0) {
    await db.update(pilotProfiles).set({ isAvailable: false }).where(inArray(pilotProfiles.userId, invalidUserIds));
  }

  return { refreshed: true, verifiedUserIds };
}

/**
 * Reconcile and return current operational verification for one pilot. The
 * result is evidence-derived, not a trust decision based on a stale user flag.
 */
export async function syncOperationalPilotVerification(
  userId: number,
  now: Date = new Date(),
): Promise<boolean> {
  if (!Number.isSafeInteger(userId) || userId <= 0) return false;

  const db = await getDb();
  if (!db) return false;

  const [pilotUser] = await db
    .select({ id: users.id, dropiRole: users.dropiRole, isVerified: users.isVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!pilotUser || pilotUser.dropiRole !== "delivery_partner") return false;

  const evidence = await db
    .select({
      userId: verifications.userId,
      status: verifications.status,
      documentType: verifications.documentType,
      expiryDate: verifications.expiryDate,
    })
    .from(verifications)
    .where(eq(verifications.userId, userId));

  const verified = hasCurrentOperationalPilotVerification(evidence as VerificationEvidenceRow[], now);

  if (pilotUser.isVerified !== verified) {
    await db.update(users).set({ isVerified: verified }).where(eq(users.id, userId));
  }

  if (!verified) {
    await db.update(pilotProfiles).set({ isAvailable: false }).where(eq(pilotProfiles.userId, userId));
  }

  return verified;
}

export async function isOperationalPilotVerified(
  userId: number,
  now: Date = new Date(),
): Promise<boolean> {
  return syncOperationalPilotVerification(userId, now);
}
