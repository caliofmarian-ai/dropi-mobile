import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, ne, notInArray, or, sql } from "drizzle-orm";
import {
  apiKeys,
  auditLogs,
  b2bDeliveries,
  deliveries,
  inAppNotifications,
  notificationPreferences,
  orders,
  pilotProfiles,
  pilotRatingHistory,
  privacyConsents,
  privacyRightsRequests,
  productReviews,
  products,
  pushTokens,
  roleApplications,
  sessions,
  stores,
  users,
  verifications,
  webhookEndpoints,
} from "../drizzle/schema";
import { p2pCommunityListings, p2pParcelRequests } from "../drizzle/p2p-schema";
import {
  PRIVACY_ERASURE_RETENTION_NOTICE,
  PRIVACY_EXPORT_SCHEMA_VERSION,
  TERMINAL_B2B_STATUSES,
  TERMINAL_DELIVERY_STATUSES,
  TERMINAL_ORDER_STATUSES,
  omitSecretsForSubjectExport,
  privacyErasureIsAllowed,
  redactAuditDetailsForErasure,
  type PrivacyErasureBlockers,
} from "../shared/privacy-rights-policy";
import { getDb } from "./db";

function dateStamp(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function countRows(query: Promise<Array<{ count: number }>>) {
  const rows = await query;
  return Number(rows[0]?.count || 0);
}

export async function getPrivacyErasurePreview(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const ownedStores = await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerId, userId));
  const ownedStoreIds = ownedStores.map((store) => store.id);

  const activeOrdersPromise = countRows(db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(
      or(eq(orders.customerId, userId), eq(orders.merchantId, userId), eq(orders.pilotId, userId)),
      notInArray(orders.status, [...TERMINAL_ORDER_STATUSES]),
    )) as any);

  const activeDeliveriesPromise = countRows(db.select({ count: sql<number>`count(*)` })
    .from(deliveries)
    .where(and(eq(deliveries.pilotId, userId), notInArray(deliveries.status, [...TERMINAL_DELIVERY_STATUSES]))) as any);

  const partnerB2bCondition = ownedStoreIds.length
    ? inArray(b2bDeliveries.storeId, ownedStoreIds)
    : sql`false`;
  const activeB2bPromise = countRows(db.select({ count: sql<number>`count(*)` })
    .from(b2bDeliveries)
    .where(and(
      or(partnerB2bCondition, eq(b2bDeliveries.assignedPilotId, userId)),
      notInArray(b2bDeliveries.status, [...TERMINAL_B2B_STATUSES]),
    )) as any);

  const activeP2pPromise = countRows(db.select({ count: sql<number>`count(*)` })
    .from(p2pParcelRequests)
    .where(and(eq(p2pParcelRequests.ownerId, userId), eq(p2pParcelRequests.status, "initiated"))) as any);

  const [activeOrders, activeDeliveries, activeB2bDeliveries, activeP2pParcels] = await Promise.all([
    activeOrdersPromise,
    activeDeliveriesPromise,
    activeB2bPromise,
    activeP2pPromise,
  ]);

  const blockers: PrivacyErasureBlockers = {
    activeOrders,
    activeDeliveries,
    activeB2bDeliveries,
    activeP2pParcels,
  };

  return {
    allowed: privacyErasureIsAllowed(blockers),
    blockers,
    ownedStoresToClose: ownedStoreIds.length,
    retentionNotice: PRIVACY_ERASURE_RETENTION_NOTICE,
  };
}

