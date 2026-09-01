import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TrpcContext } from "../server/_core/context";

const roleApplicationValuesMock = vi.hoisted(() => vi.fn());

const dbMock = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  setEmailVerifyToken: vi.fn(),
  createSession: vi.fn(),
  createAuditLog: vi.fn(),
  getUserById: vi.fn(),
  getDb: vi.fn(),
}));

const sdkMock = vi.hoisted(() => ({
  sdk: {
    createSessionToken: vi.fn(),
  },
}));

const mailMock = vi.hoisted(() => ({
  sendPlatformEmail: vi.fn(),
  maskEmail: vi.fn((email: string) => email),
}));

const auditMock = vi.hoisted(() => ({
  logProcedureCall: vi.fn().mockResolvedValue(undefined),
}));

const notificationMock = vi.hoisted(() => ({
  notifyOwner: vi.fn().mockResolvedValue(undefined),
}));

const ratingMock = vi.hoisted(() => ({
  getAutoSelectedPilot: vi.fn(),
  getEligiblePilotsForCOS: vi.fn(),
  validateManualAssignment: vi.fn(),
  recordAssignment: vi.fn(),
  ensurePilotProfile: vi.fn(),
  updatePilotAvailability: vi.fn(),
  recalculateRating: vi.fn(),
  onDeliveryCompleted: vi.fn(),
  onDeliveryFailed: vi.fn(),
  onCustomerReview: vi.fn(),
  onIncidentReported: vi.fn(),
}));

const webhookMock = vi.hoisted(() => ({
  triggerWebhooks: vi.fn(),
  buildWebhookPayload: vi.fn(() => ({})),
  getWebhookEvents: vi.fn(() => []),
}));

const ratingHooksMock = vi.hoisted(() => ({
  onB2bDeliveryCompleted: vi.fn(),
  onB2bDeliveryFailed: vi.fn(),
}));

vi.mock("../server/db", () => dbMock);
vi.mock("../server/_core/sdk", () => sdkMock);
vi.mock("../server/_core/mail", () => mailMock);
vi.mock("../server/audit-middleware", () => auditMock);
vi.mock("../server/_core/notification", () => notificationMock);
vi.mock("../server/pilot-rating-engine", () => ratingMock);
vi.mock("../server/webhook-trigger", () => webhookMock);
vi.mock("../server/pilot-rating-hooks", () => ratingHooksMock);
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "test-password-hash"),
    compare: vi.fn(async () => true),
  },
}));

const { dropiAuthRouter } = await import("../server/auth-router");
const { pilotSelectionRouter } = await import("../server/pilot-selection-router");
const { b2bDeliveryRouter } = await import("../server/b2b-router");

function publicContext(): TrpcContext {
  return {
    user: null,
    req: { headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function userContext(user: Record<string, unknown>): TrpcContext {
  return {
    user: user as TrpcContext["user"],
    req: { headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function deliverySelectDb(delivery: Record<string, unknown>) {
  const limit = vi.fn().mockResolvedValue([delivery]);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const update = vi.fn();
  return { select, update };
}

describe("Sprint 6A registration gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getUserByEmail.mockResolvedValue(undefined);
    dbMock.createUser.mockResolvedValue({ id: 41, openId: "dropi-open-id-41" });
    dbMock.setEmailVerifyToken.mockResolvedValue(undefined);
    dbMock.createSession.mockResolvedValue(undefined);
    dbMock.createAuditLog.mockResolvedValue(undefined);
    dbMock.getUserById.mockResolvedValue({
      id: 41,
      email: "pilot@example.com",
      dropiRole: "delivery_partner",
      channel: "C1",
      isActive: true,
      isVerified: false,
    });
    sdkMock.sdk.createSessionToken.mockResolvedValue("session-token");
    mailMock.sendPlatformEmail.mockResolvedValue(true);
    roleApplicationValuesMock.mockResolvedValue(undefined);
    dbMock.getDb.mockResolvedValue({
      insert: vi.fn(() => ({ values: roleApplicationValuesMock })),
    });
  });

  it("creates delivery partners as active but unverified and reports verificationRequired", async () => {
    const caller = dropiAuthRouter.createCaller(publicContext());

    const result = await caller.register({
      email: "pilot@example.com",
      password: "StrongPass1",
      name: "Pilot Test",
      dropiRole: "delivery_partner",
      channel: "C1",
    });

    expect(dbMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        dropiRole: "delivery_partner",
        channel: "C1",
        isActive: true,
        isVerified: false,
      }),
    );
    expect(result.verificationRequired).toBe(true);
    expect(result.accountPendingApproval).toBe(false);
  });

  it("creates operational roles inactive and materializes a pending admin approval application", async () => {
    dbMock.getUserById.mockResolvedValue({
      id: 41,
      email: "ops@example.com",
      dropiRole: "operations_manager",
      channel: "C2",
      isActive: false,
      isVerified: true,
    });

    const caller = dropiAuthRouter.createCaller(publicContext());
    const result = await caller.register({
      email: "ops@example.com",
      password: "StrongPass1",
      name: "Operations Test",
      dropiRole: "operations_manager",
      channel: "C2",
    });

    expect(dbMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        dropiRole: "operations_manager",
        channel: "C2",
        isActive: false,
        isVerified: true,
      }),
    );
    expect(roleApplicationValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 41,
        requestedRole: "operations_manager",
        requestedChannel: "C2",
        status: "pending",
      }),
    );
    expect(result.token).toBeNull();
    expect(result.accountPendingApproval).toBe(true);
  });
});

