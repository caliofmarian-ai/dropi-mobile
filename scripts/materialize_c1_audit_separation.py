from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {text.count(old)}")
    return text.replace(old, new, 1)


# ---------------------------------------------------------------------------
# server/db.ts — one explicit channel per audit read/write, server-side phantom filter
# ---------------------------------------------------------------------------
path = "server/db.ts"
text = read(path)
text = replace_once(
    text,
    'import { InsertUser, users, sessions, auditLogs, InsertAuditLog, InsertSession } from "../drizzle/schema";\nimport { ENV } from "./_core/env";',
    'import { InsertUser, users, sessions, auditLogs, InsertAuditLog, InsertSession } from "../drizzle/schema";\nimport { type AuditChannel } from "./audit-policy";\nimport { ENV } from "./_core/env";',
    "db audit channel import",
)
text = replace_once(
    text,
    "export async function createAuditLog(data: InsertAuditLog) {",
    "export async function createAuditLog(data: InsertAuditLog & { channel: AuditChannel }) {",
    "strict createAuditLog signature",
)
text = replace_once(
    text,
    '''export async function listAuditLogs(opts: {
  channel?: string;
  userId?: number;
  action?: string;
  severity?: string;
  from?: Date;''',
    '''export async function listAuditLogs(opts: {
  channel: AuditChannel;
  userId?: number;
  action?: string;
  severity?: string;
  phantomMode?: boolean;
  from?: Date;''',
    "listAuditLogs signature",
)
text = replace_once(
    text,
    '''  const conditions = [];
  if (opts.channel) conditions.push(eq(auditLogs.channel, opts.channel as any));
  if (opts.userId) conditions.push(eq(auditLogs.userId, opts.userId));
  if (opts.action) conditions.push(like(auditLogs.action, `%${opts.action}%`));
  if (opts.severity) conditions.push(eq(auditLogs.severity, opts.severity as any));''',
    '''  const conditions = [eq(auditLogs.channel, opts.channel)];
  if (opts.userId) conditions.push(eq(auditLogs.userId, opts.userId));
  if (opts.action) conditions.push(like(auditLogs.action, `%${opts.action}%`));
  if (opts.severity) conditions.push(eq(auditLogs.severity, opts.severity as any));
  if (opts.phantomMode !== undefined) conditions.push(eq(auditLogs.isPhantomMode, opts.phantomMode));''',
    "listAuditLogs channel condition",
)
text = replace_once(
    text,
    '''export async function getAuditLogsByUser(userId: number, page = 1, limit = 50) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  const offset = (page - 1) * limit;
  const result = await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).limit(limit).offset(offset).orderBy(desc(auditLogs.createdAt));
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(eq(auditLogs.userId, userId));
  return { logs: result, total: countResult[0]?.count || 0 };
}

export async function getAuditLogsByResource(resourceType: string, resourceId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(and(eq(auditLogs.resourceType, resourceType), eq(auditLogs.resourceId, resourceId))).orderBy(desc(auditLogs.createdAt));
}

export async function getAuditStats(opts: { channel?: string; from?: Date; to?: Date }) {
  const db = await getDb();
  if (!db) return { total: 0, byAction: [], bySeverity: [] };
  const conditions = [];
  if (opts.channel) conditions.push(eq(auditLogs.channel, opts.channel as any));''',
    '''export async function getAuditLogsByUser(channel: AuditChannel, userId: number, page = 1, limit = 50) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = and(eq(auditLogs.channel, channel), eq(auditLogs.userId, userId));
  const result = await db.select().from(auditLogs).where(where).limit(limit).offset(offset).orderBy(desc(auditLogs.createdAt));
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where);
  return { logs: result, total: countResult[0]?.count || 0 };
}

export async function getAuditLogsByResource(channel: AuditChannel, resourceType: string, resourceId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(and(
    eq(auditLogs.channel, channel),
    eq(auditLogs.resourceType, resourceType),
    eq(auditLogs.resourceId, resourceId),
  )).orderBy(desc(auditLogs.createdAt));
}

export async function getAuditStats(opts: { channel: AuditChannel; from?: Date; to?: Date }) {
  const db = await getDb();
  if (!db) return { total: 0, byAction: [], bySeverity: [] };
  const conditions = [eq(auditLogs.channel, opts.channel)];''',
    "channel-scoped audit detail and stats",
)
write(path, text)


