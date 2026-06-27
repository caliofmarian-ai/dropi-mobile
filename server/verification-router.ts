import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { verifications, roleApplications, users } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import nodemailer from "nodemailer";

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
      if (!db) return { isVerified: false, hasPending: false, totalSubmitted: 0, approved: 0, rejected: 0, pending: 0 };
      const userId = ctx.user!.id;
      const results = await db.select().from(verifications)
        .where(eq(verifications.userId, userId));

      const hasApproved = results.some((v: any) => v.status === "approved");
      const hasPending = results.some((v: any) => v.status === "pending");

      return {
        isVerified: hasApproved,
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
          // Mark user as verified (they can now receive missions)
          console.log(`[VERIFICATION] User ${verification.userId} is now VERIFIED`);
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

      // If approved, update user's role and channel
      if (input.decision === "approved") {
        await db.update(users)
          .set({
            dropiRole: application.requestedRole,
            channel: application.requestedChannel,
          })
          .where(eq(users.id, application.userId));

        console.log(`[ROLE] User ${application.userId} promoted to ${application.requestedRole} on ${application.requestedChannel}`);
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