describe("Sprint 6A mission authorization gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ratingMock.ensurePilotProfile.mockResolvedValue(1);
    ratingMock.updatePilotAvailability.mockResolvedValue(true);
  });

  it("blocks an unverified delivery partner from going available before any pilot mutation", async () => {
    const caller = pilotSelectionRouter.createCaller(
      userContext({ id: 7, dropiRole: "delivery_partner", channel: "C1", isActive: true, isVerified: false }),
    );

    await expect(caller.updateAvailability({ isAvailable: true })).rejects.toThrow(/not yet verified/i);
    expect(ratingMock.ensurePilotProfile).not.toHaveBeenCalled();
    expect(ratingMock.updatePilotAvailability).not.toHaveBeenCalled();
  });

  it("blocks a verified non-delivery role from changing pilot availability", async () => {
    const caller = pilotSelectionRouter.createCaller(
      userContext({ id: 8, dropiRole: "customer", channel: "C1", isActive: true, isVerified: true }),
    );

    await expect(caller.updateAvailability({ isAvailable: true })).rejects.toThrow(/only delivery partners/i);
    expect(ratingMock.updatePilotAvailability).not.toHaveBeenCalled();
  });

  it("blocks a verified non-delivery role from writing pilot GPS position before DB access", async () => {
    const caller = pilotSelectionRouter.createCaller(
      userContext({ id: 8, dropiRole: "merchant", channel: "C1", isActive: true, isVerified: true }),
    );

    await expect(caller.updatePosition({ lat: 53.35, lng: -6.26 })).rejects.toThrow(/only delivery partners/i);
    expect(dbMock.getDb).not.toHaveBeenCalled();
  });

  it("blocks an unverified delivery partner from pilotUpdateStatus before DB access", async () => {
    const caller = b2bDeliveryRouter.createCaller(
      userContext({ id: 9, dropiRole: "delivery_partner", channel: "C1", isActive: true, isVerified: false }),
    );

    await expect(
      caller.pilotUpdateStatus({ deliveryId: 100, newStatus: "assigned" }),
    ).rejects.toThrow(/not yet verified/i);
    expect(dbMock.getDb).not.toHaveBeenCalled();
  });

  it("blocks a verified non-delivery role from pilotUpdateStatus before DB access", async () => {
    const caller = b2bDeliveryRouter.createCaller(
      userContext({ id: 10, dropiRole: "customer", channel: "C1", isActive: true, isVerified: true }),
    );

    await expect(
      caller.pilotUpdateStatus({ deliveryId: 100, newStatus: "assigned" }),
    ).rejects.toThrow(/only delivery partners/i);
    expect(dbMock.getDb).not.toHaveBeenCalled();
  });

  it("prevents one verified pilot from mutating a delivery already assigned to another pilot", async () => {
    const fakeDb = deliverySelectDb({
      id: 100,
      status: "assigned",
      assignedPilotId: 999,
      storeId: 3,
      preferredMode: "any",
    });
    dbMock.getDb.mockResolvedValue(fakeDb);

    const caller = b2bDeliveryRouter.createCaller(
      userContext({ id: 11, dropiRole: "delivery_partner", channel: "C1", isActive: true, isVerified: true }),
    );

    await expect(
      caller.pilotUpdateStatus({ deliveryId: 100, newStatus: "pickup_enroute" }),
    ).rejects.toThrow(/assigned to another pilot/i);
    expect(fakeDb.update).not.toHaveBeenCalled();
  });
});

describe("Sprint 6A approval UI and backend contract", () => {
  it("keeps the Admin Approvals screen wired to list and review both verification and role applications", () => {
    const source = readFileSync(resolve(process.cwd(), "app/admin/approvals.tsx"), "utf8");

    expect(source).toContain('apiCall("verification.listPending"');
    expect(source).toContain('apiCall("verification.review"');
    expect(source).toContain('apiCall("roleApplications.listAll"');
    expect(source).toContain('apiCall("roleApplications.review"');
    expect(source).toContain("rejectionReason");
  });

  it("keeps the delivery-partner dashboard explicit about the unverified state", () => {
    const source = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

    expect(source).toContain("const isUnverified = user && !(user as any).isVerified");
    expect(source).toContain("Verification Required");
  });

  it("keeps role approval admin-only and activates/verifies the approved operational account", () => {
    const source = readFileSync(resolve(process.cwd(), "server/verification-router.ts"), "utf8");

    expect(source).toContain("review: adminProcedure");
    expect(source).toContain("dropiRole: application.requestedRole");
    expect(source).toContain("channel: application.requestedChannel");
    expect(source).toContain("isActive: true");
    expect(source).toContain("isVerified: true");
  });
});