export async function buildPrivacySubjectExport(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");

  const ownedStores = await db.select().from(stores).where(eq(stores.ownerId, userId));
  const ownedStoreIds = ownedStores.map((store) => store.id);

  const [
    sessionRows,
    consentRows,
    customerOrders,
    merchantOrders,
    pilotOrders,
    pilotDeliveries,
    verificationRows,
    roleApplicationRows,
    reviewRows,
    pilotProfileRows,
    pilotRatingRows,
    pushTokenRows,
    notificationRows,
    notificationPreferenceRows,
    p2pListingRows,
    p2pParcelRows,
    auditRows,
    b2bRows,
  ] = await Promise.all([
    db.select({
      id: sessions.id,
      deviceInfo: sessions.deviceInfo,
      ipAddress: sessions.ipAddress,
      isPhantom: sessions.isPhantom,
      phantomAdminId: sessions.phantomAdminId,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt,
      lastActiveAt: sessions.lastActiveAt,
    }).from(sessions).where(eq(sessions.userId, userId)),
    db.select().from(privacyConsents).where(eq(privacyConsents.userId, userId)),
    db.select().from(orders).where(eq(orders.customerId, userId)),
    db.select({
      id: orders.id,
      orderUid: orders.orderUid,
      status: orders.status,
      totalAmount: orders.totalAmount,
      zone: orders.zone,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    }).from(orders).where(eq(orders.merchantId, userId)),
    db.select({
      id: orders.id,
      orderUid: orders.orderUid,
      status: orders.status,
      zone: orders.zone,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    }).from(orders).where(eq(orders.pilotId, userId)),
    db.select({
      id: deliveries.id,
      deliveryUid: deliveries.deliveryUid,
      orderId: deliveries.orderId,
      status: deliveries.status,
      currentLat: deliveries.currentLat,
      currentLng: deliveries.currentLng,
      fallbackReason: deliveries.fallbackReason,
      stopReason: deliveries.stopReason,
      createdAt: deliveries.createdAt,
      updatedAt: deliveries.updatedAt,
    }).from(deliveries).where(eq(deliveries.pilotId, userId)),
    db.select().from(verifications).where(eq(verifications.userId, userId)),
    db.select().from(roleApplications).where(eq(roleApplications.userId, userId)),
    db.select().from(productReviews).where(eq(productReviews.userId, userId)),
    db.select().from(pilotProfiles).where(eq(pilotProfiles.userId, userId)),
    db.select().from(pilotRatingHistory).where(eq(pilotRatingHistory.userId, userId)),
    db.select({
      id: pushTokens.id,
      platform: pushTokens.platform,
      isActive: pushTokens.isActive,
      createdAt: pushTokens.createdAt,
      updatedAt: pushTokens.updatedAt,
    }).from(pushTokens).where(eq(pushTokens.userId, userId)),
    db.select().from(inAppNotifications).where(eq(inAppNotifications.userId, userId)),
    db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)),
    db.select().from(p2pCommunityListings).where(eq(p2pCommunityListings.ownerId, userId)),
    db.select().from(p2pParcelRequests).where(eq(p2pParcelRequests.ownerId, userId)),
    db.select({
      id: auditLogs.id,
      userRole: auditLogs.userRole,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      severity: auditLogs.severity,
      channel: auditLogs.channel,
      isAIAction: auditLogs.isAIAction,
      isPhantomMode: auditLogs.isPhantomMode,
      createdAt: auditLogs.createdAt,
    }).from(auditLogs).where(eq(auditLogs.userId, userId)).limit(5000),
    ownedStoreIds.length
      ? db.select({
          id: b2bDeliveries.id,
          storeId: b2bDeliveries.storeId,
          externalOrderId: b2bDeliveries.externalOrderId,
          trackingCode: b2bDeliveries.trackingCode,
          status: b2bDeliveries.status,
          packageWeight: b2bDeliveries.packageWeight,
          preferredMode: b2bDeliveries.preferredMode,
          urgency: b2bDeliveries.urgency,
          deliveryMode: b2bDeliveries.deliveryMode,
          quotedPrice: b2bDeliveries.quotedPrice,
          finalPrice: b2bDeliveries.finalPrice,
          currency: b2bDeliveries.currency,
          createdAt: b2bDeliveries.createdAt,
          updatedAt: b2bDeliveries.updatedAt,
        }).from(b2bDeliveries).where(inArray(b2bDeliveries.storeId, ownedStoreIds))
      : Promise.resolve([]),
  ]);

  const payload = {
    schema: "DROPi_PRIVACY_SUBJECT_EXPORT",
    schemaVersion: PRIVACY_EXPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    subjectId: userId,
    scopeNotice: "The export includes data directly attributable to this account. Authentication secrets and third-party contact data are excluded or minimized.",
    identity: omitSecretsForSubjectExport(user as unknown as Record<string, unknown>),
    authenticationSessions: sessionRows,
    privacyConsents: consentRows,
    marketplace: {
      customerOrders,
      merchantOrderReferences: merchantOrders,
      pilotOrderReferences: pilotOrders,
      pilotDeliveries,
      ownedStores: ownedStores.map((store) => omitSecretsForSubjectExport(store as unknown as Record<string, unknown>)),
      authoredReviews: reviewRows,
    },
    verification: {
      documents: verificationRows,
      roleApplications: roleApplicationRows,
      pilotProfiles: pilotProfileRows,
      pilotRatingHistory: pilotRatingRows,
    },
    notifications: {
      registeredDevices: pushTokenRows,
      inApp: notificationRows,
      preferences: notificationPreferenceRows,
    },
    p2p: {
      communityListings: p2pListingRows,
      privateParcelRequests: p2pParcelRows,
    },
    b2bOwnedStoreOperationalReferences: b2bRows,
    auditEvidence: {
      rows: auditRows,
      truncated: auditRows.length >= 5000,
      detailsExcluded: true,
    },
  };

  await db.insert(privacyRightsRequests).values({
    userId,
    requestType: "portability",
    status: "completed",
    resultSummary: {
      schemaVersion: PRIVACY_EXPORT_SCHEMA_VERSION,
      sections: Object.keys(payload).length,
      auditRows: auditRows.length,
    },
    completedAt: new Date(),
  });

  const generatedAt = new Date();
  return {
    filename: `dropi-personal-data-${userId}-${dateStamp(generatedAt)}.json`,
    contentType: "application/json;charset=utf-8",
    generatedAt: generatedAt.toISOString(),
    content: JSON.stringify(payload, null, 2),
  };
}