# ---------------------------------------------------------------------------
# server/_core/sdk.ts — phantom JWT has explicit admin claim + DB session binding
# ---------------------------------------------------------------------------
path = "server/_core/sdk.ts"
text = read(path)
text = replace_once(
    text,
    '''export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};''',
    '''export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
  phantomAdminId?: number;
};''',
    "SessionPayload phantom claim",
)
text = replace_once(
    text,
    '''    options: { expiresInMs?: number; name?: string } = {},
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },''',
    '''    options: { expiresInMs?: number; name?: string; phantomAdminId?: number } = {},
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
        phantomAdminId: options.phantomAdminId,
      },''',
    "createSessionToken phantom option",
)
text = replace_once(
    text,
    '''    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })''',
    '''    const claims: Record<string, unknown> = {
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    };
    if (payload.phantomAdminId !== undefined) claims.phantomAdminId = payload.phantomAdminId;

    return new SignJWT(claims)''',
    "signSession phantom claim",
)
text = replace_once(
    text,
    '''  ): Promise<{ openId: string; appId: string; name: string } | null> {''',
    '''  ): Promise<{ openId: string; appId: string; name: string; phantomAdminId?: number } | null> {''',
    "verifySession return type",
)
text = replace_once(
    text,
    '''      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId)) {''',
    '''      const { openId, appId, name, phantomAdminId } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId)) {''',
    "verifySession phantom destructure",
)
text = replace_once(
    text,
    '''      return {
        openId,
        appId: typeof appId === "string" ? appId : "",
        name: typeof name === "string" ? name : "",
      };''',
    '''      if (phantomAdminId !== undefined && (!Number.isSafeInteger(phantomAdminId) || Number(phantomAdminId) <= 0)) {
        console.warn("[Auth] Session payload has invalid phantom administrator identity");
        return null;
      }

      return {
        openId,
        appId: typeof appId === "string" ? appId : "",
        name: typeof name === "string" ? name : "",
        ...(phantomAdminId !== undefined ? { phantomAdminId: Number(phantomAdminId) } : {}),
      };''',
    "verifySession phantom validation",
)
text = replace_once(
    text,
    '''    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {''',
    '''    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    let persistedPhantomSession: Awaited<ReturnType<typeof db.getSessionByToken>> | undefined;
    if (session.phantomAdminId !== undefined) {
      persistedPhantomSession = await db.getSessionByToken(sessionCookie ?? "");
      const validPersistedPhantom =
        persistedPhantomSession?.isPhantom === true &&
        persistedPhantomSession.phantomAdminId === session.phantomAdminId &&
        new Date(persistedPhantomSession.expiresAt).getTime() > Date.now();
      if (!validPersistedPhantom) {
        throw ForbiddenError("Invalid or expired phantom session");
      }
    }

    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {''',
    "authenticate phantom binding",
)
text = replace_once(
    text,
    '''    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({''',
    '''    if (!user) {
      throw ForbiddenError("User not found");
    }
    if (persistedPhantomSession && persistedPhantomSession.userId !== user.id) {
      throw ForbiddenError("Phantom session target does not match authenticated user");
    }

    await db.upsertUser({''',
    "phantom target binding",
)
write(path, text)


