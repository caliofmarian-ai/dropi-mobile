import {
  ROLE_CONFIGS,
  type Channel,
  type DropiRole,
  type RoleConfig,
} from "../shared/types";

export type RbacIdentity = {
  role?: string | null;
  dropiRole?: string | null;
  channel?: string | null;
  isActive?: boolean | null;
  isAIAgent?: boolean | null;
};

export type RbacRequirement = {
  roles?: readonly DropiRole[];
  channels?: readonly Channel[];
  permissions?: readonly string[];
  permissionMode?: "all" | "any";
  allowPlatformAdmin?: boolean;
};

export type RbacDecision =
  | { allowed: true; role: DropiRole; channel: Channel; permissions: readonly string[] }
  | {
      allowed: false;
      reason:
        | "inactive_account"
        | "unknown_role"
        | "role_channel_mismatch"
        | "role_not_allowed"
        | "channel_not_allowed"
        | "permission_denied";
    };

const ROLE_BY_NAME = new Map<DropiRole, RoleConfig>(
  ROLE_CONFIGS.map((config): [DropiRole, RoleConfig] => [config.role, config]),
);

function asDropiRole(value: string | null | undefined): DropiRole | null {
  if (!value) return null;
  return ROLE_BY_NAME.has(value as DropiRole) ? (value as DropiRole) : null;
}

/**
 * Resolve an authenticated identity onto the single canonical DROPi role graph.
 *
 * The legacy platform-level `role=admin` flag is retained as an owner/root
 * authority marker, but authorization still resolves it through the canonical
 * System Administrator / ADMIN node rather than creating a parallel permission
 * system. Human users and AI agents otherwise follow exactly the same graph.
 */
export function resolveCanonicalRole(identity: RbacIdentity): RoleConfig | null {
  if (identity.role === "admin") {
    return ROLE_BY_NAME.get("system_administrator") ?? null;
  }

  const role = asDropiRole(identity.dropiRole);
  if (!role) return null;
  return ROLE_BY_NAME.get(role) ?? null;
}

export function evaluateRbacAccess(
  identity: RbacIdentity,
  requirement: RbacRequirement = {},
): RbacDecision {
  if (identity.isActive === false) {
    return { allowed: false, reason: "inactive_account" };
  }

  const config = resolveCanonicalRole(identity);
  if (!config) {
    return { allowed: false, reason: "unknown_role" };
  }

  const isPlatformAdmin = identity.role === "admin";
  const effectiveChannel = isPlatformAdmin ? "ADMIN" : identity.channel;
  if (effectiveChannel !== config.channel) {
    return { allowed: false, reason: "role_channel_mismatch" };
  }

  const allowAdminOverride = requirement.allowPlatformAdmin !== false && isPlatformAdmin;

  if (
    requirement.roles?.length &&
    !requirement.roles.includes(config.role) &&
    !allowAdminOverride
  ) {
    return { allowed: false, reason: "role_not_allowed" };
  }

  if (
    requirement.channels?.length &&
    !requirement.channels.includes(config.channel) &&
    !allowAdminOverride
  ) {
    return { allowed: false, reason: "channel_not_allowed" };
  }

  if (requirement.permissions?.length && !allowAdminOverride) {
    const granted = new Set(config.permissions);
    const checks = requirement.permissions.map((permission) => granted.has(permission));
    const hasPermission =
      requirement.permissionMode === "any" ? checks.some(Boolean) : checks.every(Boolean);
    if (!hasPermission) {
      return { allowed: false, reason: "permission_denied" };
    }
  }

  return {
    allowed: true,
    role: config.role,
    channel: config.channel,
    permissions: config.permissions,
  };
}

export function describeRbacDenial(decision: Extract<RbacDecision, { allowed: false }>): string {
  switch (decision.reason) {
    case "inactive_account":
      return "Inactive accounts cannot access protected DROPi routes.";
    case "unknown_role":
      return "Authenticated account has no canonical DROPi role.";
    case "role_channel_mismatch":
      return "DROPi role and channel assignment are inconsistent.";
    case "role_not_allowed":
      return "DROPi role is not authorized for this operation.";
    case "channel_not_allowed":
      return "DROPi channel is not authorized for this operation.";
    case "permission_denied":
      return "DROPi role does not grant the required permission.";
  }
}
