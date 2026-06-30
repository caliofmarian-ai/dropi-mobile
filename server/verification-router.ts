import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { verifications, roleApplications, users } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";

// SMTP transporter for notifications
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dropi.deliveries@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD || "",
  },
});

// Roles that require admin approval (operational/supervisory)
const ROLES_REQUIRING_APPROVAL = [
  "operations_manager", "logistics_coordinator", "fleet_manager",
  "c2_compliance_officer", "c2_performance_monitor", "c2_incident_responder",
  "data_analyst", "quality_assurance",
  "emergency_coordinator", "dispatch_manager", "resource_allocator",
  "communication_officer", "c3_data_analyst", "incident_commander",
  "system_administrator", "security_officer", "audit_manager",
  "configuration_manager", "analytics_manager", "support_coordinator",
] as const;

// ===== VERIFICATION ROUTER (Delivery Partner Documents) =====
export const verificationRouter = router({
  // Upload a document file to S3 storage
  uploadDocument: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileBase64: z.string(), // base64-encoded file content
      contentType: z.string().default("application/octet-stream"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      // Validate file size (max 10MB after base64 decode)
      const buffer = Buffer.from(input.fileBase64, "base64");
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 10MB.");
      }

      // Validate content type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(input.contentType)) {
        throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, PDF");
      }

      // Upload to S3 via storage helper
      const ext = input.fileName.split(".").pop() || "bin";
      const storagePath = `verifications/user_${userId}/${Date.now()}_${input.fileName}`;
      const { key, url } = await storagePut(storagePath, buffer, input.contentType);

      console.log(`[UPLOAD] User ${userId} uploaded document: ${key}`);
      return { key, url, fileName: input.fileName };
    }),

  // Submit a new verification document
  submit: protectedProcedure
    .input(z.object({
      documentType: z.enum(["driving_license", "drone_license", "vehicle_registration", "insurance", "background_check", "other"]),
      documentUrl: z.string().optional(),
      licenseNumber: z.string().min(1).max(100),
      expiryDate: z.string().optional(),
      vehicleType: z.enum(["drone", "car", "van", "ebike", "motorcycle"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user!.id;

      // Check if user is a delivery partner
      if ((ctx.user as any).dropiRole !== "delivery_partner") {
        throw new Error("Only delivery partners can submit verifications");
      }

      // Check for existing pending verification of same type
      const existing = await db.select().from(verifications)
        .where(and(
          eq(verifications.userId, userId),
          eq(verifications.documentType, input.documentType),
          eq(verifications.status, "pending")
        ));

      if (existing.length > 0) {
        throw new Error("You already have a pending verification for this document type");
      }

      const [result] = await db.insert(verifications).values({
        userId,
        documentType: input.documentType,
        documentUrl: input.documentUrl || null,
        licenseNumber: input.licenseNumber,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        vehicleType: input.vehicleType || null,
        notes: input.notes || null,
      });

      return { success: true, verificationId: result.insertId };
    }),

  // Get my verifications (for delivery partner)
  myVerifications: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user!.id;
      const results = await db.select().from(verifications)
        .where(eq(verifications.userId, userId))
        .orderBy(desc(verifications.createdAt));
      return results;
    }),

  // Get verification status summary
  myStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { isVerified: false, isFullyVerified: false, hasPending: false, totalSubmitted: 0, approved: 0, rejected: 0, pending: 0 };
      const userId = ctx.user!.id;
      const results = await db.select().from(verifications)
        .where(eq(verifications.userId, userId));

      const hasApproved = results.some((v: any) => v.status === "approved");
      const hasPending = results.some((v: any) => v.status === "pending");
      // Fully verified = at least one license (driving or drone) is approved
      const hasLicenseApproved = results.some((v: any) => 
        v.status === "approved" && (v.documentType === "driving_license" || v.documentType === "drone_license")
      );

      return {
        isVerified: hasApproved,
        isFullyVerified: hasLicenseApproved,
        hasPending,
        totalSubmitted: results.length,
        approved: results.filter((v: any) => v.status === "approved").length,
        rejected: results.filter((v: any) => v.status === "rejected").length,
        pending: results.filter((v: any) => v.status === "pending").length,
      };
    }),

  // ===== ADMIN: List all pending verifications =====
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

      const results = await db.select({
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

      return results;
    }),

  // ===== ADMIN: Review a verification (approve/reject) =====
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

      // Update verification status
      await db.update(verifications)
        .set({
          status: input.decision,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: input.decision === "rejected" ? (input.rejectionReason || null) : null,
        })
        .where(eq(verifications.id, input.verificationId));

      // Get the verification to find the user
      const [verification]: any[] = await db.select().from(verifications)
        .where(eq(verifications.id, input.verificationId));

      if (!verification) throw new Error("Verification not found");

      // If approved, check if user has at least one approved verification
      if (input.decision === "approved") {
        const approvedCount: any[] = await db.select({ count: sql<number>`count(*)` })
          .from(verifications)
          .where(and(
            eq(verifications.userId, verification.userId),
            eq(verifications.status, "approved")
          ));

        // User is now verified if they have at least one approved document
        if (approvedCount[0]?.count && approvedCount[0].count >= 1) {
          // Sprint 6A: Actually set isVerified=true so pilot can accept missions
          await db.update(users)
            .set({ isVerified: true })
            .where(eq(users.id, verification.userId));
          console.log(`[VERIFICATION] User ${verification.userId} is now VERIFIED (isVerified=true)`);

          // Sprint 6A+: Send push notification to pilot
          try {
            const { sendPushToUser } = await import("./push-notifications");
            await sendPushToUser(verification.userId, {
              title: "✅ Account Verified!",
              body: "Your documents have been approved. You can now accept delivery missions on DROPi!",
              data: { type: "verification_approved", screen: "/(tabs)" },
              channelId: "verification",
            });
          } catch (pushErr) {
            console.warn("[PUSH] Failed to send verification push:", pushErr);
          }

          // Create in-app notification
          try {
            const { createInAppNotification } = await import("./create-notification");
            await createInAppNotification({
              userId: verification.userId,
              title: "\u2705 Cont Verificat!",
              body: "Documentele tale au fost aprobate. Po\u021bi accepta misiuni de livrare pe DROPi!",
              category: "verification",
              metadata: { verificationId: verification.id, decision: "approved" },
            });
          } catch (e) { /* silent */ }
        }
      }

      // Send email notification to user
      const [user]: any[] = await db.select().from(users)
        .where(eq(users.id, verification.userId));

      if (user?.email) {
        const subject = input.decision === "approved"
          ? "✅ DROPi Verification Approved"
          : "❌ DROPi Verification Update";

        const body = input.decision === "approved"
          ? `<h2>Congratulations!</h2><p>Your ${verification.documentType.replace(/_/g, " ")} verification has been approved. You can now receive delivery missions on DROPi.</p>`
          : `<h2>Verification Update</h2><p>Your ${verification.documentType.replace(/_/g, " ")} verification was not approved.</p><p><strong>Reason:</strong> ${input.rejectionReason || "Not specified"}</p><p>Please submit updated documents to try again.</p>`;

        try {
          await transporter.sendMail({
            from: '"DROPi Platform" <dropi.deliveries@gmail.com>',
            to: user.email,
            subject,
            html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">${body}<hr><p style="color:#888;font-size:12px;">DROPi Logistics Platform</p></div>`,
          });
        } catch (err) {
          console.error("[SMTP] Failed to send verification notification:", err);
        }
      }

      // Sprint 6A+: Send push notification on verification rejection
      if (input.decision === "rejected") {
        try {
          const { sendPushToUser } = await import("./push-notifications");
          const docType = verification.documentType.replace(/_/g, " ");
          await sendPushToUser(verification.userId, {
            title: "❌ Document Verification Update",
            body: `Your ${docType} verification was not approved. Reason: ${input.rejectionReason || "Not specified"}. Please submit updated documents.`,
            data: { type: "verification_rejected", screen: "/verification/submit" },
            channelId: "verification",
          });
        } catch (pushErr) {
          console.warn("[PUSH] Failed to send verification rejection push:", pushErr);
        }

        // Create in-app notification for rejection
        try {
          const { createInAppNotification } = await import("./create-notification");
          const docType = verification.documentType.replace(/_/g, " ");
          await createInAppNotification({
            userId: verification.userId,
            title: "\u274c Verificare Respins\u0103",
            body: `Documentul ${docType} nu a fost aprobat. Motiv: ${input.rejectionReason || "Nespecificat"}. Retrimite documente actualizate.`,
            category: "verification",
            metadata: { verificationId: verification.id, decision: "rejected", reason: input.rejectionReason },
          });
        } catch (e) { /* silent */ }
      }

      // Push notification to project owner about the review action
      try {
        await notifyOwner({
          title: `Verification ${input.decision === "approved" ? "Approved" : "Rejected"}`,
          content: `Admin (ID: ${adminId}) ${input.decision} verification #${input.verificationId} for user ${user?.name || user?.email || verification.userId}. Document type: ${verification.documentType.replace(/_/g, " ")}.${input.decision === "rejected" ? " Reason: " + (input.rejectionReason || "Not specified") : ""}`,
        });
      } catch (notifErr) {
        console.warn("[NOTIFICATION] Failed to send push notification:", notifErr);
      }

      return { success: true, decision: input.decision };
    }),
});

