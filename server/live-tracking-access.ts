import { eq } from "drizzle-orm";
import type { User } from "../drizzle/schema";
import { b2bDeliveries, orders, stores } from "../drizzle/schema";
import * as db from "./db";
import { sdk } from "./_core/sdk";

export type TrackingTarget = "order" | "b2b";
export type TrackingMode = "pilot" | "subscriber";

export type TrackingResource =
  | {
      target: "order";
      id: number;
      customerId: number;
      merchantId: number;
      assignedPilotId: number | null;
    }
  | {
      target: "b2b";
      id: number;
      storeOwnerId: number;
      assignedPilotId: number | null;
    };

export type TrackingAuthorization = {
  user: User;
  target: TrackingTarget;
  resourceId: number;
  mode: TrackingMode;
  pilotId: number | null;
  notificationRecipientId: number | null;
};

export class TrackingAccessError extends Error {
  constructor(
    public readonly code:
      | "AUTH_REQUIRED"
      | "AUTH_INVALID"
      | "ACCOUNT_INACTIVE"
      | "TARGET_NOT_FOUND"
      | "FORBIDDEN"
      | "PILOT_NOT_VERIFIED",
    message: string,
  ) {
    super(message);
    this.name = "TrackingAccessError";
  }
}

type AccessDependencies = {
  verifySession: typeof sdk.verifySession.bind;
  getUserByOpenId: typeof db.getUserByOpenId;
  loadResource: (target: TrackingTarget, resourceId: number) => Promise<TrackingResource | null>;
};

async function loadTrackingResource(target: TrackingTarget, resourceId: number): Promise<TrackingResource | null> {
  const database = await db.getDb();
  if (!database) return null;

  if (target === "order") {
    const rows = await database.select().from(orders).where(eq(orders.id, resourceId)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      target: "order",
      id: row.id,
      customerId: row.customerId,
      merchantId: row.merchantId,
      assignedPilotId: row.pilotId ?? null,
    };
  }

  const rows = await database.select().from(b2bDeliveries).where(eq(b2bDeliveries.id, resourceId)).limit(1);
  const row = rows[0];
  if (!row) return null;

  const storeRows = await database.select().from(stores).where(eq(stores.id, row.storeId)).limit(1);
  const store = storeRows[0];
  if (!store) return null;

  return {
    target: "b2b",
    id: row.id,
    storeOwnerId: store.ownerId,
    assignedPilotId: row.assignedPilotId ?? null,
  };
}

const DEFAULT_DEPENDENCIES: AccessDependencies = {
  verifySession: sdk.verifySession.bind(sdk),
  getUserByOpenId: db.getUserByOpenId,
  loadResource: loadTrackingResource,
};

function isAdmin(user: User): boolean {
  const candidate = user as User & { dropiRole?: string | null };
  return candidate.role === "admin" || candidate.dropiRole === "system_administrator";
}

function canSubscribe(user: User, resource: TrackingResource): boolean {
  if (isAdmin(user)) return true;

  if (resource.target === "order") {
    return (
      resource.customerId === user.id ||
      resource.merchantId === user.id ||
      resource.assignedPilotId === user.id
    );
  }

  return resource.storeOwnerId === user.id || resource.assignedPilotId === user.id;
}

function assertPilotAccess(user: User, resource: TrackingResource): void {
  const candidate = user as User & {
    dropiRole?: string | null;
    isVerified?: boolean | null;
  };

  if (candidate.dropiRole !== "delivery_partner") {
    throw new TrackingAccessError("FORBIDDEN", "Only delivery partners can broadcast live tracking.");
  }
  if (!candidate.isVerified) {
    throw new TrackingAccessError("PILOT_NOT_VERIFIED", "Delivery partner verification is required for live tracking.");
  }
  if (resource.assignedPilotId !== user.id) {
    throw new TrackingAccessError("FORBIDDEN", "This tracking target is not assigned to the authenticated pilot.");
  }
}

export async function authorizeTrackingSession(
  input: {
    token: string | null | undefined;
    target: TrackingTarget;
    resourceId: number;
    mode: TrackingMode;
  },
  dependencies: AccessDependencies = DEFAULT_DEPENDENCIES,
): Promise<TrackingAuthorization> {
  const token = input.token?.trim();
  if (!token) {
    throw new TrackingAccessError("AUTH_REQUIRED", "Authentication token is required for live tracking.");
  }

  const session = await dependencies.verifySession(token);
  if (!session) {
    throw new TrackingAccessError("AUTH_INVALID", "Live-tracking authentication failed.");
  }

  const user = await dependencies.getUserByOpenId(session.openId);
  if (!user) {
    throw new TrackingAccessError("AUTH_INVALID", "Authenticated user was not found.");
  }
  if (!user.isActive) {
    throw new TrackingAccessError("ACCOUNT_INACTIVE", "Inactive accounts cannot use live tracking.");
  }

  const resource = await dependencies.loadResource(input.target, input.resourceId);
  if (!resource) {
    throw new TrackingAccessError("TARGET_NOT_FOUND", "Tracking target was not found.");
  }

  if (input.mode === "pilot") {
    assertPilotAccess(user, resource);
  } else if (!canSubscribe(user, resource)) {
    throw new TrackingAccessError("FORBIDDEN", "This account is not allowed to subscribe to this tracking target.");
  }

  const notificationRecipientId =
    input.mode !== "pilot"
      ? null
      : resource.target === "order"
        ? resource.customerId
        : resource.storeOwnerId;

  return {
    user,
    target: input.target,
    resourceId: input.resourceId,
    mode: input.mode,
    pilotId: input.mode === "pilot" ? user.id : null,
    notificationRecipientId,
  };
}
