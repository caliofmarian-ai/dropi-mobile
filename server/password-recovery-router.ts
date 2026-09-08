import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import * as db from "./db";
import { isOneTimeCodeExpired, verifyOneTimeCode } from "./account-lifecycle";

const identifierSchema = z.string().trim().min(3).max(320);
const resetCodeSchema = z.string().regex(/^\d{6}$/, "Please enter the 6-digit code from your email");
const newPasswordSchema = z.string().min(8)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .refine((value) => value === value.trim(), {
    message: "Password cannot start or end with spaces",
  });

const verifyResetCodeSchema = z.object({
  identifier: identifierSchema,
  token: resetCodeSchema,
});

const addressedResetPasswordSchema = z.object({
  identifier: identifierSchema,
  token: resetCodeSchema,
  newPassword: newPasswordSchema,
});

type AttemptRecord = { count: number; firstAttempt: number };
const attempts = new Map<string, AttemptRecord>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RESET_RATE_LIMIT_MAX = 10;

function getClientIp(req: any): string {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
}

function getDeviceInfo(req: any): string {
  return req.headers["user-agent"]?.slice(0, 255) || "unknown";
}

function checkWindowLimit(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  if (record.count >= RESET_RATE_LIMIT_MAX) return false;
  record.count += 1;
  return true;
}

function normalizeIdentifier(identifier: string): string {
  return identifier.toLowerCase().trim();
}

function identifierType(identifier: string): "email" | "username" {
  return identifier.includes("@") ? "email" : "username";
}

async function resolveValidRecoveryUser(identifier: string, token: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const user = await db.getUserByLoginIdentifier(normalizedIdentifier);

  if (!user) {
    return { user: undefined, normalizedIdentifier, reason: "not_found" as const };
  }

  if (isOneTimeCodeExpired(user.resetTokenExpiry)) {
    if (user.resetToken) await db.clearResetToken(user.id);
    return { user: undefined, normalizedIdentifier, reason: "expired" as const };
  }

  if (!verifyOneTimeCode(user.resetToken, "password-reset", token)) {
    return { user: undefined, normalizedIdentifier, reason: "invalid_code" as const };
  }

  return { user, normalizedIdentifier, reason: "valid" as const };
}

function invalidRecoveryError(): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: "Invalid or expired reset code. Use the newest code from your inbox.",
  });
}

export const passwordRecoveryRouter = router({
  verifyResetCode: publicProcedure.input(verifyResetCodeSchema).mutation(async ({ input, ctx }) => {
    const normalizedIdentifier = normalizeIdentifier(input.identifier);
    const type = identifierType(normalizedIdentifier);
    const rateKey = `verify:${getClientIp(ctx.req)}:${normalizedIdentifier}`;

    if (!checkWindowLimit(rateKey)) {
      console.warn(`[PASSWORD RECOVERY] outcome=rate_limited phase=verify identifier_type=${type}`);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many reset attempts. Please request a new code or try again later.",
      });
    }

    const resolved = await resolveValidRecoveryUser(normalizedIdentifier, input.token);
    if (!resolved.user) {
      console.warn(`[PASSWORD RECOVERY] outcome=code_rejected phase=verify reason=${resolved.reason} identifier_type=${type}`);
      throw invalidRecoveryError();
    }

    console.info(`[PASSWORD RECOVERY] outcome=code_verified userId=${resolved.user.id} identifier_type=${type}`);
    return { success: true };
  }),

  resetPassword: publicProcedure.input(addressedResetPasswordSchema).mutation(async ({ input, ctx }) => {
    const normalizedIdentifier = normalizeIdentifier(input.identifier);
    const type = identifierType(normalizedIdentifier);
    const rateKey = `reset:${getClientIp(ctx.req)}:${normalizedIdentifier}`;

    if (!checkWindowLimit(rateKey)) {
      console.warn(`[PASSWORD RECOVERY] outcome=rate_limited phase=reset identifier_type=${type}`);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many reset attempts. Please request a new code or try again later.",
      });
    }

    // Revalidate the exact addressed account and the same one-time code at the
    // credential-changing boundary. Verification in the prior UI step is not
    // treated as authorization by itself.
    const resolved = await resolveValidRecoveryUser(normalizedIdentifier, input.token);
    if (!resolved.user) {
      console.warn(`[PASSWORD RECOVERY] outcome=code_rejected phase=reset reason=${resolved.reason} identifier_type=${type}`);
      throw invalidRecoveryError();
    }

    const user = resolved.user;
    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    // This persistence boundary atomically revokes every existing user session.
    await db.updateUserPassword(user.id, passwordHash);

    // A reset must never report success merely because the UPDATE call returned.
    // Read the credential back from the authoritative user row and verify it with
    // the exact password submitted in this request. No password or hash is logged.
    const persistedUser = await db.getUserById(user.id);
    const persistenceVerified = Boolean(
      persistedUser?.passwordHash
      && await bcrypt.compare(input.newPassword, persistedUser.passwordHash),
    );
    if (!persistenceVerified) {
      console.error(`[PASSWORD RECOVERY] outcome=persistence_verification_failed userId=${user.id} identifier_type=${type}`);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Password could not be verified after saving. Please try the reset again.",
      });
    }

    // Clear the one-time credential only after the persisted replacement proves
    // it can authenticate the exact submitted password.
    await db.clearResetToken(user.id);

    await db.createAuditLog({
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
      details: {
        sessionsRevoked: true,
        recoveryIdentifierType: type,
        addressedRecovery: true,
        persistenceVerified: true,
      },
    });

    console.info(`[PASSWORD RECOVERY] outcome=password_reset persistence_verified=true userId=${user.id} identifier_type=${type}`);
    return { success: true };
  }),
});
