import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { dropiAccountMedia } from "../drizzle/account-media-schema";
import { verifications } from "../drizzle/schema";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const DROPi_VERIFICATION_MEDIA_RE = /^\/api\/dropi-media\/verification\/([0-9a-f-]{36})\/([0-9a-f]{64})$/i;

/**
 * Admin-only evidence reader used by the Approval Panel.
 *
 * New DROPi-owned media is returned only after owner binding, byte length and
 * SHA-256 integrity are verified. Legacy Forge URLs are identified explicitly
 * instead of being silently rewritten or treated as migrated evidence.
 */
export const verificationMediaRouter = router({
  getByVerificationId: adminProcedure
    .input(z.object({ verificationId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [verification] = await db
        .select({
          id: verifications.id,
          userId: verifications.userId,
          documentUrl: verifications.documentUrl,
          documentType: verifications.documentType,
          status: verifications.status,
        })
        .from(verifications)
        .where(eq(verifications.id, input.verificationId))
        .limit(1);

      if (!verification) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Verification not found" });
      }
      if (!verification.documentUrl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Verification has no uploaded evidence" });
      }

      const match = verification.documentUrl.match(DROPi_VERIFICATION_MEDIA_RE);
      if (!match) {
        return {
          storage: "legacy" as const,
          legacyUrl: verification.documentUrl,
          documentType: verification.documentType,
          status: verification.status,
          message: "Legacy evidence was not migrated into DROPi-owned storage. Re-upload is required if the historical provider is unavailable.",
        };
      }

      const mediaUid = match[1];
      const expectedHash = match[2].toLowerCase();
      const [media] = await db
        .select({
          ownerId: dropiAccountMedia.ownerId,
          purpose: dropiAccountMedia.purpose,
          fileName: dropiAccountMedia.fileName,
          contentType: dropiAccountMedia.contentType,
          byteLength: dropiAccountMedia.byteLength,
          sha256: dropiAccountMedia.sha256,
          dataBase64: dropiAccountMedia.dataBase64,
        })
        .from(dropiAccountMedia)
        .where(and(
          eq(dropiAccountMedia.mediaUid, mediaUid),
          eq(dropiAccountMedia.purpose, "verification_document"),
          eq(dropiAccountMedia.ownerId, verification.userId),
        ))
        .limit(1);

      if (!media || media.sha256 !== expectedHash) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Verification evidence is unavailable" });
      }

      const buffer = Buffer.from(media.dataBase64, "base64");
      const actualHash = createHash("sha256").update(buffer).digest("hex");
      if (buffer.length !== media.byteLength || actualHash !== media.sha256) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Verification evidence integrity check failed" });
      }

      return {
        storage: "dropi" as const,
        documentType: verification.documentType,
        status: verification.status,
        fileName: media.fileName,
        contentType: media.contentType,
        byteLength: media.byteLength,
        sha256: media.sha256,
        dataBase64: media.dataBase64,
      };
    }),
});
