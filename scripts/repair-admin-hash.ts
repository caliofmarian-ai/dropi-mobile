/**
 * DROPi Admin Hash Repair Script
 *
 * Verifies the bcrypt hash stored for the admin account and, if it is missing,
 * corrupted, or does not match ADMIN_PASSWORD, regenerates it using the same
 * bcryptjs implementation used by auth-router.ts (rounds = 12).
 *
 * This is a one-time repair tool.  Run it when `dropiAuth.login` returns
 * "Invalid email or password" even though the admin account exists.
 *
 * Required environment variables:
 *   DATABASE_URL    — MySQL connection string
 *   ADMIN_EMAIL     — Administrator email address (used to locate the row)
 *   ADMIN_PASSWORD  — The plain-text password that SHOULD match the stored hash
 *
 * Exit codes:
 *   0 — hash is OK (no change needed) OR hash was repaired successfully
 *   1 — fatal error (missing env vars, DB connection failure, update error)
 *
 * Usage (compiled via pnpm build):
 *   DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node dist/repair-admin-hash.mjs
 *
 * See docs/ADMIN_PROVISIONING.md for the full Railway execution procedure.
 *
 * SECURITY NOTE:
 *   This script never logs the password, the old hash, or the new hash.
 *   It only logs the email (non-secret), the check result, and the repair action.
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../drizzle/schema";

// ===== TYPES =====

export interface RepairInput {
  email: string;
  password: string;
}

export type RepairResult =
  | { status: "ok"; email: string }
  | { status: "repaired"; email: string; reason: string }
  | { status: "not_found"; email: string };

export interface RepairDb {
  select(fields?: unknown): {
    from(table: unknown): {
      where(cond: unknown): {
        limit(n: number): Promise<unknown[]>;
      };
    };
  };
  update(table: unknown): {
    set(data: unknown): {
      where(cond: unknown): Promise<unknown>;
    };
  };
}

// ===== ENV VALIDATION =====

export interface RepairEnv {
  databaseUrl: string;
  email: string;
  password: string;
}

/**
 * Reads and validates the required environment variables.
 * Throws a descriptive Error if any required variable is missing.
 * Never logs the password, hash, DATABASE_URL, or any other secret.
 */
export function validateRepairEnv(): RepairEnv {
  const databaseUrl = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!databaseUrl) throw new Error("DATABASE_URL environment variable is required");
  if (!email) throw new Error("ADMIN_EMAIL environment variable is required");
  if (!password) throw new Error("ADMIN_PASSWORD environment variable is required");

  return { databaseUrl, email, password };
}

// ===== BCRYPT VALIDATION =====

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;

/**
 * Returns true if `value` looks like a valid bcrypt hash produced by bcryptjs.
 * This is a format check only — it does not attempt to compare the hash.
 */
export function isValidBcryptHash(value: unknown): boolean {
  return typeof value === "string" && BCRYPT_HASH_PATTERN.test(value);
}

// ===== CORE REPAIR LOGIC =====

/**
 * Verifies the admin passwordHash stored in the database.
 *
 * Repair is triggered when ANY of the following is true:
 *   1. The row has no `passwordHash` (null / empty string).
 *   2. The stored value does not match the bcrypt hash format ($2a$/$2b$/$2y$).
 *   3. `bcrypt.compare(password, storedHash)` returns false — i.e. the hash
 *      was generated from a different password or is corrupted.
 *
 * When repair is needed the function calls `db.update` to replace the stored
 * hash with a freshly generated `bcrypt.hash(password, 12)`.
 *
 * @param db    — Drizzle db instance (or duck-typed mock for unit tests)
 * @param input — { email, password }
 * @returns     RepairResult
 */
export async function repairAdminHash(db: RepairDb, input: RepairInput): Promise<RepairResult> {
  const email = input.email.toLowerCase().trim();

  const rows = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const existing = (rows as Array<{ id: number; passwordHash: string | null }>)[0];

  if (!existing) {
    return { status: "not_found", email };
  }

  const storedHash = existing.passwordHash;

  // 1. Missing hash
  if (!storedHash) {
    const newHash = await bcrypt.hash(input.password, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, existing.id));
    return { status: "repaired", email, reason: "missing_hash" };
  }

  // 2. Invalid bcrypt format
  if (!isValidBcryptHash(storedHash)) {
    const newHash = await bcrypt.hash(input.password, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, existing.id));
    return { status: "repaired", email, reason: "invalid_hash_format" };
  }

  // 3. Hash does not match the supplied password
  const matches = await bcrypt.compare(input.password, storedHash);
  if (!matches) {
    const newHash = await bcrypt.hash(input.password, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, existing.id));
    return { status: "repaired", email, reason: "hash_mismatch" };
  }

  // Hash is valid and matches — nothing to do
  return { status: "ok", email };
}

// ===== ENTRY POINT =====

async function run(): Promise<void> {
  console.log("[repair-admin-hash] Starting admin hash verification...");

  let env: RepairEnv;
  try {
    env = validateRepairEnv();
  } catch (err: any) {
    console.error(`[repair-admin-hash] Configuration error: ${err.message}`);
    process.exit(1);
  }

  const normalizedEmail = env.email.toLowerCase().trim();
  console.log(`[repair-admin-hash] Target email: ${normalizedEmail}`);
  console.log("[repair-admin-hash] Connecting to database...");

  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(env.databaseUrl);
    const db = drizzle(connection) as unknown as RepairDb;

    const result = await repairAdminHash(db, { email: env.email, password: env.password });

    if (result.status === "not_found") {
      console.error(
        `[repair-admin-hash] ✗ Admin account not found for ${result.email}. Run provision-admin first.`,
      );
      process.exit(1);
    }

    if (result.status === "repaired") {
      console.log(
        `[repair-admin-hash] ✓ Hash repaired for ${result.email} (reason: ${result.reason})`,
      );
    } else {
      console.log(
        `[repair-admin-hash] ✓ Hash is valid and matches ADMIN_PASSWORD for ${result.email} — no change needed`,
      );
    }
  } catch (err: any) {
    // Log only the message — never log DATABASE_URL, password, or hash
    console.error(`[repair-admin-hash] Error: ${err.message}`);
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
const scriptPath = process.argv[1] ?? "";
if (
  scriptPath.endsWith("repair-admin-hash.ts") ||
  scriptPath.endsWith("repair-admin-hash.mjs")
) {
  run();
}