// ===== ROLE APPLICATION ROUTER =====
export const roleApplicationRouter = router({
  // Submit a role application
  submitApplication: protectedProcedure
    .input(z.object({
      requestedRole: z.string(),
      requestedChannel: z.enum(["C1", "C2", "C3", "ADMIN"]),
      motivation: z.string().min(10).max(2000),
      qualifications: z.string().min(10).max(2000),
      documentUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user!.id;

      // Check if role requires approval
      if (!ROLES_REQUIRING_APPROVAL.includes(input.requestedRole as any)) {
        throw new Error("This role does not require an application. You can select it during registration.");
      }

      // Check for existing pending application for same role
      const existing = await db.select().from(roleApplications)
        .where(and(
          eq(roleApplications.userId, userId),
          eq(roleApplications.requestedRole, input.requestedRole as any),
          eq(roleApplications.status, "pending")
        ));

      if (existing.length > 0) {
        throw new Error("You already have a pending application for this role");
      }

      const [result] = await db.insert(roleApplications).values({
        userId,
        requestedRole: input.requestedRole as any,
        requestedChannel: input.requestedChannel,
        motivation: input.motivation,
        qualifications: input.qualifications,
        documentUrls: input.documentUrls || [],
      });

      return { success: true, applicationId: result.insertId };
    }),

  // Get my applications
  myApplications: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user!.id;
      const results = await db.select().from(roleApplications)
        .where(eq(roleApplications.userId, userId))
        .orderBy(desc(roleApplications.createdAt));
      return results;
    }),

  // Withdraw an application
  withdraw: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user!.id;

      const [app] = await db.select().from(roleApplications)
        .where(and(
          eq(roleApplications.id, input.applicationId),
          eq(roleApplications.userId, userId)
        ));

      if (!app) throw new Error("Application not found");
      if (app.status !== "pending" && app.status !== "under_review") {
        throw new Error("Cannot withdraw a processed application");
      }

      await db.update(roleApplications)
        .set({ status: "withdrawn" })
        .where(eq(roleApplications.id, input.applicationId));

      return { success: true };
    }),

  // ===== ADMIN: List all role applications =====
  listAll: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "under_review", "approved", "rejected", "withdrawn"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const filters = input || { limit: 50, offset: 0 };
      const statusFilter = filters.status || "pending";

      const results = await db.select({
        application: roleApplications,
        userName: users.name,
        userEmail: users.email,
        currentRole: users.dropiRole,
        currentChannel: users.channel,
      })
        .from(roleApplications)
        .leftJoin(users, eq(roleApplications.userId, users.id))
        .where(eq(roleApplications.status, statusFilter))
        .orderBy(desc(roleApplications.createdAt))
        .limit(filters.limit)
        .offset(filters.offset);

      return results;
    }),

  // ===== ADMIN: Review a role application (approve/reject) =====
  review: adminProcedure
    .input(z.object({
      applicationId: z.number(),
      decision: z.enum(["approved", "rejected"]),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const adminId = ctx.user!.id;

      // Get the application
      const [application]: any[] = await db.select().from(roleApplications)
        .where(eq(roleApplications.id, input.applicationId));

      if (!application) throw new Error("Application not found");
      if (application.status !== "pending" && application.status !== "under_review") {
        throw new Error("Application has already been processed");
      }

      // Update application status
      await db.update(roleApplications)
        .set({
          status: input.decision,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: input.decision === "rejected" ? (input.rejectionReason || null) : null,
        })
        .where(eq(roleApplications.id, input.applicationId));

      // If approved, update user's role, channel, and activate the account
      if (input.decision === "approved") {
        await db.update(users)
          .set({
            dropiRole: application.requestedRole,
            channel: application.requestedChannel,
            isActive: true, // Sprint 6A: Activate account upon admin approval
            isVerified: true, // Admin-approved roles are considered verified
          })
          .where(eq(users.id, application.userId));

        console.log(`[ROLE] User ${application.userId} promoted to ${application.requestedRole} on ${application.requestedChannel} (isActive=true, isVerified=true)`);

        // Sprint 6A+: Send push notification on role approval
        try {
          const { sendPushToUser } = await import("./push-notifications");
          const roleName = application.requestedRole.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          await sendPushToUser(application.userId, {
            title: "✅ Role Approved!",
            body: `Your application for ${roleName} on ${application.requestedChannel} has been approved. Welcome aboard!`,
            data: { type: "role_approved", role: application.requestedRole, channel: application.requestedChannel, screen: "/(tabs)" },
            channelId: "verification",
          });
        } catch (pushErr) {
          console.warn("[PUSH] Failed to send role approval push:", pushErr);
        }

        // Create in-app notification for role approval
        try {
          const { createInAppNotification } = await import("./create-notification");
          const roleName = application.requestedRole.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          await createInAppNotification({
            userId: application.userId,
            title: "\u2705 Rol Aprobat!",
            body: `Aplica\u021bia ta pentru ${roleName} pe ${application.requestedChannel} a fost aprobat\u0103. Bine ai venit!`,
            category: "verification",
            metadata: { applicationId: application.id, role: application.requestedRole, decision: "approved" },
          });
        } catch (e) { /* silent */ }
      }

      // Sprint 6A+: Send push notification on rejection
      if (input.decision === "rejected") {
        try {
          const { sendPushToUser } = await import("./push-notifications");
          const roleName = application.requestedRole.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          await sendPushToUser(application.userId, {
            title: "❌ Application Update",
            body: `Your application for ${roleName} was not approved. Reason: ${input.rejectionReason || "Not specified"}. You may reapply after addressing the feedback.`,
            data: { type: "role_rejected", screen: "/profile" },
            channelId: "verification",
          });
        } catch (pushErr) {
          console.warn("[PUSH] Failed to send role rejection push:", pushErr);
        }

        // Create in-app notification for role rejection
        try {
          const { createInAppNotification } = await import("./create-notification");
          const roleName = application.requestedRole.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          await createInAppNotification({
            userId: application.userId,
            title: "\u274c Aplica\u021bie Respins\u0103",
            body: `Aplica\u021bia ta pentru ${roleName} nu a fost aprobat\u0103. Motiv: ${input.rejectionReason || "Nespecificat"}.`,
            category: "verification",
            metadata: { applicationId: application.id, decision: "rejected", reason: input.rejectionReason },
          });
        } catch (e) { /* silent */ }
      }

      // Send email notification
      const [user]: any[] = await db.select().from(users)
        .where(eq(users.id, application.userId));

      if (user?.email) {
        const roleName = application.requestedRole.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const subject = input.decision === "approved"
          ? `✅ DROPi Role Approved: ${roleName}`
          : `❌ DROPi Role Application Update`;

        const body = input.decision === "approved"
          ? `<h2>Congratulations!</h2><p>Your application for <strong>${roleName}</strong> on channel <strong>${application.requestedChannel}</strong> has been approved.</p><p>Log in to access your new dashboard and responsibilities.</p>`
          : `<h2>Application Update</h2><p>Your application for <strong>${roleName}</strong> was not approved at this time.</p><p><strong>Reason:</strong> ${input.rejectionReason || "Not specified"}</p><p>You may reapply after addressing the feedback.</p>`;

        try {
          await transporter.sendMail({
            from: '"DROPi Platform" <dropi.deliveries@gmail.com>',
            to: user.email,
            subject,
            html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">${body}<hr><p style="color:#888;font-size:12px;">DROPi Logistics Platform</p></div>`,
          });
        } catch (err) {
          console.error("[SMTP] Failed to send role notification:", err);
        }
      }

      // Push notification to project owner about role application review
      try {
        const roleName = application.requestedRole.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        await notifyOwner({
          title: `Role Application ${input.decision === "approved" ? "Approved" : "Rejected"}`,
          content: `Admin (ID: ${adminId}) ${input.decision} role application #${input.applicationId} for user ${user?.name || user?.email || application.userId}. Role: ${roleName}, Channel: ${application.requestedChannel}.${input.decision === "rejected" ? " Reason: " + (input.rejectionReason || "Not specified") : ""}`,
        });
      } catch (notifErr) {
        console.warn("[NOTIFICATION] Failed to send push notification:", notifErr);
      }

      return { success: true, decision: input.decision };
    }),

  // Get available roles that can be applied for
  availableRoles: protectedProcedure
    .query(async () => {
      return ROLES_REQUIRING_APPROVAL.map((role) => ({
        id: role,
        name: role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        channel: getChannelForRole(role),
      }));
    }),
});

// Helper: determine channel for a role
function getChannelForRole(role: string): "C1" | "C2" | "C3" | "ADMIN" {
  if (role.startsWith("c2_") || ["operations_manager", "logistics_coordinator", "fleet_manager", "data_analyst", "quality_assurance"].includes(role)) return "C2";
  if (role.startsWith("c3_") || ["emergency_coordinator", "dispatch_manager", "resource_allocator", "communication_officer", "incident_commander"].includes(role)) return "C3";
  if (["system_administrator", "security_officer", "audit_manager", "configuration_manager", "analytics_manager", "support_coordinator"].includes(role)) return "ADMIN";
  return "C1";
}
