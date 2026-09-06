import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { dropiAccountMedia } from "../drizzle/account-media-schema";
import { verificationEvidenceAttachments } from "../drizzle/verification-evidence-schema";
import { verifications } from "../drizzle/schema";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const DROPi_VERIFICATION_MEDIA_RE = /^\/api\/dropi-media\/verification\/([0-9a-f-]{36})\/([0-9a-f]{64})$/i;

type EvidencePayload = {
  id: number | null;
  label: "front" | "back" | "page" | "evidence";
  ordinal: number;
  mediaUid: string;
  fileName: string;
  contentType: string;
  byteLength: number;
  sha256: string;
  dataBase64: string;
};

function assertMediaIntegrity(input: {
  expectedOwnerId: number;
  media: {
    ownerId: number | null;
    purpose: string;
    fileName: string;
    contentType: string;
    byteLength: number;
    sha256: string;
    dataBase64: string;
  };
  expected?: {
    fileName: string;
    contentType: string;
    byteLength: number;
    sha256: string;
  };
}) {
  const { media, expectedOwnerId, expected } = input;
  if (media.ownerId !== expectedOwnerId || media.purpose !== "verification_document") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Verification evidence is unavailable" });
  }
  if (expected && (
    media.fileName !== expected.fileName ||
    media.contentType !== expected.contentType ||
    media.byteLength !== expected.byteLength ||
    media.sha256 !== expected.sha256
  )) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Verification evidence metadata integrity check failed" });
  }

  const buffer = Buffer.from(media.dataBase64, "base64");
  const actualHash = createHash("sha256").update(buffer).digest("hex");
  if (buffer.length !== media.byteLength || actualHash !== media.sha256) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Verification evidence integrity check failed" });
  }
}

/**
 * Admin-only evidence reader used by the Approval Panel.
 *
 * Multi-attachment evidence is returned only after owner binding, immutable
 * attachment metadata, byte length and SHA-256 integrity are verified for every
 * object. Legacy single-URL records remain explicitly readable.
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

      const attachmentRows = await db
        .select()
        .from(verificationEvidenceAttachments)
        .where(eq(verificationEvidenceAttachments.verificationId, verification.id))
        .orderBy(verificationEvidenceAttachments.ordinal);

      if (attachmentRows.length > 0) {
        const mediaRows = await db
          .select({
            mediaUid: dropiAccountMedia.mediaUid,
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
            eq(dropiAccountMedia.ownerId, verification.userId),
            eq(dropiAccountMedia.purpose, "verification_document"),
            inArray(dropiAccountMedia.mediaUid, attachmentRows.map((row) => row.mediaUid)),
          ));
        const mediaByUid = new Map(mediaRows.map((row) => [row.mediaUid, row]));

        const attachments: EvidencePayload[] = attachmentRows.map((attachment) => {
          const media = mediaByUid.get(attachment.mediaUid);
          if (!media) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Verification evidence attachment is unavailable" });
          }
          assertMediaIntegrity({
            expectedOwnerId: verification.userId,
            media,
            expected: {
              fileName: attachment.fileName,
              contentType: attachment.contentType,
              byteLength: attachment.byteLength,
              sha256: attachment.sha256,
            },
          });
          return {
            id: attachment.id,
            label: attachment.label,
            ordinal: attachment.ordinal,
            mediaUid: attachment.mediaUid,
            fileName: media.fileName,
            contentType: media.contentType,
            byteLength: media.byteLength,
            sha256: media.sha256,
            dataBase64: media.dataBase64,
          };
        });
        const first = attachments[0];

        return {
          storage: "dropi" as const,
          evidenceModel: "multi_attachment" as const,
          documentType: verification.documentType,
          status: verification.status,
          attachmentCount: attachments.length,
          attachments,
          // Top-level first attachment is retained for older Approval Panel OTA
          // clients while the new panel consumes the full `attachments` array.
          fileName: first.fileName,
          contentType: first.contentType,
          byteLength: first.byteLength,
          sha256: first.sha256,
          dataBase64: first.dataBase64,
        };
      }

      if (!verification.documentUrl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Verification has no uploaded evidence" });
      }

      const match = verification.documentUrl.match(DROPi_VERIFICATION_MEDIA_RE);
      if (!match) {
        return {
          storage: "legacy" as const,
          evidenceModel: "legacy_single_url" as const,
          legacyUrl: verification.documentUrl,
          documentType: verification.documentType,
          status: verification.status,
          attachmentCount: 1,
          attachments: [],
          message: "Legacy evidence was not migrated into DROPi-owned storage. Re-upload is required if the historical provider is unavailable.",
        };
      }

      const mediaUid = match[1];
      const expectedHash = match[2].toLowerCase();
      const [media] = await db
        .select({
          mediaUid: dropiAccountMedia.mediaUid,
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
      assertMediaIntegrity({ expectedOwnerId: verification.userId, media });

      const attachment: EvidencePayload = {
        id: null,
        label: "evidence",
        ordinal: 0,
        mediaUid: media.mediaUid,
        fileName: media.fileName,
        contentType: media.contentType,
        byteLength: media.byteLength,
        sha256: media.sha256,
        dataBase64: media.dataBase64,
      };

      return {
        storage: "dropi" as const,
        evidenceModel: "legacy_single_url" as const,
        documentType: verification.documentType,
        status: verification.status,
        attachmentCount: 1,
        attachments: [attachment],
        fileName: media.fileName,
        contentType: media.contentType,
        byteLength: media.byteLength,
        sha256: media.sha256,
        dataBase64: media.dataBase64,
      };
    }),
});
