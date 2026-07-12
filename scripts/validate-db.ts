/**
 * DROPi Post-Migration Database Validator
 *
 * Verifies that all 26 expected application tables exist, Drizzle's migration
 * history table records all 14 committed migrations, and the users table is
 * accessible. Reports users count (informational — proves no seed data was
 * inserted on an empty production database).
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — DATABASE_URL missing, connection error, or any validation failure
 *
 * Usage (compiled via pnpm build):
 *   node dist/validate-db.mjs
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const EXPECTED_TABLES: readonly string[] = [
  "agentReports",
  "agentState",
  "agentTasks",
  "apiKeys",
  "apiRequestLogs",
  "auditLogs",
  "b2bDeliveries",
  "deliveries",
  "deliveryBadges",
  "inAppNotifications",
  "notificationPreferences",
  "orders",
  "pilotProfiles",
  "pilotRatingHistory",
  "productReviews",
  "products",
  "pushTokens",
  "roleApplications",
  "sellerBadges",
  "sessions",
  "storeAnalytics",
  "stores",
  "users",
  "verifications",
  "webhookEndpoints",
  "webhookLogs",
] as const;

/** Drizzle ORM MySQL migration-history table (created automatically). */
const MIGRATION_HISTORY_TABLE = "__drizzle_migrations";

/** Number of committed migrations (0000–0013). Update when new migrations land. */
const EXPECTED_MIGRATION_COUNT = 14;

async function validateDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[validate-db] FATAL: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("[validate-db] Connecting to database for post-migration validation...");
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(url);

    // --- 1. Fetch all existing tables -----------------------------------------
    const [tableRows] = await connection.execute("SHOW TABLES");
    const existingTables = new Set<string>(
      (tableRows as Record<string, string>[]).map((row) => Object.values(row)[0])
    );

    let failed = false;

    // --- 2. Verify all 26 application tables exist ----------------------------
    const missingTables = EXPECTED_TABLES.filter((t) => !existingTables.has(t));
    if (missingTables.length > 0) {
      console.error(`[validate-db] ✗ MISSING TABLES (${missingTables.length}): ${missingTables.join(", ")}`);
      failed = true;
    } else {
      console.log(`[validate-db] ✓ All ${EXPECTED_TABLES.length} application tables present`);
    }

    // --- 3. Verify users table specifically ------------------------------------
    if (existingTables.has("users")) {
      console.log("[validate-db] ✓ users table exists");
    } else {
      console.error("[validate-db] ✗ MISSING: users table");
      failed = true;
    }

    // --- 4. Verify Drizzle migration history table exists and has 14 entries --
    if (!existingTables.has(MIGRATION_HISTORY_TABLE)) {
      console.error(`[validate-db] ✗ MISSING: ${MIGRATION_HISTORY_TABLE} table`);
      failed = true;
    } else {
      const [migRows] = await connection.execute(
        `SELECT COUNT(*) AS cnt FROM \`${MIGRATION_HISTORY_TABLE}\``
      );
      const count = Number((migRows as Record<string, unknown>[])[0].cnt);
      if (count !== EXPECTED_MIGRATION_COUNT) {
        console.error(
          `[validate-db] ✗ Migration count mismatch: expected ${EXPECTED_MIGRATION_COUNT}, got ${count}`
        );
        failed = true;
      } else {
        console.log(
          `[validate-db] ✓ Migration history: ${count}/${EXPECTED_MIGRATION_COUNT} entries recorded`
        );
      }
    }

    // --- 5. Report users count (informational — proves no seed data inserted) --
    if (existingTables.has("users")) {
      const [userRows] = await connection.execute(
        "SELECT COUNT(*) AS cnt FROM `users`"
      );
      const userCount = Number((userRows as Record<string, unknown>[])[0].cnt);
      console.log(
        `[validate-db] ✓ users count: ${userCount} (expected 0 on fresh deployment, seed script never runs automatically)`
      );
    }

    if (failed) {
      console.error("[validate-db] ✗ Post-migration validation FAILED — stopping startup");
      process.exit(1);
    }

    console.log("[validate-db] ✓ Post-migration validation PASSED");
  } catch (err) {
    console.error("[validate-db] FATAL: Validation error:", err);
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

validateDatabase();
