import { index, int, longtext, mysqlEnum, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * DROPi-owned account media persistence.
 *
 * This table is deliberately separate from P2P listing media. Profile images
 * and delivery-partner verification evidence have different access policies,
 * but both persist in the canonical Railway MySQL database so production
 * uploads do not depend on Manus/Forge or an ephemeral local filesystem.
 */
export const dropiAccountMedia = mysqlTable("dropiAccountMedia", {
  id: int("id").autoincrement().primaryKey(),
  mediaUid: varchar("mediaUid", { length: 36 }).notNull().unique(),
  ownerId: int("ownerId"),
  purpose: mysqlEnum("purpose", [
    "profile_photo",
    "verification_document",
    "generated_asset",
    "private_asset",
  ]).notNull(),
  sourceKey: varchar("sourceKey", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 80 }).notNull(),
  byteLength: int("byteLength").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  dataBase64: longtext("dataBase64").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("dropiAccountMedia_owner_idx").on(table.ownerId, table.createdAt),
  index("dropiAccountMedia_purpose_idx").on(table.purpose, table.createdAt),
]);

export type DropiAccountMedia = typeof dropiAccountMedia.$inferSelect;
export type InsertDropiAccountMedia = typeof dropiAccountMedia.$inferInsert;
