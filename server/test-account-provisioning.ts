import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { pushTokens, sessions, users } from "../drizzle/schema";
import {
  DROPI_TEST_BASE_INBOX,
  TEST_ROLE_IDENTITIES,
  TEST_ROLE_IDENTITY_TOTALS,
  type TestIdentityKind,
} from "../shared/test-role-accounts";
import type { Channel, DropiRole } from "../shared/types";
import { getDb } from "./db";

const ENABLE_FLAG = "enabled";

export type ProvisioningConfig = {
  password: string;
  zone: string;
};

function validateProvisioningConfig(config: ProvisioningConfig): ProvisioningConfig {
  const password = config.password;
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error(
      "Test-account password must be at least 12 characters and contain an uppercase letter and a number.",
    );
  }

  const zone = config.zone.trim();
  if (!zone) {
    throw new Error("A test operating zone is required for C1/C2/C3 test identities.");
  }

  return { password, zone };
}

function requireCliProvisioningConfig(): ProvisioningConfig {
  if (process.env.DROPI_TEST_ACCOUNT_PROVISIONING?.trim().toLowerCase() !== ENABLE_FLAG) {
    throw new Error(
      "Test-account provisioning is disabled. Set DROPI_TEST_ACCOUNT_PROVISIONING=enabled explicitly for CLI provisioning.",
    );
  }

  return validateProvisioningConfig({
    password: process.env.DROPI_TEST_ACCOUNT_PASSWORD || "",
    zone: process.env.DROPI_TEST_ACCOUNT_ZONE || "",
  });
}

type DbTransaction = Parameters<
  NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]
>[0] extends (tx: infer T) => unknown ? T : never;

function platformRole(role: DropiRole): "user" | "admin" {
  return role === "system_administrator" ? "admin" : "user";
}

function zoneFor(channel: Channel, configuredZone: string): string | null {
  return channel === "ADMIN" ? null : configuredZone;
}

async function clearStaleDeviceAccess(tx: DbTransaction, userId: number) {
  // Reconciliation may rotate the shared test password. Revoke every previous
  // server session and push registration for the test identity in the same
  // transaction so stale devices cannot remain authenticated or receive pushes.
  await tx.delete(sessions).where(eq(sessions.userId, userId));
  await tx.delete(pushTokens).where(eq(pushTokens.userId, userId));
}

async function reconcileIdentity(
  tx: DbTransaction,
  input: {
    kind: TestIdentityKind;
    openId: string;
    email: string;
    name: string;
    role: DropiRole;
    channel: Channel;
    zone: string | null;
    passwordHash: string;
    humanPairId?: number | null;
  },
): Promise<number> {
  const matches = await tx
    .select()
    .from(users)
    .where(or(eq(users.openId, input.openId), eq(users.email, input.email)));

  const openIdMatch = matches.find((row) => row.openId === input.openId);
  const emailMatches = matches.filter((row) => row.email === input.email);
  if (emailMatches.length > 1) {
    throw new Error(`Refusing to provision duplicate email identity: ${input.email}`);
  }

  const emailMatch = emailMatches[0];
  if (openIdMatch && emailMatch && openIdMatch.id !== emailMatch.id) {
    throw new Error(
      `Identity conflict for ${input.email}: deterministic openId and email belong to different rows.`,
    );
  }

  const existing = openIdMatch ?? emailMatch;
  const values = {
    openId: input.openId,
    name: input.name,
    email: input.email,
    loginMethod: "password",
    role: platformRole(input.role),
    dropiRole: input.role,
    channel: input.channel,
    zone: input.zone,
    isActive: true,
    isVerified: true,
    passwordHash: input.passwordHash,
    isAIAgent: input.kind === "ai",
    agentMode: input.kind === "ai" ? ("autonomous" as const) : null,
    humanPairId: input.kind === "ai" ? (input.humanPairId ?? null) : null,
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    resetToken: null,
    resetTokenExpiry: null,
    emailVerifyToken: null,
    emailVerifyExpires: null,
  };

  if (existing) {
    await tx.update(users).set(values).where(eq(users.id, existing.id));
    await clearStaleDeviceAccess(tx, existing.id);
    return existing.id;
  }

  const result = await tx.insert(users).values(values);
  const insertedId = Number(result[0].insertId);
  await clearStaleDeviceAccess(tx, insertedId);
  return insertedId;
}

/**
 * Create/reconcile the canonical IMPL-008 test-role population.
 *
 * The base Super Admin is intentionally untouched. Human rows are reconciled
 * first inside one transaction; each AI mirror then receives the actual persisted
 * human row ID in humanPairId. A provisioning failure rolls the whole set back.
 * Existing sessions and push registrations for these test identities are revoked
 * when they are reconciled so a rotated test password cannot leave stale access.
 *
 * The authenticated Phantom Console passes the password and zone for one request.
 * The CLI path remains fail-closed behind explicit server-only environment values.
 */
export async function provisionTestRoleAccounts(config?: ProvisioningConfig) {
  const { password, zone } = config
    ? validateProvisioningConfig(config)
    : requireCliProvisioningConfig();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = await bcrypt.hash(password, 12);
  const pairs: Array<{ role: DropiRole; humanId: number; aiId: number }> = [];

  await db.transaction(async (tx) => {
    for (const identity of TEST_ROLE_IDENTITIES) {
      const identityZone = zoneFor(identity.channel, zone);
      const humanId = await reconcileIdentity(tx, {
        kind: "human",
        openId: identity.humanOpenId,
        email: identity.humanEmail,
        name: `Test ${identity.label}`,
        role: identity.role,
        channel: identity.channel,
        zone: identityZone,
        passwordHash,
      });

      const aiId = await reconcileIdentity(tx, {
        kind: "ai",
        openId: identity.aiOpenId,
        email: identity.aiEmail,
        name: `AI ${identity.label} Agent`,
        role: identity.role,
        channel: identity.channel,
        zone: identityZone,
        passwordHash,
        humanPairId: humanId,
      });

      pairs.push({ role: identity.role, humanId, aiId });
    }
  });

  return {
    baseSuperAdmin: DROPI_TEST_BASE_INBOX,
    roles: TEST_ROLE_IDENTITY_TOTALS.roles,
    humanAccounts: TEST_ROLE_IDENTITY_TOTALS.human,
    aiAccounts: TEST_ROLE_IDENTITY_TOTALS.ai,
    pairedAccounts: TEST_ROLE_IDENTITY_TOTALS.pairedAccounts,
    identitiesIncludingBaseSuperAdmin: TEST_ROLE_IDENTITY_TOTALS.identitiesIncludingBaseSuperAdmin,
    pairs,
  };
}
