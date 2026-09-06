import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { verifications, users } from "../drizzle/schema";
import { dropiAccountMedia } from "../drizzle/account-media-schema";
import { verificationEvidenceAttachments } from "../drizzle/verification-evidence-schema";
import { getDb } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { maskEmail, sendPlatformEmail } from "./_core/mail";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import {
  hasCurrentOperationalPilotVerification,
  isOperationalPilotDocumentType,
} from "./user-verification-policy";
import {
  isOperationalPilotVerified,
  syncOperationalPilotVerification,
} from "./pilot-operational-verification";

const DOCUMENT_TYPES = [
  "driving_license",
  "drone_license",
  "vehicle_registration",
  "insurance",
  "background_check",
  "other",
] as const;
const EVIDENCE_LABELS = ["front", "back", "page", "evidence"] as const;
const MAX_EVIDENCE_ATTACHMENTS = 5;

const evidenceSchema = z.object({
  mediaUid: z.string().uuid(),
  label: z.enum(EVIDENCE_LABELS).default("evidence"),
});

function verificationMediaUrl(mediaUid: string, sha256: string): string {
  return `/api/dropi-media/verification/${mediaUid}/${sha256}`;
}

// ===== VERIFICATION ROUTER (Delivery Partner Documents) =====
export const verificationRouter = router({
  // Upload one private evidence object. A verification submission may later bind
  // one to five of these objects into one governed review decision.
  uploadDocument: protectedProcedure
    .input(z.object({
      fileName: z.string().min(1).max(255),
      fileBase64: z.string().min(1),
      contentType: z.string().default("application/octet-stream"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const buffer = Buffer.from(input.fileBase64, "base64");
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 10MB per attachment.");
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(input.contentType)) {
        throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, PDF");
      }

      const storagePath = `verifications/user_${userId}/${Date.now()}_${input.fileName}`;
      const { key, url } = await storagePut(storagePath, buffer, input.contentType);
      console.log(`[UPLOAD] User ${userId} uploaded private verification evidence: ${key}`);
      return { mediaUid: key, key, url, fileName: input.fileName, contentType: input.contentType, byteLength: buffer.length };
    }),

  submit: protectedProcedure
    .input(z.object({
      documentType: z.enum(DOCUMENT_TYPES),
      // Legacy compatibility for already-installed clients. New clients bind
      // DROPi-owned media through `evidence` instead of trusting an arbitrary URL.
      documentUrl: z.string().max(500).optional(),
      evidence: z.array(evidenceSchema).min(1).max(MAX_EVIDENCE_ATTACHMENTS).optional(),
      licenseNumber: z.string().min(1).max(100),
      expiryDate: z.string().optional(),
      vehicleType: z.enum(["drone", "car", "van", "ebike", "motorcycle"]).optional(),
      notes: z.string().max(2000).optional(),
    }).superRefine((input, ctx) => {
      if (!input.documentUrl && (!input.evidence || input.evidence.length === 0)) {
        ctx.addIssue({ code: "custom", message: "At least one verification evidence attachment is required" });
      }
      if (input.evidence) {
        const uids = input.evidence.map((item) => item.mediaUid);
        if (new Set(uids).size !== uids.length) {
          ctx.addIssue({ code: "custom", message: "The same evidence file cannot be attached twice" });
        }
      }
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user!.id;

      if ((ctx.user as any).dropiRole !== "delivery_partner") {
        throw new Error("Only delivery partners can submit verifications");
      }

      const existing = await db.select().from(verifications)
        .where(and(
          eq(verifications.userId, userId),
          eq(verifications.documentType, input.documentType),
          eq(verifications.status, "pending"),
        ));

      if (existing.length > 0) {
        throw new Error("You already have a pending verification for this document type");
      }

      const requestedEvidence = input.evidence || [];
      const mediaUids = requestedEvidence.map((item) => item.mediaUid);
      const mediaRows = mediaUids.length > 0
        ? await db
          .select({
            mediaUid: dropiAccountMedia.mediaUid,
            ownerId: dropiAccountMedia.ownerId,
            purpose: dropiAccountMedia.purpose,
            fileName: dropiAccountMedia.fileName,
            contentType: dropiAccountMedia.contentType,
            byteLength: dropiAccountMedia.byteLength,
            sha256: dropiAccountMedia.sha256,
          })
          .from(dropiAccountMedia)
          .where(and(
            eq(dropiAccountMedia.ownerId, userId),
            eq(dropiAccountMedia.purpose, "verification_document"),
            inArray(dropiAccountMedia.mediaUid, mediaUids),
          ))
        : [];

      if (mediaRows.length !== mediaUids.length) {
        throw new Error("One or more evidence attachments are unavailable or do not belong to this account");
      }

      const mediaByUid = new Map(mediaRows.map((row) => [row.mediaUid, row]));
      const attachmentValues = requestedEvidence.map((requested, ordinal) => {
        const media = mediaByUid.get(requested.mediaUid);
        if (!media) throw new Error("Verification evidence binding failed");
        return {
          verificationId: 0,
          mediaUid: media.mediaUid,
          label: requested.label,
          ordinal,
          fileName: media.fileName,
          contentType: media.contentType,
          byteLength: media.byteLength,
          sha256: media.sha256,
        };
      });
      const firstMedia = requestedEvidence.length > 0
        ? mediaByUid.get(requestedEvidence[0].mediaUid)
        : null;
      const compatibilityUrl = firstMedia
        ? verificationMediaUrl(firstMedia.mediaUid, firstMedia.sha256)
        : (input.documentUrl || null);

      const verificationId = await db.transaction(async (tx) => {
        const [result] = await tx.insert(verifications).values({
          userId,
          documentType: input.documentType,
          documentUrl: compatibilityUrl,
          licenseNumber: input.licenseNumber,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          vehicleType: input.vehicleType || null,
          notes: input.notes || null,
        });
        const insertedId = Number(result.insertId);

        if (attachmentValues.length > 0) {
          await tx.insert(verificationEvidenceAttachments).values(
            attachmentValues.map((value) => ({ ...value, verificationId: insertedId })),
          );
        }
        return insertedId;
      });

      return {
        success: true,
        verificationId,
        attachmentCount: attachmentValues.length || (input.documentUrl ? 1 : 0),
      };
    }),

  myVerifications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(verifications)
      .where(eq(verifications.userId, ctx.user!.id))
      .orderBy(desc(verifications.createdAt));
    if (rows.length === 0) return [];

    const evidence = await db
      .select({
        verificationId: verificationEvidenceAttachments.verificationId,
        label: verificationEvidenceAttachments.label,
        ordinal: verificationEvidenceAttachments.ordinal,
        fileName: verificationEvidenceAttachments.fileName,
        contentType: verificationEvidenceAttachments.contentType,
      })
      .from(verificationEvidenceAttachments)
      .where(inArray(verificationEvidenceAttachments.verificationId, rows.map((row) => row.id)))
      .orderBy(verificationEvidenceAttachments.verificationId, verificationEvidenceAttachments.ordinal);
    const byVerification = new Map<number, typeof evidence>();
    for (const item of evidence) {
      const list = byVerification.get(item.verificationId) || [];
      list.push(item);
      byVerification.set(item.verificationId, list);
    }

    return rows.map((row) => {
      const attachments = byVerification.get(row.id) || [];
      return {
        ...row,
        attachmentCount: attachments.length || (row.documentUrl ? 1 : 0),
        attachments,
        evidenceModel: attachments.length > 0 ? "multi_attachment" as const : "legacy_single_url" as const,
      };
    });
  }),

  myStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        isVerified: false,
        isFullyVerified: false,
        hasPending: false,
        totalSubmitted: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
      };
    }

    const userId = ctx.user!.id;
    const results = await db.select().from(verifications)
      .where(eq(verifications.userId, userId));
    const operationallyVerified = hasCurrentOperationalPilotVerification(results as any[]);

    await syncOperationalPilotVerification(userId);

    return {
      isVerified: operationallyVerified,
      isFullyVerified: operationallyVerified,
      hasPending: results.some((v: any) => v.status === "pending"),
      totalSubmitted: results.length,
      approved: results.filter((v: any) => v.status === "approved").length,
      rejected: results.filter((v: any) => v.status === "rejected").length,
      pending: results.filter((v: any) => v.status === "pending").length,
    };
  }),

  listPending: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const filters = input || { limit: 50, offset: 0 };
      const statusFilter = filters.status || "pending";

      return db.select({
        verification: verifications,
        userName: users.name,
        userEmail: users.email,
      })
        .from(verifications)
        .leftJoin(users, eq(verifications.userId, users.id))
        .where(eq(verifications.status, statusFilter))
        .orderBy(desc(verifications.createdAt))
        .limit(filters.limit)
        .offset(filters.offset);
    }),

  review: adminProcedure
    .input(z.object({
      verificationId: z.number(),
      decision: z.enum(["approved", "rejected"]),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const adminId = ctx.user!.id;

      const [verification]: any[] = await db.select().from(verifications)
        .where(eq(verifications.id, input.verificationId));
      if (!verification) throw new Error("Verification not found");

      const wasOperationallyVerified = await isOperationalPilotVerified(verification.userId);

      await db.update(verifications)
        .set({
          status: input.decision,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: input.decision === "rejected" ? (input.rejectionReason || null) : null,
        })
        .where(eq(verifications.id, input.verificationId));

      const operationallyVerified = await syncOperationalPilotVerification(verification.userId);
      const becameOperationallyVerified = !wasOperationallyVerified && operationallyVerified;
      const lostOperationalVerification = wasOperationallyVerified && !operationallyVerified;
      const qualifyingDocument = isOperationalPilotDocumentType(verification.documentType);

      if (input.decision === "approved") {
        try {
          const { sendPushToUser } = await import("./push-notifications");
          if (becameOperationallyVerified) {
            await sendPushToUser(verification.userId, {
              title: "✅ Account Verified!",
              body: "A valid driving or drone license is approved. You can now accept delivery missions on DROPi!",
              data: { type: "verification_approved", screen: "/(tabs)" },
              channelId: "verification",
            });
          } else if (!operationallyVerified) {
            await sendPushToUser(verification.userId, {
              title: "✅ Document Approved",
              body: "Your document was approved. Mission access still requires an approved, unexpired driving or drone license.",
              data: { type: "verification_document_approved", screen: "/verify-documents" },
              channelId: "verification",
            });
          }
        } catch (pushErr) {
          console.warn("[PUSH] Failed to send verification approval push:", pushErr);
        }

        try {
          const { createInAppNotification } = await import("./create-notification");
          if (becameOperationallyVerified) {
            await createInAppNotification({
              userId: verification.userId,
              title: "\u2705 Cont Verificat!",
              body: "Un permis auto sau o licen\u021b\u0103 de dron\u0103 valid\u0103 a fost aprobat\u0103. Po\u021bi accepta misiuni de livrare pe DROPi!",
              category: "verification",
              metadata: { verificationId: verification.id, decision: "approved", operationallyVerified: true },
            });
          } else if (!operationallyVerified) {
            await createInAppNotification({
              userId: verification.userId,
              title: "\u2705 Document Aprobat",
              body: "Documentul a fost aprobat, dar accesul la misiuni necesit\u0103 un permis auto sau o licen\u021b\u0103 de dron\u0103 aprobat\u0103 \u0219i neexpirat\u0103.",
              category: "verification",
              metadata: { verificationId: verification.id, decision: "approved", operationallyVerified: false },
            });
          }
        } catch (e) { /* silent */ }
      }

      const [user]: any[] = await db.select().from(users)
        .where(eq(users.id, verification.userId));

      if (user?.email) {
        const subject = input.decision === "approved"
          ? "✅ DROPi Verification Approved"
          : "❌ DROPi Verification Update";

        let body: string;
        if (input.decision === "approved" && operationallyVerified) {
          body = `<h2>Document approved</h2><p>Your ${verification.documentType.replace(/_/g, " ")} verification has been approved.</p><p>Your account currently meets DROPi operational pilot verification requirements because an approved, unexpired driving or drone license is on record.</p>`;
        } else if (input.decision === "approved") {
          body = `<h2>Document approved</h2><p>Your ${verification.documentType.replace(/_/g, " ")} verification has been approved.</p><p>This document does not by itself grant mission access. An approved, unexpired driving or drone license is still required.</p>`;
        } else {
          body = `<h2>Verification Update</h2><p>Your ${verification.documentType.replace(/_/g, " ")} verification was not approved.</p><p><strong>Reason:</strong> ${input.rejectionReason || "Not specified"}</p><p>Please submit updated documents to try again.</p>`;
          if (lostOperationalVerification) {
            body += `<p><strong>Operational access is now paused</strong> because no other approved, unexpired driving or drone license remains on record.</p>`;
          }
        }

        const sent = await sendPlatformEmail({
          to: user.email,
          subject,
          logLabel: "verification decision email",
          html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">${body}<hr><p style="color:#888;font-size:12px;">DROPi Logistics Platform</p></div>`,
        });
        if (!sent) {
          console.warn(`[SMTP] Verification decision notification not delivered to ${maskEmail(user.email)}`);
        }
      }

      if (input.decision === "rejected") {
        try {
          const { sendPushToUser } = await import("./push-notifications");
          const docType = verification.documentType.replace(/_/g, " ");
          const operationalNotice = lostOperationalVerification
            ? " Operational mission access is paused until another valid driving or drone license is approved."
            : "";
          await sendPushToUser(verification.userId, {
            title: "❌ Document Verification Update",
            body: `Your ${docType} verification was not approved. Reason: ${input.rejectionReason || "Not specified"}.${operationalNotice}`,
            data: { type: "verification_rejected", screen: "/verify-documents" },
            channelId: "verification",
          });
        } catch (pushErr) {
          console.warn("[PUSH] Failed to send verification rejection push:", pushErr);
        }

        try {
          const { createInAppNotification } = await import("./create-notification");
          const docType = verification.documentType.replace(/_/g, " ");
          await createInAppNotification({
            userId: verification.userId,
            title: "\u274c Verification Respins\u0103",
            body: `Documentul ${docType} nu a fost aprobat. Motiv: ${input.rejectionReason || "Nespecificat"}.${lostOperationalVerification ? " Accesul la misiuni este suspendat p\u00e2n\u0103 la aprobarea unei alte licen\u021be valide." : ""}`,
            category: "verification",
            metadata: {
              verificationId: verification.id,
              decision: "rejected",
              reason: input.rejectionReason,
              operationallyVerified,
            },
          });
        } catch (e) { /* silent */ }
      }

      try {
        await notifyOwner({
          title: `Verification ${input.decision === "approved" ? "Approved" : "Rejected"}`,
          content: `Admin (ID: ${adminId}) ${input.decision} verification #${input.verificationId} for user ${user?.name || user?.email || verification.userId}. Document type: ${verification.documentType.replace(/_/g, " ")}. Qualifying operational document: ${qualifyingDocument}. Operationally verified after review: ${operationallyVerified}.${input.decision === "rejected" ? " Reason: " + (input.rejectionReason || "Not specified") : ""}`,
        });
      } catch (notifErr) {
        console.warn("[NOTIFICATION] Failed to send push notification:", notifErr);
      }

      return { success: true, decision: input.decision, operationallyVerified };
    }),
});