# ---------------------------------------------------------------------------
# server/auth-router.ts — restore real admin on phantom exit + strict audit queries
# ---------------------------------------------------------------------------
path = "server/auth-router.ts"
text = read(path)
text = replace_once(
    text,
    'import { createAuditLog } from "./db";',
    'import { createAuditLog } from "./db";\nimport { requirePhantomAdminId } from "./audit-policy";',
    "auth phantom policy import",
)
text = replace_once(
    text,
    '''    const token = await sdk.createSessionToken(targetUser.openId, { name: `[PHANTOM] ${targetUser.name}` });''',
    '''    const token = await sdk.createSessionToken(targetUser.openId, {
      name: `[PHANTOM] ${targetUser.name}`,
      expiresInMs: 2 * 60 * 60 * 1000,
      phantomAdminId: user.id,
    });''',
    "phantom token lifetime and identity",
)
old_exit = '''  exitPhantom: adminProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user!;
    // Audit
    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "admin.phantom_exit",
      resourceType: "user",
      resourceId: String(user.id),
      severity: "critical",
      channel: "ADMIN",
      isAIAction: user.isAIAgent,
      isPhantomMode: true,
      phantomAdminId: user.id,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
    });

    // Return admin's own token
    const token = await sdk.createSessionToken(user.openId, { name: user.name || "" });
    return { token, user };
  }),'''
new_exit = '''  exitPhantom: protectedProcedure.mutation(async ({ ctx }) => {
    let phantomAdminId: number;
    try {
      phantomAdminId = requirePhantomAdminId(ctx.session);
    } catch {
      throw new TRPCError({ code: "FORBIDDEN", message: "Current session is not a valid phantom session" });
    }
    if (!ctx.sessionToken) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Phantom session token is unavailable" });
    }

    const targetUser = ctx.user!;
    const adminUser = await db.getUserById(phantomAdminId);
    const isAdmin = adminUser?.role === "admin" || adminUser?.dropiRole === "system_administrator";
    if (!adminUser || !adminUser.isActive || !isAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Phantom administrator is no longer authorized" });
    }

    await db.deleteSessionByToken(ctx.sessionToken);
    const token = await sdk.createSessionToken(adminUser.openId, {
      name: adminUser.name || "",
      expiresInMs: 7 * 24 * 60 * 60 * 1000,
    });
    await db.createSession({
      userId: adminUser.id,
      token,
      deviceInfo: getDeviceInfo(ctx.req),
      ipAddress: getClientIp(ctx.req),
      isPhantom: false,
      phantomAdminId: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await createAuditLog({
      userId: adminUser.id,
      userRole: adminUser.dropiRole,
      action: "admin.phantom_exit",
      resourceType: "user",
      resourceId: String(targetUser.id),
      severity: "critical",
      channel: "ADMIN",
      isAIAction: adminUser.isAIAgent,
      isPhantomMode: true,
      phantomAdminId,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
      details: {
        targetUserId: targetUser.id,
        targetRole: targetUser.dropiRole,
        targetChannel: targetUser.channel,
      },
    });

    return { token, user: adminUser };
  }),'''
text = replace_once(text, old_exit, new_exit, "phantom exit implementation")
start = text.index("// ===== AUDIT ROUTER =====")
old_audit = text[start:]
new_audit = '''// ===== AUDIT ROUTER =====
export const auditRouter = router({
  list: adminProcedure.input(z.object({
    channel: z.enum(["C1", "C2", "C3", "ADMIN"]),
    userId: z.number().optional(),
    action: z.string().optional(),
    severity: z.enum(["info", "warning", "critical"]).optional(),
    phantomMode: z.boolean().optional(),
    from: z.date().optional(),
    to: z.date().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
  })).query(async ({ input }) => {
    return db.listAuditLogs(input);
  }),

  getByUser: adminProcedure.input(z.object({
    channel: z.enum(["C1", "C2", "C3", "ADMIN"]),
    userId: z.number(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
  })).query(async ({ input }) => {
    return db.getAuditLogsByUser(input.channel, input.userId, input.page, input.limit);
  }),

  getByResource: adminProcedure.input(z.object({
    channel: z.enum(["C1", "C2", "C3", "ADMIN"]),
    resourceType: z.string(),
    resourceId: z.string(),
  })).query(async ({ input }) => {
    return db.getAuditLogsByResource(input.channel, input.resourceType, input.resourceId);
  }),

  getStats: adminProcedure.input(z.object({
    channel: z.enum(["C1", "C2", "C3", "ADMIN"]),
    from: z.date().optional(),
    to: z.date().optional(),
  })).query(async ({ input }) => {
    return db.getAuditStats(input);
  }),
});\n'''
if "export const auditRouter = router({" not in old_audit:
    raise SystemExit("audit router boundary not found")
