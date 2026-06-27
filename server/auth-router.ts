import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { createAuditLog } from "./db";

// ===== VALIDATION SCHEMAS =====
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  dropiRole: z.string().default("customer"),
  channel: z.enum(["C1", "C2", "C3", "ADMIN"]).default("C1"),
  zone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ===== HELPERS =====
function getClientIp(req: any): string {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
}

function getDeviceInfo(req: any): string {
  return req.headers["user-agent"]?.slice(0, 255) || "unknown";
}

// Rate limiting in-memory store (per email, not per IP — mobile users share IPs via NAT/4G)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // 10 attempts per email per window

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count++;
  return true;
}

// ===== DROPI AUTH ROUTER =====
export const dropiAuthRouter = router({
  register: publicProcedure.input(registerSchema).mutation(async ({ input, ctx }) => {
    // Check if email already exists
    const existing = await db.getUserByEmail(input.email);
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user
    const { id, openId } = await db.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
      dropiRole: input.dropiRole,
      channel: input.channel,
      zone: input.zone,
    });

    // Create session token
    const token = await sdk.createSessionToken(openId, { name: input.name });

    // Store session in DB
    await db.createSession({
      userId: id,
      token,
      deviceInfo: getDeviceInfo(ctx.req),
      ipAddress: getClientIp(ctx.req),
      isPhantom: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Audit log
    await createAuditLog({
      userId: id,
      userRole: input.dropiRole,
      action: "auth.register",
      resourceType: "user",
      resourceId: String(id),
      severity: "info",
      channel: input.channel as any,
      isAIAction: false,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
      details: { email: input.email, role: input.dropiRole, channel: input.channel },
    });

    const user = await db.getUserById(id);
    return { user, token };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const ip = getClientIp(ctx.req);

    // Rate limiting (per email — mobile users share IPs)
    if (!checkRateLimit(input.email.toLowerCase().trim())) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many login attempts for this account. Please try again in 15 minutes." });
    }

    // Find user
    const user = await db.getUserByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      throw new TRPCError({ code: "FORBIDDEN", message: `Account locked. Try again in ${minutesLeft} minutes.` });
    }

    // Check if account is active
    if (!user.isActive) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Account has been deactivated. Contact support." });
    }

    // Verify password
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      await db.incrementFailedLogin(user.id);
      // Lock after 10 failed attempts
      if ((user.failedLoginAttempts || 0) + 1 >= 10) {
        await db.lockAccount(user.id, new Date(Date.now() + 30 * 60 * 1000)); // 30 min lock
      }
      // Audit failed login
      await createAuditLog({
        userId: user.id,
        userRole: user.dropiRole,
        action: "auth.login_failed",
        resourceType: "user",
        resourceId: String(user.id),
        severity: "warning",
        channel: user.channel as any,
        isAIAction: user.isAIAgent,
        isPhantomMode: false,
        ipAddress: ip,
        userAgent: getDeviceInfo(ctx.req),
        details: { email: input.email, reason: "invalid_password" },
      });
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    }

    // Reset failed attempts on successful login
    await db.resetFailedLogin(user.id);
    await db.updateUserLastLogin(user.id, ip, getDeviceInfo(ctx.req));

    // Create session token
    const token = await sdk.createSessionToken(user.openId, { name: user.name || "" });

    // Store session
    await db.createSession({
      userId: user.id,
      token,
      deviceInfo: getDeviceInfo(ctx.req),
      ipAddress: ip,
      isPhantom: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Audit successful login
    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "auth.login",
      resourceType: "user",
      resourceId: String(user.id),
      severity: "info",
      channel: user.channel as any,
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: ip,
      userAgent: getDeviceInfo(ctx.req),
      details: { email: input.email },
    });

    return { user, token };
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user!;
    // Audit
    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "auth.logout",
      resourceType: "user",
      resourceId: String(user.id),
      severity: "info",
      channel: user.channel as any,
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
    });
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  forgotPassword: publicProcedure.input(forgotPasswordSchema).mutation(async ({ input, ctx }) => {
    const user = await db.getUserByEmail(input.email);
    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: "If the email exists, a reset link has been sent." };
    }

    // Generate reset token
    const token = randomUUID();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.setResetToken(user.id, token, expiry);

    // Send email via Gmail MCP (will be called from the route handler)
    // Store token for the email sending step
    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "auth.forgot_password",
      resourceType: "user",
      resourceId: String(user.id),
      severity: "info",
      channel: user.channel as any,
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
      details: { email: input.email },
    });

    return { success: true, message: "If the email exists, a reset link has been sent.", resetToken: token };
  }),

  resetPassword: publicProcedure.input(resetPasswordSchema).mutation(async ({ input, ctx }) => {
    const user = await db.getUserByResetToken(input.token);
    if (!user) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
    }

    // Check expiry
    if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
      await db.clearResetToken(user.id);
      throw new TRPCError({ code: "BAD_REQUEST", message: "Reset token has expired. Please request a new one." });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await db.updateUserPassword(user.id, passwordHash);
    await db.clearResetToken(user.id);

    // Audit
    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "auth.reset_password",
      resourceType: "user",
      resourceId: String(user.id),
      severity: "warning",
      channel: user.channel as any,
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
    });

    return { success: true };
  }),

  changePassword: protectedProcedure.input(changePasswordSchema).mutation(async ({ input, ctx }) => {
    const user = ctx.user!;
    if (!user.passwordHash) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Account does not use password authentication" });
    }

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await db.updateUserPassword(user.id, passwordHash);

    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "auth.change_password",
      resourceType: "user",
      resourceId: String(user.id),
      severity: "warning",
      channel: user.channel as any,
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
    });

    return { success: true };
  }),

  updateProfile: protectedProcedure.input(z.object({
    name: z.string().min(2).optional(),
    zone: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db2 = await db.getDb();
    if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const updateData: Record<string, any> = {};
    if (input.name) updateData.name = input.name;
    if (input.zone !== undefined) updateData.zone = input.zone;
    if (Object.keys(updateData).length > 0) {
      await db2.update(users).set(updateData).where(eq(users.id, ctx.user!.id));
    }
    const updated = await db.getUserById(ctx.user!.id);
    return updated;
  }),
});

