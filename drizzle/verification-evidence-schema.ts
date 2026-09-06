import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { dropiAccountMedia } from "./account-media-schema";
import { verifications } from "./schema";

/**
 * Ordered private evidence attached to one Delivery Partner verification.
 *
 * `verifications.documentUrl` remains a legacy compatibility pointer. New
 * submissions bind one to five DROPi-owned media objects here so front/back,
 * multiple pages and PDF evidence belong to one review decision.
 */
export const verificationEvidenceAttachments = mysqlTable(
  "verificationEvidenceAttachments",
  {
    id: int("id").autoincrement().primaryKey(),
    verificationId: int("verificationId")
      .notNull()
      .references(() => verifications.id, { onDelete: "cascade" }),
    mediaUid: varchar("mediaUid", { length: 36 })
      .notNull()
      .references(() => dropiAccountMedia.mediaUid, { onDelete: "restrict" }),
    label: mysqlEnum("label", ["front", "back", "page", "evidence"])
      .default("evidence")
      .notNull(),
    ordinal: int("ordinal").default(0).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    contentType: varchar("contentType", { length: 80 }).notNull(),
    byteLength: int("byteLength").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("verificationEvidence_verification_idx").on(table.verificationId, table.ordinal),
    uniqueIndex("verificationEvidence_media_uidx").on(table.mediaUid),
  ],
);

export type VerificationEvidenceAttachment = typeof verificationEvidenceAttachments.$inferSelect;
export type InsertVerificationEvidenceAttachment = typeof verificationEvidenceAttachments.$inferInsert;