export async function executePrivacyErasure(input: {
  userId: number;
  currentPassword?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user) throw new Error("User not found");
  if (!user.isActive) throw new Error("Account is already inactive");

  if (user.passwordHash) {
    if (!input.currentPassword) throw new Error("Current password is required to erase this account");
    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new Error("Current password is incorrect");
  }

  const preview = await getPrivacyErasurePreview(input.userId);
  if (!preview.allowed) {
    await db.insert(privacyRightsRequests).values({
      userId: input.userId,
      requestType: "erasure",
      status: "blocked",
      blockerSummary: preview.blockers,
      completedAt: new Date(),
    });
    return { success: false as const, ...preview };
  }

  const customerOrderIds = (await db.select({ id: orders.id }).from(orders).where(eq(orders.customerId, input.userId))).map((row) => row.id);
  const merchantOrderIds = (await db.select({ id: orders.id }).from(orders).where(eq(orders.merchantId, input.userId))).map((row) => row.id);
  const ownedStores = await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerId, input.userId));
  const ownedStoreIds = ownedStores.map((row) => row.id);
  const ownAuditRows = await db.select({ id: auditLogs.id, details: auditLogs.details }).from(auditLogs).where(eq(auditLogs.userId, input.userId));
  const tombstoneOpenId = `erased-${input.userId}-${randomBytes(12).toString("hex")}`.slice(0, 64);

  await db.transaction(async (tx) => {
    await tx.delete(sessions).where(eq(sessions.userId, input.userId));
    await tx.delete(verifications).where(eq(verifications.userId, input.userId));
    await tx.delete(pushTokens).where(eq(pushTokens.userId, input.userId));
    await tx.delete(inAppNotifications).where(eq(inAppNotifications.userId, input.userId));
    await tx.delete(notificationPreferences).where(eq(notificationPreferences.userId, input.userId));
    await tx.delete(p2pCommunityListings).where(eq(p2pCommunityListings.ownerId, input.userId));
    await tx.delete(p2pParcelRequests).where(eq(p2pParcelRequests.ownerId, input.userId));

    await tx.update(roleApplications).set({
      motivation: null,
      qualifications: null,
      documentUrls: null,
      rejectionReason: null,
    }).where(eq(roleApplications.userId, input.userId));

    await tx.update(productReviews).set({ comment: null }).where(eq(productReviews.userId, input.userId));

    await tx.update(pilotProfiles).set({
      isAvailable: false,
      currentLat: null,
      currentLng: null,
      lastPositionUpdate: null,
      vehicleTypes: null,
      operatingZones: null,
    }).where(eq(pilotProfiles.userId, input.userId));

    if (customerOrderIds.length) {
      await tx.update(orders).set({ deliveryAddress: null, cancellationReason: null }).where(inArray(orders.id, customerOrderIds));
      await tx.update(deliveries).set({ deliveryLat: null, deliveryLng: null }).where(inArray(deliveries.orderId, customerOrderIds));
    }
    if (merchantOrderIds.length) {
      await tx.update(orders).set({ pickupAddress: null, cancellationReason: null }).where(inArray(orders.id, merchantOrderIds));
      await tx.update(deliveries).set({ pickupLat: null, pickupLng: null }).where(inArray(deliveries.orderId, merchantOrderIds));
    }
    await tx.update(deliveries).set({ currentLat: null, currentLng: null }).where(eq(deliveries.pilotId, input.userId));

    if (ownedStoreIds.length) {
      await tx.delete(apiKeys).where(inArray(apiKeys.storeId, ownedStoreIds));
      await tx.delete(webhookEndpoints).where(inArray(webhookEndpoints.storeId, ownedStoreIds));
      await tx.update(products).set({ isActive: false, status: "suspended" }).where(inArray(products.storeId, ownedStoreIds));
      await tx.update(stores).set({
        status: "closed",
        contactPhone: null,
        physicalAddress: null,
        externalUrl: null,
        apiKey: null,
        webhookUrl: null,
      }).where(inArray(stores.id, ownedStoreIds));
    }

    for (const row of ownAuditRows) {
      await tx.update(auditLogs).set({
        details: redactAuditDetailsForErasure(row.details),
        latitude: null,
        longitude: null,
        ipAddress: null,
        userAgent: null,
        sessionId: null,
      }).where(eq(auditLogs.id, row.id));
    }

    await tx.update(users).set({
      openId: tombstoneOpenId,
      name: null,
      email: null,
      loginMethod: "erased",
      zone: null,
      isActive: false,
      isVerified: false,
      passwordHash: null,
      resetToken: null,
      resetTokenExpiry: null,
      emailVerified: false,
      emailVerifyToken: null,
      emailVerifyExpires: null,
      lastIp: null,
      lastDevice: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      profilePhotoUrl: null,
    }).where(eq(users.id, input.userId));

    await tx.insert(privacyRightsRequests).values({
      userId: input.userId,
      requestType: "erasure",
      status: "completed",
      resultSummary: {
        pseudonymizedUserId: input.userId,
        storesClosed: ownedStoreIds.length,
        auditRowsPseudonymized: ownAuditRows.length,
        retainedEvidence: ["orders", "delivery lifecycle", "audit evidence", "privacy consent history", "pilot rating history"],
      },
      completedAt: new Date(),
    });
  });

  return {
    success: true as const,
    subjectId: input.userId,
    accountActive: false,
    retainedEvidenceIsPseudonymized: true,
    retentionNotice: PRIVACY_ERASURE_RETENTION_NOTICE,
  };
}