// ===== ADMIN AUTH ROUTER =====
export const adminAuthRouter = router({
  listUsers: adminProcedure.input(z.object({
    channel: z.enum(["C1", "C2", "C3", "ADMIN"]).optional(),
    role: z.string().optional(),
    search: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
  }).default({ page: 1, limit: 50 })).query(async ({ input }) => {
    return db.listUsers(input);
  }),

  phantomLogin: adminProcedure.input(z.object({
    targetUserId: z.number(),
  })).mutation(async ({ input, ctx }) => {
    const user = ctx.user!;
    const targetUser = await db.getUserById(input.targetUserId);
    if (!targetUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Target user not found" });
    }

    // Create phantom session token
    const token = await sdk.createSessionToken(targetUser.openId, { name: `[PHANTOM] ${targetUser.name}` });

    // Store phantom session
    await db.createSession({
      userId: targetUser.id,
      token,
      deviceInfo: getDeviceInfo(ctx.req),
      ipAddress: getClientIp(ctx.req),
      isPhantom: true,
      phantomAdminId: user.id,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours for phantom
    });

    // CRITICAL audit log
    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "admin.phantom_login",
      resourceType: "user",
      resourceId: String(input.targetUserId),
      severity: "critical",
      channel: "ADMIN",
      isAIAction: user.isAIAgent,
      isPhantomMode: true,
      phantomAdminId: user.id,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
      details: { targetUser: targetUser.email, targetRole: targetUser.dropiRole },
    });

    return { token, user: targetUser };
  }),

  exitPhantom: adminProcedure.mutation(async ({ ctx }) => {
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
  }),

  toggleUserActive: adminProcedure.input(z.object({
    userId: z.number(),
    isActive: z.boolean(),
  })).mutation(async ({ input, ctx }) => {
    const user = ctx.user!;
    await db.toggleUserActive(input.userId, input.isActive);

    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: input.isActive ? "admin.activate_user" : "admin.deactivate_user",
      resourceType: "user",
      resourceId: String(input.userId),
      severity: "critical",
      channel: "ADMIN",
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
      details: { targetUserId: input.userId, isActive: input.isActive },
    });

    return { success: true };
  }),

  changeUserRole: adminProcedure.input(z.object({
    userId: z.number(),
    dropiRole: z.string(),
    channel: z.enum(["C1", "C2", "C3", "ADMIN"]),
  })).mutation(async ({ input, ctx }) => {
    const user = ctx.user!;
    const targetUser = await db.getUserById(input.userId);
    const oldRole = targetUser?.dropiRole;
    const oldChannel = targetUser?.channel;

    await db.changeUserRole(input.userId, input.dropiRole, input.channel);

    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "admin.change_role",
      resourceType: "user",
      resourceId: String(input.userId),
      severity: "critical",
      channel: "ADMIN",
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
      details: { oldRole, oldChannel, newRole: input.dropiRole, newChannel: input.channel },
    });

    return { success: true };
  }),
});

// ===== AUDIT ROUTER =====
export const auditRouter = router({
  list: adminProcedure.input(z.object({
    channel: z.enum(["C1", "C2", "C3", "ADMIN"]).optional(),
    userId: z.number().optional(),
    action: z.string().optional(),
    severity: z.enum(["info", "warning", "critical"]).optional(),
    from: z.date().optional(),
    to: z.date().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
  }).default({ page: 1, limit: 50 })).query(async ({ input }) => {
    return db.listAuditLogs(input);
  }),

  getByUser: adminProcedure.input(z.object({
    userId: z.number(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
  })).query(async ({ input }) => {
    return db.getAuditLogsByUser(input.userId, input.page, input.limit);
  }),

  getByResource: adminProcedure.input(z.object({
    resourceType: z.string(),
    resourceId: z.string(),
  })).query(async ({ input }) => {
    return db.getAuditLogsByResource(input.resourceType, input.resourceId);
  }),

  getStats: adminProcedure.input(z.object({
    channel: z.enum(["C1", "C2", "C3", "ADMIN"]).optional(),
    from: z.date().optional(),
    to: z.date().optional(),
  }).default({})).query(async ({ input }) => {
    return db.getAuditStats(input);
  }),
});