text = text[:start] + new_audit
write(path, text)


# ---------------------------------------------------------------------------
# server/p2p-router.ts — C1 domain event attribution follows phantom session
# ---------------------------------------------------------------------------
path = "server/p2p-router.ts"
text = read(path)
text = replace_once(
    text,
    'import { auditLogs } from "../drizzle/schema";\n',
    '',
    "remove p2p direct audit table import",
)
text = replace_once(
    text,
    'import { getDb } from "./db";',
    'import { buildAuditAttribution, type AuditSessionLike } from "./audit-policy";\nimport { createAuditLog, getDb } from "./db";',
    "p2p audit helper imports",
)
old_helper = '''async function audit(input: {
  user: any;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  severity?: "info" | "warning" | "critical";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    userId: Number(input.user.id),
    userRole: String(input.user.dropiRole || "customer"),
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    details: input.details || null,
    severity: input.severity || "info",
    channel: "C1",
  });
}'''
new_helper = '''async function audit(input: {
  user: any;
  session?: AuditSessionLike;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  severity?: "info" | "warning" | "critical";
}) {
  const attribution = buildAuditAttribution("C1", input.session);
  await createAuditLog({
    userId: Number(input.user.id),
    userRole: String(input.user.dropiRole || "customer"),
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    details: input.details || null,
    severity: input.severity || "info",
    channel: attribution.channel,
    isPhantomMode: attribution.isPhantomMode,
    phantomAdminId: attribution.phantomAdminId,
    isAIAction: Boolean(input.user.isAIAgent),
  });
}'''
text = replace_once(text, old_helper, new_helper, "p2p audit helper")
text = text.replace("user: ctx.user,\n        action:", "user: ctx.user,\n        session: ctx.session,\n        action:")
text = text.replace("await audit({ user: ctx.user, action:", "await audit({ user: ctx.user, session: ctx.session, action:")
write(path, text)


# ---------------------------------------------------------------------------
# server/order-management-service.ts — C1 domain logs stay C1 + phantom attribution
# ---------------------------------------------------------------------------
path = "server/order-management-service.ts"
text = read(path)
text = replace_once(
    text,
    'import { createInAppNotification } from "./create-notification";\nimport { getDb } from "./db";',
    'import { createInAppNotification } from "./create-notification";\nimport { buildAuditAttribution, type AuditSessionLike } from "./audit-policy";\nimport { createAuditLog, getDb } from "./db";',
    "order audit imports",
)
text = replace_once(
    text,
    '''  deliveryAddress: string;
  zone: string;
}): Promise<{ orderId: number; orderUid: string; status: "initiated" }> {''',
    '''  deliveryAddress: string;
  zone: string;
  auditSession?: AuditSessionLike;
}): Promise<{ orderId: number; orderUid: string; status: "initiated" }> {''',
    "create order audit session input",
)
old_created_audit = '''  await db.insert(auditLogs).values({
    userId: input.actor.id,
    userRole: input.actor.dropiRole || "customer",
    action: "order.created",
    resourceType: "order",
    resourceId: String(orderId),
    details: { orderUid, storeId: store.id, status: "initiated", itemCount: snapshotItems.length },
    severity: "info",
    channel: input.actor.channel || "C1",
  });'''
