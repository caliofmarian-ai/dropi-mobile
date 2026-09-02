import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { maskEmail, sendPlatformEmail } from "./_core/mail";
import * as db from "./db";
import { createAuditLog } from "./db";
import { requirePhantomAdminId } from "./audit-policy";

async function sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
  return sendPlatformEmail({
    to: toEmail,
    subject: "DROPi - Verify Your Email",
    logLabel: "verification email",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2563EB; margin-bottom: 8px;">DROPi</h2>
          <p style="color: #666; font-size: 14px;">Logistics Platform</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
          <p>Welcome! Please verify your email address with the code below:</p>
          <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111;">${code}</span>
          </div>
          <p style="color: #666; font-size: 13px;">This code expires in <strong>30 minutes</strong>.</p>
          <p style="color: #666; font-size: 13px;">If you did not create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
          <p style="color: #999; font-size: 11px;">&copy; DROPi Deliveries. All rights reserved.</p>
        </div>
      `,
  });
}

async function sendRecoveryEmail(toEmail: string, code: string): Promise<boolean> {
  return sendPlatformEmail({
    to: toEmail,
    subject: "DROPi - Password Reset Code",
    logLabel: "password reset email",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2563EB; margin-bottom: 8px;">DROPi</h2>
          <p style="color: #666; font-size: 14px;">Logistics Platform</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
          <p>You requested a password reset. Use the code below to set a new password:</p>
          <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111;">${code}</span>
          </div>
          <p style="color: #666; font-size: 13px;">This code expires in <strong>15 minutes</strong>.</p>
          <p style="color: #666; font-size: 13px;">If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
          <p style="color: #999; font-size: 11px;">&copy; DROPi Deliveries. All rights reserved.</p>
        </div>
      `,
  });
}

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
  token: z.string().min(6, "Please enter the 6-digit code from your email").max(6),
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

    // Determine activation and verification status based on role
    const ROLES_REQUIRING_ADMIN_APPROVAL = [
      "operations_manager", "logistics_coordinator", "fleet_manager",
      "c2_compliance_officer", "c2_performance_monitor", "c2_incident_responder",
      "data_analyst", "quality_assurance",
      "emergency_coordinator", "dispatch_manager", "resource_allocator",
      "communication_officer", "c3_data_analyst", "incident_commander",
      "system_administrator", "security_officer", "audit_manager",
      "configuration_manager", "analytics_manager", "support_coordinator",
    ];
    const requiresApproval = ROLES_REQUIRING_ADMIN_APPROVAL.includes(input.dropiRole);
    const isDeliveryPartner = input.dropiRole === "delivery_partner";

    // Delivery partners start as unverified (cannot operate until documents approved)
    // Operational roles start as inactive (cannot login until admin approves)
    const isActive = requiresApproval ? false : true;
    const isVerified = isDeliveryPartner ? false : true;

    // Create user
    const { id, openId } = await db.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
      dropiRole: input.dropiRole,
      channel: input.channel,
      zone: input.zone,
      isActive,
      isVerified,
    });

    // Generate email verification code
    const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
    const verifyExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await db.setEmailVerifyToken(id, verifyCode, verifyExpiry);

    // Send verification email
    const emailSent = await sendVerificationEmail(input.email, verifyCode);
    if (!emailSent) {
      console.warn(`[EMAIL VERIFY] Verification delivery failed for userId=${id} email=${maskEmail(input.email)}`);
    }

    // Create session token (user can login but will see verification prompt)
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
      details: { email: input.email, role: input.dropiRole, channel: input.channel, emailVerificationSent: emailSent },
    });

    // Auto-create role application for operational roles requiring approval
    if (requiresApproval) {
      const dbConn = await (await import("./db")).getDb();
      if (dbConn) {
        const { roleApplications } = await import("../drizzle/schema");
        await dbConn.insert(roleApplications).values({
          userId: id,
          requestedRole: input.dropiRole as any,
          requestedChannel: input.channel as any,
          motivation: "Auto-generated on registration. Awaiting admin approval.",
          status: "pending",
        });
      }
      // Notify admin about pending approval
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({
          title: "New Role Application",
          content: `${input.name} (${input.email}) registered as ${input.dropiRole} on ${input.channel}. Requires admin approval.`,
        });
      } catch (e) { /* notification is best-effort */ }
    }

    const user = await db.getUserById(id);
    return {
      user,
      token: requiresApproval ? null : token, // Don't give session token if account is inactive
      emailVerificationRequired: !requiresApproval,
      accountPendingApproval: requiresApproval,
      verificationRequired: isDeliveryPartner,
    };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const ip = getClientIp(ctx.req);
    const normalizedEmail = input.email.toLowerCase().trim();
    const maskedLoginEmail = maskEmail(normalizedEmail);

    console.info(`[AUTH LOGIN] request_received email=${maskedLoginEmail}`);

    // Rate limiting (per email — mobile users share IPs)
    if (!checkRateLimit(normalizedEmail)) {
      console.warn(`[AUTH LOGIN] failure_reason=rate_limited email=${maskedLoginEmail}`);
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many login attempts for this account. Please try again in 15 minutes." });
    }

    // Find user — always use the normalised email so lookups match provisioned rows
    const user = await db.getUserByEmail(normalizedEmail);
    console.info(`[AUTH LOGIN] user_found=${user ? "yes" : "no"} email=${maskedLoginEmail}`);
    if (!user || !user.passwordHash) {
      console.warn(
        `[AUTH LOGIN] failure_reason=${!user ? "user_not_found" : "missing_password_hash"} email=${maskedLoginEmail}`,
      );
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      console.warn(`[AUTH LOGIN] failure_reason=account_locked email=${maskedLoginEmail}`);
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      throw new TRPCError({ code: "FORBIDDEN", message: `Account locked. Try again in ${minutesLeft} minutes.` });
    }

    // Check if account is active
    if (!user.isActive) {
      console.warn(`[AUTH LOGIN] failure_reason=account_inactive email=${maskedLoginEmail}`);
      throw new TRPCError({ code: "FORBIDDEN", message: "Account has been deactivated. Contact support." });
    }

    // Verify password
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    console.info(`[AUTH LOGIN] bcrypt_compare=${valid} email=${maskedLoginEmail}`);
    if (!valid) {
      console.warn(`[AUTH LOGIN] failure_reason=invalid_password email=${maskedLoginEmail}`);
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
    console.info(`[AUTH LOGIN] jwt_created=true email=${maskedLoginEmail}`);

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
      return { success: true, message: "If this email is registered, a 6-digit code has been sent." };
    }

    // Generate 6-digit verification code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await db.setResetToken(user.id, code, expiry);

    // Audit log
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
      details: { email: input.email, codeGenerated: true },
    });

    // Send recovery email via SMTP
    const emailSent = await sendRecoveryEmail(input.email, code);
    if (!emailSent) {
      await db.clearResetToken(user.id);
      console.error(`[PASSWORD RESET] Delivery failed for userId=${user.id} email=${maskEmail(input.email)}`);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to send reset code right now. Please try again later.",
      });
    }

    return { success: true, message: "If this email is registered, a 6-digit code has been sent." };
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

  // Verify email with 6-digit code
  verifyEmail: protectedProcedure.input(z.object({
    code: z.string().length(6),
  })).mutation(async ({ input, ctx }) => {
    const userId = ctx.user!.id;
    const user = await db.getUserById(userId);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    if (user.emailVerified) {
      return { success: true, message: "Email already verified" };
    }

    if (!user.emailVerifyToken || user.emailVerifyToken !== input.code) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification code" });
    }

    if (user.emailVerifyExpires && new Date(user.emailVerifyExpires) < new Date()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Verification code has expired. Please request a new one." });
    }

    await db.markEmailVerified(userId);

    await createAuditLog({
      userId,
      userRole: user.dropiRole,
      action: "auth.email_verified",
      resourceType: "user",
      resourceId: String(userId),
      severity: "info",
      channel: user.channel as any,
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
    });

    return { success: true, message: "Email verified successfully" };
  }),

  // Resend verification code
  resendVerificationCode: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user!.id;
    console.log(`[EMAIL VERIFY] request_received authenticated_user=yes userId=${userId}`);

    const user = await db.getUserById(userId);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    if (user.emailVerified) {
      return { success: true, message: "Email already verified" };
    }

    if (!user.email) {
      console.error(`[EMAIL VERIFY] mail_transport_invoked=no code_persisted=no response_status=failure reason=no_email userId=${userId}`);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No email address on file. Please contact support.",
      });
    }

    // Generate new code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 30 * 60 * 1000);
    await db.setEmailVerifyToken(userId, code, expiry);
    console.log(`[EMAIL VERIFY] code_persisted=yes userId=${userId}`);

    // Send email and surface delivery failures to the caller
    console.log(`[EMAIL VERIFY] mail_transport_invoked=yes userId=${userId}`);
    const sent = await sendVerificationEmail(user.email, code);
    console.log(`[EMAIL VERIFY] mail_delivery_success=${sent} userId=${userId}`);

    if (!sent) {
      console.error(`[EMAIL VERIFY] response_status=failure reason=delivery_failed userId=${userId} email=${maskEmail(user.email)}`);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to send verification code right now. Please try again later.",
      });
    }

    await createAuditLog({
      userId,
      userRole: user.dropiRole,
      action: "auth.resend_verification",
      resourceType: "user",
      resourceId: String(userId),
      severity: "info",
      channel: user.channel as any,
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: getClientIp(ctx.req),
      userAgent: getDeviceInfo(ctx.req),
    });

    console.log(`[EMAIL VERIFY] response_status=success userId=${userId}`);
    return { success: true, message: "Verification code sent" };
  }),

  updateProfile: protectedProcedure.input(z.object({
    name: z.string().min(2).optional(),
    zone: z.string().optional(),
    profilePhotoUrl: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db2 = await db.getDb();
    if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const updateData: Record<string, any> = {};
    if (input.name) updateData.name = input.name;
    if (input.zone !== undefined) updateData.zone = input.zone;
    if (input.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = input.profilePhotoUrl;
    if (Object.keys(updateData).length > 0) {
      await db2.update(users).set(updateData).where(eq(users.id, ctx.user!.id));
    }
    const updated = await db.getUserById(ctx.user!.id);
    return updated;
  }),

  uploadProfilePhoto: protectedProcedure.input(z.object({
    fileBase64: z.string(), // base64-encoded image
    contentType: z.string().default("image/jpeg"),
    fileName: z.string().default("profile.jpg"),
  })).mutation(async ({ input, ctx }) => {
    const { storagePut } = await import("./storage");
    const userId = ctx.user!.id;

    // Validate file size (max 5MB)
    const sizeBytes = Buffer.from(input.fileBase64, "base64").length;
    if (sizeBytes > 5 * 1024 * 1024) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "File too large. Maximum 5MB." });
    }

    // Validate content type
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(input.contentType)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only JPEG, PNG, and WebP images are allowed." });
    }

    // Upload to S3
    const ext = input.contentType.split("/")[1] || "jpg";
    const key = `profile-photos/user_${userId}.${ext}`;
    const buffer = Buffer.from(input.fileBase64, "base64");
    const { url } = await storagePut(key, buffer, input.contentType);

    // Save URL to user record
    const db2 = await db.getDb();
    if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    await db2.update(users).set({ profilePhotoUrl: url }).where(eq(users.id, userId));

    return { success: true, url };
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
    const token = await sdk.createSessionToken(targetUser.openId, {
      name: `[PHANTOM] ${targetUser.name}`,
      expiresInMs: 2 * 60 * 60 * 1000,
      phantomAdminId: user.id,
    });

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

  exitPhantom: protectedProcedure.mutation(async ({ ctx }) => {
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
});
