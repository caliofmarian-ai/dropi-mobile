import { describe, expect, it, vi } from "vitest";

const auditMock = vi.hoisted(() => ({
  logProcedureCall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/audit-middleware", () => auditMock);

const {
  adminProcedure,
  auditInvestigatorProcedure,
  protectedProcedure,
  rbacProcedure,
  router,
} = await import("../server/_core/trpc");

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    openId: "rbac-user",
    name: "RBAC User",
    email: "rbac@example.com",
    loginMethod: "email",
    role: "user",
    dropiRole: "customer",
    channel: "C1",
    zone: null,
    isActive: true,
    isVerified: true,
    passwordHash: null,
    resetToken: null,
    resetTokenExpiry: null,
    isAIAgent: false,
    agentMode: null,
    humanPairId: null,
    emailVerified: true,
    emailVerifyToken: null,
    emailVerifyExpires: null,
    lastIp: null,
    lastDevice: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    profilePhotoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  } as any;
}

function callerFor(identity: any) {
  const testRouter = router({
    protected: protectedProcedure.query(() => "protected-ok"),
    pilot: rbacProcedure({
      roles: ["delivery_partner"],
      channels: ["C1"],
      permissions: ["execute_flight"],
    }).query(() => "pilot-ok"),
    admin: adminProcedure.query(() => "admin-ok"),
    audit: auditInvestigatorProcedure.query(() => "audit-ok"),
  });

  return testRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: identity,
    session: null,
    sessionToken: null,
  });
}

describe("tRPC canonical RBAC middleware", () => {
  it("rejects unauthenticated callers before protected execution", async () => {
    await expect(callerFor(null).protected()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("allows a canonical active role on its assigned channel", async () => {
    await expect(callerFor(user()).protected()).resolves.toBe("protected-ok");
  });

  it("fails closed for invalid role/channel assignments on every protected route", async () => {
    await expect(
      callerFor(user({ channel: "C2" })).protected(),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "DROPi role and channel assignment are inconsistent.",
    });
  });

  it("fails closed for inactive identities", async () => {
    await expect(
      callerFor(user({ isActive: false })).protected(),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Inactive accounts cannot access protected DROPi routes.",
    });
  });

  it("enforces explicit canonical role, channel, and permission constraints", async () => {
    const pilot = user({
      dropiRole: "delivery_partner",
      channel: "C1",
      isAIAgent: true,
    });
    await expect(callerFor(pilot).pilot()).resolves.toBe("pilot-ok");

    await expect(callerFor(user()).pilot()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("uses the same graph for admin and audit investigator procedures", async () => {
    const systemAdmin = user({
      dropiRole: "system_administrator",
      channel: "ADMIN",
    });
    const auditManager = user({
      dropiRole: "audit_manager",
      channel: "ADMIN",
    });

    await expect(callerFor(systemAdmin).admin()).resolves.toBe("admin-ok");
    await expect(callerFor(auditManager).audit()).resolves.toBe("audit-ok");
    await expect(callerFor(auditManager).admin()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("keeps the legacy platform owner flag as a canonical system-admin override", async () => {
    const owner = user({ role: "admin", dropiRole: "customer", channel: "C1" });
    await expect(callerFor(owner).admin()).resolves.toBe("admin-ok");
    await expect(callerFor(owner).audit()).resolves.toBe("audit-ok");
  });
});