new_created_audit = '''  const attribution = buildAuditAttribution("C1", input.auditSession);
  await createAuditLog({
    userId: input.actor.id,
    userRole: input.actor.dropiRole || "customer",
    action: "order.created",
    resourceType: "order",
    resourceId: String(orderId),
    details: { orderUid, storeId: store.id, status: "initiated", itemCount: snapshotItems.length },
    severity: "info",
    channel: attribution.channel,
    isPhantomMode: attribution.isPhantomMode,
    phantomAdminId: attribution.phantomAdminId,
    isAIAction: false,
  });'''
text = replace_once(text, old_created_audit, new_created_audit, "order created audit")
text = replace_once(
    text,
    '''  newStatus: OrderStatus;
  reason?: string;
}): Promise<{ previousStatus: OrderStatus; status: OrderStatus; pilotId: number | null; readyPilotNotifications: number }> {''',
    '''  newStatus: OrderStatus;
  reason?: string;
  auditSession?: AuditSessionLike;
}): Promise<{ previousStatus: OrderStatus; status: OrderStatus; pilotId: number | null; readyPilotNotifications: number }> {''',
    "transition audit session input",
)
old_transition_audit = '''  await db.insert(auditLogs).values({
    userId: input.actor.id,
    userRole: authorization.actorKind,
    action: "order.status_transition",
    resourceType: "order",
    resourceId: String(order.id),
    details: {
      orderUid: order.orderUid,
      previousStatus,
      newStatus: input.newStatus,
      reason: input.reason || null,
      pilotId,
    },
    severity: transitionSeverity(input.newStatus),
    channel: input.actor.channel || "C1",
  });'''
new_transition_audit = '''  const attribution = buildAuditAttribution("C1", input.auditSession);
  await createAuditLog({
    userId: input.actor.id,
    userRole: authorization.actorKind,
    action: "order.status_transition",
    resourceType: "order",
    resourceId: String(order.id),
    details: {
      orderUid: order.orderUid,
      previousStatus,
      newStatus: input.newStatus,
      reason: input.reason || null,
      pilotId,
    },
    severity: transitionSeverity(input.newStatus),
    channel: attribution.channel,
    isPhantomMode: attribution.isPhantomMode,
    phantomAdminId: attribution.phantomAdminId,
    isAIAction: false,
  });'''
text = replace_once(text, old_transition_audit, new_transition_audit, "order transition audit")
text = replace_once(
    text,
    '''    .where(and(eq(auditLogs.resourceType, "order"), eq(auditLogs.resourceId, String(orderId))))''',
    '''    .where(and(eq(auditLogs.channel, "C1"), eq(auditLogs.resourceType, "order"), eq(auditLogs.resourceId, String(orderId))))''',
    "C1 order timeline audit scope",
)
write(path, text)


# ---------------------------------------------------------------------------
# server/operations-router.ts — propagate persisted session to C1 domain services
# ---------------------------------------------------------------------------
path = "server/operations-router.ts"
text = read(path)
text = replace_once(
    text,
    '''        deliveryAddress: input.deliveryAddress,
        zone: input.zone,
      }),''',
    '''        deliveryAddress: input.deliveryAddress,
        zone: input.zone,
        auditSession: ctx.session,
      }),''',
    "placeOrder audit session",
)
text = replace_once(
    text,
    '''        newStatus: input.newStatus,
        reason: input.reason,
      }),''',
    '''        newStatus: input.newStatus,
        reason: input.reason,
        auditSession: ctx.session,
      }),''',
    "transitionOrder audit session",
)
write(path, text)


