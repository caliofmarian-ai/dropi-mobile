import { describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";
import {
  authorizeTrackingSession,
  TrackingAccessError,
  type TrackingResource,
  type TrackingTarget,
} from "../server/live-tracking-access";

function user(overrides: Record<string, unknown> = {}): User {
  return {
    id: 10,
    openId: "dropi-user-10",
    name: "Test User",
    email: "user@example.com",
    loginMethod: "password",
    role: "user",
    dropiRole: "customer",
    channel: "C1",
    zone: "zone-0",
    isActive: true,
    isVerified: true,
    isAIAgent: false,
    agentMode: null,
    humanPairId: null,
    passwordHash: null,
    emailVerified: true,
    emailVerifyToken: null,
    emailVerifyExpires: null,
    resetToken: null,
    resetTokenExpiry: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    profilePhotoUrl: null,
    lastIp: null,
    lastDevice: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  } as User;
}

function dependencies(currentUser: User | undefined, resource: TrackingResource | null) {
  return {
    verifySession: vi.fn(async (token: string) =>
      token === "valid-token" ? { openId: currentUser?.openId || "missing", appId: "", name: "" } : null,
    ),
    getUserByOpenId: vi.fn(async () => currentUser),
    loadResource: vi.fn(async (_target: TrackingTarget, _resourceId: number) => resource),
  };
}

describe("live-tracking session authentication", () => {
  it("rejects a missing session token before resource lookup", async () => {
    const deps = dependencies(user(), {
      target: "order",
      id: 5,
      customerId: 10,
      merchantId: 20,
      assignedPilotId: 30,
    });

    await expect(
      authorizeTrackingSession({ token: null, target: "order", resourceId: 5, mode: "subscriber" }, deps),
    ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    expect(deps.loadResource).not.toHaveBeenCalled();
  });

  it("rejects an invalid signed session before resource lookup", async () => {
    const deps = dependencies(user(), {
      target: "order",
      id: 5,
      customerId: 10,
      merchantId: 20,
      assignedPilotId: 30,
    });

    await expect(
      authorizeTrackingSession({ token: "invalid-token", target: "order", resourceId: 5, mode: "subscriber" }, deps),
    ).rejects.toMatchObject({ code: "AUTH_INVALID" });
    expect(deps.loadResource).not.toHaveBeenCalled();
  });

  it("rejects an inactive authenticated account", async () => {
    const currentUser = user({ isActive: false });
    const deps = dependencies(currentUser, {
      target: "order",
      id: 5,
      customerId: currentUser.id,
      merchantId: 20,
      assignedPilotId: 30,
    });

    await expect(
      authorizeTrackingSession({ token: "valid-token", target: "order", resourceId: 5, mode: "subscriber" }, deps),
    ).rejects.toMatchObject({ code: "ACCOUNT_INACTIVE" });
    expect(deps.loadResource).not.toHaveBeenCalled();
  });
});

describe("live-tracking subscriber ownership", () => {
  it("allows the customer to subscribe to their marketplace order", async () => {
    const currentUser = user({ id: 10, dropiRole: "customer" });
    const resource: TrackingResource = {
      target: "order",
      id: 51,
      customerId: 10,
      merchantId: 20,
      assignedPilotId: 30,
    };
    const deps = dependencies(currentUser, resource);

    const result = await authorizeTrackingSession(
      { token: "valid-token", target: "order", resourceId: 51, mode: "subscriber" },
      deps,
    );

    expect(result.user.id).toBe(10);
    expect(result.pilotId).toBeNull();
    expect(deps.loadResource).toHaveBeenCalledWith("order", 51);
  });

  it("allows a B2B store owner to subscribe to their delivery", async () => {
    const currentUser = user({ id: 22, dropiRole: "merchant" });
    const resource: TrackingResource = {
      target: "b2b",
      id: 51,
      storeOwnerId: 22,
      assignedPilotId: 30,
    };
    const deps = dependencies(currentUser, resource);

    const result = await authorizeTrackingSession(
      { token: "valid-token", target: "b2b", resourceId: 51, mode: "subscriber" },
      deps,
    );

    expect(result.target).toBe("b2b");
    expect(deps.loadResource).toHaveBeenCalledWith("b2b", 51);
  });

  it("rejects an authenticated stranger from an order subscription", async () => {
    const currentUser = user({ id: 99 });
    const deps = dependencies(currentUser, {
      target: "order",
      id: 51,
      customerId: 10,
      merchantId: 20,
      assignedPilotId: 30,
    });

    await expect(
      authorizeTrackingSession({ token: "valid-token", target: "order", resourceId: 51, mode: "subscriber" }, deps),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an authenticated stranger from a B2B subscription", async () => {
    const currentUser = user({ id: 99 });
    const deps = dependencies(currentUser, {
      target: "b2b",
      id: 51,
      storeOwnerId: 22,
      assignedPilotId: 30,
    });

    await expect(
      authorizeTrackingSession({ token: "valid-token", target: "b2b", resourceId: 51, mode: "subscriber" }, deps),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps equal numeric order and B2B IDs in distinct authorization namespaces", async () => {
    const currentUser = user({ id: 10 });
    const orderResource: TrackingResource = {
      target: "order",
      id: 7,
      customerId: 10,
      merchantId: 20,
      assignedPilotId: 30,
    };
    const deps = dependencies(currentUser, orderResource);

    await authorizeTrackingSession(
      { token: "valid-token", target: "order", resourceId: 7, mode: "subscriber" },
      deps,
    );

    expect(deps.loadResource).toHaveBeenCalledWith("order", 7);
    expect(deps.loadResource).not.toHaveBeenCalledWith("b2b", 7);
  });
});

describe("live-tracking pilot authorization", () => {
  const resource: TrackingResource = {
    target: "b2b",
    id: 71,
    storeOwnerId: 44,
    assignedPilotId: 30,
  };

  it("rejects a verified non-delivery role from broadcasting", async () => {
    const currentUser = user({ id: 30, dropiRole: "customer", isVerified: true });
    const deps = dependencies(currentUser, resource);

    await expect(
      authorizeTrackingSession({ token: "valid-token", target: "b2b", resourceId: 71, mode: "pilot" }, deps),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an unverified delivery partner from broadcasting", async () => {
    const currentUser = user({ id: 30, dropiRole: "delivery_partner", isVerified: false });
    const deps = dependencies(currentUser, resource);

    await expect(
      authorizeTrackingSession({ token: "valid-token", target: "b2b", resourceId: 71, mode: "pilot" }, deps),
    ).rejects.toMatchObject({ code: "PILOT_NOT_VERIFIED" });
  });

  it("rejects a verified delivery partner assigned to a different mission", async () => {
    const currentUser = user({ id: 31, dropiRole: "delivery_partner", isVerified: true });
    const deps = dependencies(currentUser, resource);

    await expect(
      authorizeTrackingSession({ token: "valid-token", target: "b2b", resourceId: 71, mode: "pilot" }, deps),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("derives pilot identity and completion recipient from server-side ownership", async () => {
    const currentUser = user({ id: 30, dropiRole: "delivery_partner", isVerified: true });
    const deps = dependencies(currentUser, resource);

    const result = await authorizeTrackingSession(
      { token: "valid-token", target: "b2b", resourceId: 71, mode: "pilot" },
      deps,
    );

    expect(result.pilotId).toBe(30);
    expect(result.notificationRecipientId).toBe(44);
    expect(result.resourceId).toBe(71);
  });
});

describe("live-tracking error contract", () => {
  it("uses typed access errors for policy failures", () => {
    const error = new TrackingAccessError("FORBIDDEN", "denied");
    expect(error.name).toBe("TrackingAccessError");
    expect(error.code).toBe("FORBIDDEN");
  });
});
