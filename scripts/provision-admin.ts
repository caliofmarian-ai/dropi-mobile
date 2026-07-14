/**
 * DROPi Admin Provisioning Script
 *
 * Provisions the initial system administrator account in a one-time, idempotent operation.
 * The account is only created if it does not already exist — calling this multiple times
 * with the same email is safe.
 *
 * Required environment variables:
 *   DATABASE_URL    — MySQL connection string
 *   ADMIN_EMAIL     — Administrator email address
 *   ADMIN_PASSWORD  — Administrator password (min 8 chars, 1 uppercase, 1 digit)
 *
 * Optional environment variables:
 *   ADMIN_NAME      — Administrator display name (default: "Super Admin")
 *
 * Exit codes:
 *   0 — success (account created or already exists)
 *   1 — failure (missing/invalid env vars, DB connection error, insert error)
 *
 * Usage (compiled via pnpm build):
 *   DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node dist/provision-admin.mjs
 *
 * See docs/ADMIN_PROVISIONING.md for the full Railway execution procedure.
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { users } from "../drizzle/schema";

// ===== TYPES =====

export interface ProvisionInput {
  email: string;
  password: string;
  name: string;
}

export type ProvisionResult =
  | { status: "created"; email: string }
  | { status: "already_exists"; email: string };

/**
 * Minimal duck-typed drizzle db interface used by provisionAdmin.
 * Keeping this narrow makes unit tests simple — any object satisfying
 * this interface can be passed without instantiating a real DB connection.
 */
export interface ProvisionDb {
  select(fields?: unknown): {
    from(table: unknown): {
      where(cond: unknown): {
        limit(n: number): Promise<unknown[]>;
      };
    };
  };
  insert(table: unknown): {
    values(data: unknown): Promise<unknown>;
  };
}

export interface ProvisionEnv {
  databaseUrl: string;
  email: string;
  password: string;
  name: string;
}

// ===== ENV VALIDATION =====

/**
 * Reads and validates the required environment variables.
 * Throws a descriptive Error if any required variable is missing or invalid.
 * Never logs the password, hash, DATABASE_URL, or any other secret.
 */
export function validateEnv(): ProvisionEnv {
  const databaseUrl = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Super Admin";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  if (!email) {
    throw new Error("ADMIN_EMAIL environment variable is required");
  }
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }

  // Password strength — identical rules to auth-router.ts registration
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error("ADMIN_PASSWORD must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    throw new Error("ADMIN_PASSWORD must contain at least one number");
  }

  return { databaseUrl, email, password, name };
}

// ===== CORE PROVISIONING LOGIC =====

/**
 * Creates the initial DROPi system administrator account if it does not already exist.
 *
 * RBAC fields assigned:
 *   role:     "admin"                 — system-level role (legacy + DROPi access gate)
 *   dropiRole:"system_administrator"  — DROPi RBAC role
 *   channel:  "ADMIN"                 — DROPi operational channel
 *   isActive: true                    — account is immediately usable
 *   isVerified: true                  — no document verification required
 *   emailVerified: true               — no email verification required
 *
 * Idempotent: if an account with the given email already exists (regardless of its
 * current fields), this function returns "already_exists" and makes no changes.
 *
 * @param db    - Drizzle db instance (or duck-typed mock for unit tests)
 * @param input - { email, password, name }
 * @returns     ProvisionResult with status "created" or "already_exists"
 */
export async function provisionAdmin(db: ProvisionDb, input: ProvisionInput): Promise<ProvisionResult> {
  const email = input.email.toLowerCase().trim();

  // Check whether an account with this email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if ((existing as unknown[]).length > 0) {
    return { status: "already_exists", email };
  }

  // Hash password using canonical bcrypt configuration (salt rounds = 12)
  const passwordHash = await bcrypt.hash(input.password, 12);

  const openId = `dropi_admin_${Date.now()}_${randomUUID().slice(0, 8)}`;

  await db.insert(users).values({
    openId,
    email,
    name: input.name,
    loginMethod: "password",
    role: "admin",
    dropiRole: "system_administrator",
    channel: "ADMIN",
    zone: null,
    isActive: true,
    isVerified: true,
    emailVerified: true,
    isAIAgent: false,
    passwordHash,
    failedLoginAttempts: 0,
    lastSignedIn: new Date(),
  });

  return { status: "created", email };
}

// ===== ENTRY POINT =====

async function run(): Promise<void> {
  console.log("[provision-admin] Starting admin provisioning...");

  let env: ProvisionEnv;
  try {
    env = validateEnv();
  } catch (err: any) {
    console.error(`[provision-admin] Configuration error: ${err.message}`);
    process.exit(1);
  }

  // Log the email being provisioned (safe — not a secret)
  console.log(`[provision-admin] Target email: ${env.email.toLowerCase().trim()}`);
  console.log("[provision-admin] Connecting to database...");

  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(env.databaseUrl);
    const db = drizzle(connection) as unknown as ProvisionDb;

    const result = await provisionAdmin(db, {
      email: env.email,
      password: env.password,
      name: env.name,
    });

    if (result.status === "already_exists") {
      console.log(
        `[provision-admin] ✓ Admin account already exists for ${result.email} — no changes made`,
      );
    } else {
      console.log(`[provision-admin] ✓ Admin account created successfully for ${result.email}`);
    }
  } catch (err: any) {
    // Log only the message — never log DATABASE_URL, password, or hash
    console.error(`[provision-admin] Error: ${err.message}`);
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

// Guard: only auto-execute when this file is run directly.
// When imported by unit tests, process.argv[1] will point to the vitest runner —
// not to this script — so the guard evaluates to false and run() is never called.
const scriptPath = process.argv[1] ?? "";
if (
  scriptPath.endsWith("provision-admin.ts") ||
  scriptPath.endsWith("provision-admin.mjs")
) {
  run();
}
