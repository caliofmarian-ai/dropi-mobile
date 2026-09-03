import { describe, expect, it } from "vitest";
import { ROLE_CONFIGS } from "../shared/types";
import { evaluateRbacAccess, resolveCanonicalRole } from "../server/rbac-policy";

describe("canonical DROPi RBAC policy", () => {
  it("accepts every canonical role only on its canonical channel", () => {
    expect(ROLE_CONFIGS).toHaveLength(29);

    for (const config of ROLE_CONFIGS) {
      const accepted = evaluateRbacAccess({
        role: "user",
        dropiRole: config.role,
        channel: config.channel,
        isActive: true,
      });
      expect(accepted).toMatchObject({
        allowed: true,
        role: config.role,
        channel: config.channel,
      });

      const wrongChannel = config.channel === "C1" ? "C2" : "C1";
      const rejected = evaluateRbacAccess({
        role: "user",
        dropiRole: config.role,
        channel: wrongChannel,
        isActive: true,
      });
      expect(rejected).toEqual({
        allowed: false,
        reason: "role_channel_mismatch",
      });
    }
  });

  it("rejects inactive and unknown identities before route authorization", () => {
    expect(
      evaluateRbacAccess({
        role: "user",
        dropiRole: "customer",
        channel: "C1",
        isActive: false,
      }),
    ).toEqual({ allowed: false, reason: "inactive_account" });

    expect(
      evaluateRbacAccess({
        role: "user",
        dropiRole: "not_a_role",
        channel: "C1",
        isActive: true,
      }),
    ).toEqual({ allowed: false, reason: "unknown_role" });
  });

  it("applies the same role graph to AI agents as human users", () => {
    const human = evaluateRbacAccess(
      {
        role: "user",
        dropiRole: "delivery_partner",
        channel: "C1",
        isActive: true,
        isAIAgent: false,
      },
      { permissions: ["execute_flight"] },
    );
    const aiAgent = evaluateRbacAccess(
      {
        role: "user",
        dropiRole: "delivery_partner",
        channel: "C1",
        isActive: true,
        isAIAgent: true,
      },
      { permissions: ["execute_flight"] },
    );

    expect(aiAgent).toEqual(human);
  });

  it("enforces permissions from ROLE_CONFIGS rather than route-local role strings", () => {
    expect(
      evaluateRbacAccess(
        {
          role: "user",
          dropiRole: "customer",
          channel: "C1",
          isActive: true,
        },
        { permissions: ["create_order", "track_order"] },
      ).allowed,
    ).toBe(true);

    expect(
      evaluateRbacAccess(
        {
          role: "user",
          dropiRole: "customer",
          channel: "C1",
          isActive: true,
        },
        { permissions: ["prepare_order"] },
      ),
    ).toEqual({ allowed: false, reason: "permission_denied" });
  });

  it("supports any-permission gates without weakening all-permission gates", () => {
    const identity = {
      role: "user",
      dropiRole: "support_agent",
      channel: "C1",
      isActive: true,
    } as const;

    expect(
      evaluateRbacAccess(identity, {
        permissions: ["resolve_ticket", "manage_users"],
        permissionMode: "any",
      }).allowed,
    ).toBe(true);

    expect(
      evaluateRbacAccess(identity, {
        permissions: ["resolve_ticket", "manage_users"],
      }),
    ).toEqual({ allowed: false, reason: "permission_denied" });
  });

  it("resolves the legacy platform admin flag through the canonical system administrator node", () => {
    const config = resolveCanonicalRole({
      role: "admin",
      dropiRole: "customer",
      channel: "C1",
      isActive: true,
    });

    expect(config?.role).toBe("system_administrator");
    expect(config?.channel).toBe("ADMIN");
    expect(
      evaluateRbacAccess(
        {
          role: "admin",
          dropiRole: "customer",
          channel: "C1",
          isActive: true,
        },
        { roles: ["audit_manager"], channels: ["ADMIN"] },
      ).allowed,
    ).toBe(true);
  });

  it("can disable the platform-admin override for an explicitly non-delegable gate", () => {
    expect(
      evaluateRbacAccess(
        {
          role: "admin",
          dropiRole: "system_administrator",
          channel: "ADMIN",
          isActive: true,
        },
        {
          roles: ["audit_manager"],
          channels: ["ADMIN"],
          allowPlatformAdmin: false,
        },
      ),
    ).toEqual({ allowed: false, reason: "role_not_allowed" });
  });
});
