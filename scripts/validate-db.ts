/**
 * DROPi Post-Migration Database Validator
 *
 * Verifies that all 26 expected application tables exist, Drizzle's migration
 * history table records all committed migrations (count derived from
 * drizzle/meta/_journal.json — no manual update needed when new migrations land),
 * and the users table is accessible. Reports users count informational-only;
 * a non-zero count is not a failure (legitimate users may exist in production).
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — DATABASE_URL missing, connection error, or any validation failure
 *
 * Usage (compiled via pnpm build):
 *   node dist/validate-db.mjs
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
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
  "operationalEvidenceEvents",
  "flightTelemetrySamples",
  "deliveryProofs",
  "deliveryProofAttestations",
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

/**
 * Derive the expected migration count from drizzle/meta/_journal.json so that
 * adding future committed migrations never requires editing this file.
 */
function loadExpectedMigrationCount(): number {
  const journalPath = path.resolve(process.cwd(), "drizzle", "meta", "_journal.json");
  try {
    const journal = JSON.parse(fs.readFileSync(journalPath, "utf8")) as {
      entries?: unknown[];
    };
    const count = Array.isArray(journal.entries) ? journal.entries.length : 0;
    if (count === 0) {
      throw new Error("_journal.json has no entries — file may be corrupt or empty");
    }
    return count;
  } catch (err) {
    console.error(`[validate-db] FATAL: Cannot read ${journalPath}:`, err);
    process.exit(1);
  }
}

async function validateDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[validate-db] FATAL: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const EXPECTED_MIGRATION_COUNT = loadExpectedMigrationCount();
  console.log(`[validate-db] Expected migrations from _journal.json: ${EXPECTED_MIGRATION_COUNT}`);

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

    // --- 4. Verify Drizzle migration history table exists and has the expected number of entries --
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

    // --- 5. Report users count (informational only — non-zero count is not a failure) --
    if (existingTables.has("users")) {
      const [userRows] = await connection.execute(
        "SELECT COUNT(*) AS cnt FROM `users`"
      );
      const userCount = Number((userRows as Record<string, unknown>[])[0].cnt);
      console.log(
        `[validate-db] ✓ users count: ${userCount} (informational — seed script never runs automatically)`
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