# ---------------------------------------------------------------------------
# server/pilot-selection-router.ts — remove final direct audit-table write
# ---------------------------------------------------------------------------
path = "server/pilot-selection-router.ts"
text = read(path)
text = replace_once(
    text,
    'import { getDb } from "./db";',
    'import { buildAuditAttribution } from "./audit-policy";\nimport { createAuditLog, getDb } from "./db";',
    "pilot audit helpers",
)
text = replace_once(
    text,
    'import { pilotProfiles, pilotRatingHistory, users, b2bDeliveries, auditLogs } from "../drizzle/schema";',
    'import { pilotProfiles, pilotRatingHistory, users, b2bDeliveries } from "../drizzle/schema";',
    "remove pilot direct audit table import",
)
old_pilot_audit = '''      // 7. Audit log
      await db.insert(auditLogs).values({
        userId: operatorId,
        userRole: userRole,
        action: "pilot_assigned_manual",
        channel: userChannel,
        resourceType: "b2bDelivery",
        resourceId: String(input.deliveryId),
        severity: "info",
        details: JSON.stringify({
          deliveryId: input.deliveryId,
          pilotUserId: input.pilotUserId,
          assignmentType: "manual",
          operatorRole: userRole,
          operatorChannel: userChannel,
          trackingCode: delivery.trackingCode,
        }),
        ipAddress: null,
        userAgent: null,
      });'''
new_pilot_audit = '''      // 7. Audit log
      const attribution = buildAuditAttribution(userChannel, ctx.session);
      await createAuditLog({
        userId: operatorId,
        userRole,
        action: "pilot_assigned_manual",
        channel: attribution.channel,
        resourceType: "b2bDelivery",
        resourceId: String(input.deliveryId),
        severity: "info",
        isPhantomMode: attribution.isPhantomMode,
        phantomAdminId: attribution.phantomAdminId,
        details: {
          deliveryId: input.deliveryId,
          pilotUserId: input.pilotUserId,
          assignmentType: "manual",
          operatorRole: userRole,
          operatorChannel: userChannel,
          trackingCode: delivery.trackingCode,
        },
        ipAddress: null,
        userAgent: null,
      });'''
text = replace_once(text, old_pilot_audit, new_pilot_audit, "pilot strict audit")
write(path, text)


# ---------------------------------------------------------------------------
# app/admin/audit-logs.tsx — never request a blended stream; phantom filter server-side
# ---------------------------------------------------------------------------
path = "app/admin/audit-logs.tsx"
text = read(path)
text = replace_once(
    text,
    'type ChannelFilter = "all" | "C1" | "C2" | "C3" | "ADMIN";',
    'type ChannelFilter = "C1" | "C2" | "C3" | "ADMIN";',
    "audit UI channel type",
)
text = replace_once(
    text,
    '  const [channel, setChannel] = useState<ChannelFilter>("all");',
    '  const [channel, setChannel] = useState<ChannelFilter>("C1");',
    "audit UI default channel",
)
text = replace_once(
    text,
    '''  const queryInput: any = { page, limit: 30 };
  if (severity !== "all") queryInput.severity = severity;
  if (channel !== "all") queryInput.channel = channel;
  if (searchAction.trim()) queryInput.action = searchAction.trim();

  const logsQuery = trpc.audit.list.useQuery(queryInput);
  const statsQuery = trpc.audit.getStats.useQuery({});''',
    '''  const queryInput: any = { page, limit: 30, channel };
  if (severity !== "all") queryInput.severity = severity;
  if (searchAction.trim()) queryInput.action = searchAction.trim();
  if (showPhantomOnly) queryInput.phantomMode = true;

  const logsQuery = trpc.audit.list.useQuery(queryInput);
  const statsQuery = trpc.audit.getStats.useQuery({ channel });''',
    "audit UI server scoped query",
)
text = replace_once(
    text,
    '''  // Filter phantom mode locally if toggled
  const displayLogs = showPhantomOnly
    ? logs.filter((l: any) => l.isPhantomMode)
    : logs;''',
    '''  const displayLogs = logs;''',
    "remove local phantom pagination filter",
)
text = replace_once(
    text,
    '''            {(["all", "C1", "C2", "C3", "ADMIN"] as ChannelFilter[]).map((c) => (''',
    '''            {(["C1", "C2", "C3", "ADMIN"] as ChannelFilter[]).map((c) => (''',
    "remove all-channel UI option",
)
write(path, text)

print("C1 audit separation patch materialized")
