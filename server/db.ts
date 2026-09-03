import { randomUUID } from "node:crypto";
import { eq, and, desc, gte, lte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, sessions, auditLogs, InsertAuditLog, InsertSession } from "../drizzle/schema";
import { type AuditChannel } from "./audit-policy";
import { classifyAuditRetention } from "../shared/privacy-policy";
import { ENV } from "./_core/env";
import { resolveUserVerificationForCreate, verificationPatchForRoleChange } from "./user-verification-policy";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  } else if (!_db && process.env.DATABASE_URL && !ENV.databaseUrl) {
    console.warn(
      "[Database] Invalid DATABASE_URL format. Use full Railway MySQL URL (******host:3306/database)."
    );
  }
  return _db;
}

// ===== USER QUERIES =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  dropiRole: string;
  channel: string;
  zone?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isAIAgent?: boolean;
  agentMode?: "autonomous" | "assistant" | null;
  humanPairId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `dropi_${randomUUID()}`;
  const result = await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    dropiRole: data.dropiRole as any,
    channel: data.channel as any,
    zone: data.zone || null,
    isActive: data.isActive ?? true,
    isVerified: resolveUserVerificationForCreate(data.dropiRole, data.isVerified),
    isAIAgent: data.isAIAgent || false,
    agentMode: data.agentMode || null,
    humanPairId: data.humanPairId || null,
    loginMethod: "password",
    role: "user",
    lastSignedIn: new Date(),
  });
  return { id: result[0].insertId, openId };
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, userId));
}

export async function setResetToken(userId: number, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.id, userId));
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function clearResetToken(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ resetToken: null, resetTokenExpiry: null }).where(eq(users.id, userId));
}

export async function incrementFailedLogin(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
  }).where(eq(users.id, userId));
}

export async function lockAccount(userId: number, until: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ lockedUntil: until }).where(eq(users.id, userId));
}

export async function resetFailedLogin(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, userId));
}

export async function updateUserLastLogin(userId: number, ip: string, device: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ lastSignedIn: new Date(), lastIp: ip, lastDevice: device }).where(eq(users.id, userId));
}

export async function listUsers(opts: { channel?: string; role?: string; search?: string; page?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };
  const page = opts.page || 1;
  const limit = opts.limit || 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts.channel) conditions.push(eq(users.channel, opts.channel as any));
  if (opts.role) conditions.push(eq(users.dropiRole, opts.role as any));
  if (opts.search) conditions.push(or(like(users.name, `%${opts.search}%`), like(users.email, `%${opts.search}%`)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const result = await db.select().from(users).where(where).limit(limit).offset(offset).orderBy(desc(users.createdAt));
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(where);
  const total = countResult[0]?.count || 0;
  return { users: result, total };
}

export async function toggleUserActive(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

export async function changeUserRole(userId: number, dropiRole: string, channel: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    dropiRole: dropiRole as any,
    channel: channel as any,
    ...verificationPatchForRoleChange(dropiRole),
  }).where(eq(users.id, userId));
}

// ===== SESSION QUERIES =====

export async function createSession(data: InsertSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessions).values(data);
  return result[0].insertId;
}

export async function getSessionByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteSessionByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function deleteUserSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// ===== AUDIT LOG QUERIES =====

export async function createAuditLog(data: InsertAuditLog & { channel: AuditChannel }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Cannot log: database not available");
    return;
  }
  try {
    await db.insert(auditLogs).values({
      ...data,
      retentionClass: data.retentionClass ?? classifyAuditRetention(data.action),
    });
  } catch (error) {
    console.error("[Audit] Failed to create log:", error);
  }
}

export async function listAuditLogs(opts: {
  channel: AuditChannel;
  userId?: number;
  action?: string;
  severity?: string;
  phantomMode?: boolean;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  const page = opts.page || 1;
  const limit = opts.limit || 50;
  const offset = (page - 1) * limit;

  const conditions = [eq(auditLogs.channel, opts.channel)];
  if (opts.userId) conditions.push(eq(auditLogs.userId, opts.userId));
  if (opts.action) conditions.push(like(auditLogs.action, `%${opts.action}%`));
  if (opts.severity) conditions.push(eq(auditLogs.severity, opts.severity as any));
  if (opts.phantomMode !== undefined) conditions.push(eq(auditLogs.isPhantomMode, opts.phantomMode));
  if (opts.from) conditions.push(gte(auditLogs.createdAt, opts.from));
  if (opts.to) conditions.push(lte(auditLogs.createdAt, opts.to));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const result = await db.select().from(auditLogs).where(where).limit(limit).offset(offset).orderBy(desc(auditLogs.createdAt));
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where);
  const total = countResult[0]?.count || 0;
  return { logs: result, total };
}

export async function getAuditLogsByUser(channel: AuditChannel, userId: number, page = 1, limit = 50) {
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
  const conditions = [eq(auditLogs.channel, opts.channel)];
  if (opts.from) conditions.push(gte(auditLogs.createdAt, opts.from));
  if (opts.to) conditions.push(lte(auditLogs.createdAt, opts.to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where);
  return { total: totalResult[0]?.count || 0 };
}

// ===== EMAIL VERIFICATION HELPERS =====

export async function setEmailVerifyToken(userId: number, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ emailVerifyToken: token, emailVerifyExpires: expiry }).where(eq(users.id, userId));
}

export async function getUserByEmailVerifyToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.emailVerifyToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markEmailVerified(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null }).where(eq(users.id, userId));
}
