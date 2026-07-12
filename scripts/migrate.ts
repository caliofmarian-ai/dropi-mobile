/**
 * DROPi Production Migration Runner
 *
 * Applies committed Drizzle migrations 0000–0013 using drizzle-orm's
 * programmatic API — does NOT invoke drizzle-kit generate.
 *
 * Drizzle maintains a `__drizzle_migrations` history table; already-applied
 * migrations are skipped automatically (idempotent).
 *
 * Exit codes:
 *   0 — all migrations applied (or already up to date)
 *   1 — DATABASE_URL missing, connection failure, or migration error
 *
 * Usage (compiled via pnpm build):
 *   node dist/migrate.mjs
 */

import "dotenv/config";
import path from "path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[migrate] FATAL: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  console.log(`[migrate] Migrations folder: ${migrationsFolder}`);
  console.log("[migrate] Connecting to database...");

  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(url);
    const db = drizzle(connection);

    console.log("[migrate] Applying committed migrations 0000–0013...");
    await migrate(db, { migrationsFolder });
    console.log("[migrate] ✓ All migrations applied successfully");
  } catch (err) {
    console.error("[migrate] FATAL: Migration failed:", err);
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignore cleanup errors — process is about to exit
      }
    }
  }
}

runMigrations();
