import { describe, expect, it } from "vitest";
import { ROLE_CONFIGS } from "../shared/types";
import {
  DROPI_TEST_BASE_INBOX,
  TEST_ROLE_IDENTITIES,
  TEST_ROLE_IDENTITY_TOTALS,
  buildTestRoleEmail,
  buildTestRoleOpenId,
} from "../shared/test-role-accounts";

describe("IMPL-008 canonical test-role identity registry", () => {
  it("derives exactly one human and one AI identity for every canonical role", () => {
    expect(ROLE_CONFIGS).toHaveLength(29);
    expect(TEST_ROLE_IDENTITIES).toHaveLength(ROLE_CONFIGS.length);

    expect(TEST_ROLE_IDENTITIES.map((entry) => entry.role)).toEqual(
      ROLE_CONFIGS.map((entry) => entry.role),
    );
    expect(TEST_ROLE_IDENTITIES.map((entry) => entry.channel)).toEqual(
      ROLE_CONFIGS.map((entry) => entry.channel),
    );
  });

  it("uses the approved Gmail plus-address convention for all 58 paired accounts", () => {
    for (const config of ROLE_CONFIGS) {
      const identity = TEST_ROLE_IDENTITIES.find((entry) => entry.role === config.role);
      expect(identity).toBeDefined();
      expect(identity?.humanEmail).toBe(`dropi.deliveries+human.${config.role}@gmail.com`);
      expect(identity?.aiEmail).toBe(`dropi.deliveries+ai.${config.role}@gmail.com`);
      expect(identity?.humanEmail).toBe(buildTestRoleEmail(config.role, "human"));
      expect(identity?.aiEmail).toBe(buildTestRoleEmail(config.role, "ai"));
      expect(identity?.humanOpenId).toBe(buildTestRoleOpenId(config.role, "human"));
      expect(identity?.aiOpenId).toBe(buildTestRoleOpenId(config.role, "ai"));
    }
  });

  it("keeps every email and deterministic openId unique", () => {
    const emails = TEST_ROLE_IDENTITIES.flatMap((entry) => [entry.humanEmail, entry.aiEmail]);
    const openIds = TEST_ROLE_IDENTITIES.flatMap((entry) => [entry.humanOpenId, entry.aiOpenId]);

    expect(new Set(emails).size).toBe(58);
    expect(new Set(openIds).size).toBe(58);
    expect(emails).not.toContain(DROPI_TEST_BASE_INBOX);
  });

  it("preserves the canonical total of 59 identities including the real base Super Admin", () => {
    expect(DROPI_TEST_BASE_INBOX).toBe("dropi.deliveries@gmail.com");
    expect(TEST_ROLE_IDENTITY_TOTALS).toEqual({
      roles: 29,
      human: 29,
      ai: 29,
      pairedAccounts: 58,
      identitiesIncludingBaseSuperAdmin: 59,
    });
  });
});
