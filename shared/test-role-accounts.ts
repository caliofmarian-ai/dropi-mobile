import { ROLE_CONFIGS, type Channel, type DropiRole } from "./types";

export type TestIdentityKind = "human" | "ai";

export const DROPI_TEST_BASE_INBOX = "dropi.deliveries@gmail.com";
export const DROPI_TEST_LOCAL_PART = "dropi.deliveries";
export const DROPI_TEST_DOMAIN = "gmail.com";

export interface TestRoleIdentity {
  role: DropiRole;
  channel: Channel;
  label: string;
  humanEmail: string;
  aiEmail: string;
  humanOpenId: string;
  aiOpenId: string;
}

export function buildTestRoleEmail(role: DropiRole, kind: TestIdentityKind): string {
  return `${DROPI_TEST_LOCAL_PART}+${kind}.${role}@${DROPI_TEST_DOMAIN}`;
}

export function buildTestRoleOpenId(role: DropiRole, kind: TestIdentityKind): string {
  return `dropi-test-${kind}-${role}`;
}

/**
 * Canonical pre-production identity registry for IMPL-008.
 *
 * It is derived directly from ROLE_CONFIGS so the repository has one role graph,
 * not a second hard-coded list that can drift from RBAC.
 */
export const TEST_ROLE_IDENTITIES: TestRoleIdentity[] = ROLE_CONFIGS.map((config) => ({
  role: config.role,
  channel: config.channel,
  label: config.label,
  humanEmail: buildTestRoleEmail(config.role, "human"),
  aiEmail: buildTestRoleEmail(config.role, "ai"),
  humanOpenId: buildTestRoleOpenId(config.role, "human"),
  aiOpenId: buildTestRoleOpenId(config.role, "ai"),
}));

export const TEST_ROLE_IDENTITY_TOTALS = Object.freeze({
  roles: TEST_ROLE_IDENTITIES.length,
  human: TEST_ROLE_IDENTITIES.length,
  ai: TEST_ROLE_IDENTITIES.length,
  pairedAccounts: TEST_ROLE_IDENTITIES.length * 2,
  identitiesIncludingBaseSuperAdmin: TEST_ROLE_IDENTITIES.length * 2 + 1,
});
