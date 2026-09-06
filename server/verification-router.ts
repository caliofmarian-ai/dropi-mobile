import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { roleApplications, users } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { maskEmail, sendPlatformEmail } from "./_core/mail";
import { notifyOwner } from "./_core/notification";

export { verificationRouter } from "./delivery-verification-router";

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

// ===== ROLE APPLICATION ROUTER =====
export const roleApplicationRouter = router({
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

      if (!ROLES_REQUIRING_APPROVAL.includes(input.requestedRole as any)) {
        throw new Error("This role does not require an application. You can select it during registration.");
      }

      const existing = await db.select().from(roleApplications)
        .where(and(
          eq(roleApplications.userId, userId),
          eq(roleApplications.requestedRole, input.requestedRole as any),
          eq(roleApplications.status, "pending"),
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

  myApplications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(roleApplications)
      .where(eq(roleApplications.userId, ctx.user!.id))
      .orderBy(desc(roleApplications.createdAt));
  }),

  withdraw: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user!.id;

      const [app] = await db.select().from(roleApplications)
        .where(and(
          eq(roleApplications.id, input.applicationId),
          eq(roleApplications.userId, userId),
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

      return db.select({
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
    }),

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

      const [application]: any[] = await db.select().from(roleApplications)
        .where(eq(roleApplications.id, input.applicationId));

      if (!application) throw new Error("Application not found");
      if (application.status !== "pending" && application.status !== "under_review") {
        throw new Error("Application has already been processed");
      }

      await db.update(roleApplications)
        .set({
          status: input.decision,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: input.decision === "rejected" ? (input.rejectionReason || null) : null,
        })
        .where(eq(roleApplications.id, input.applicationId));

      if (input.decision === "approved") {
        await db.update(users)
          .set({
            dropiRole: application.requestedRole,
            channel: application.requestedChannel,
            isActive: true,
            isVerified: true,
          })
          .where(eq(users.id, application.userId));

        console.log(`[ROLE] User ${application.userId} promoted to ${application.requestedRole} on ${application.requestedChannel} (isActive=true, isVerified=true)`);

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

      const [user]: any[] = await db.select().from(users)
        .where(eq(users.id, application.userId));

      if (user?.email) {
        const roleName = application.requestedRole.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const subject = input.decision === "approved"
          ? `✅ DROPi Role Approved: ${roleName}`
          : "❌ DROPi Role Application Update";

        const body = input.decision === "approved"
          ? `<h2>Congratulations!</h2><p>Your application for <strong>${roleName}</strong> on channel <strong>${application.requestedChannel}</strong> has been approved.</p><p>Log in to access your new dashboard and responsibilities.</p>`
          : `<h2>Application Update</h2><p>Your application for <strong>${roleName}</strong> was not approved at this time.</p><p><strong>Reason:</strong> ${input.rejectionReason || "Not specified"}</p><p>You may reapply after addressing the feedback.</p>`;

        const sent = await sendPlatformEmail({
          to: user.email,
          subject,
          logLabel: "role application decision email",
          html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">${body}<hr><p style="color:#888;font-size:12px;">DROPi Logistics Platform</p></div>`,
        });
        if (!sent) {
          console.warn(`[SMTP] Role application notification not delivered to ${maskEmail(user.email)}`);
        }
      }

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

  availableRoles: protectedProcedure.query(async () => {
    return ROLES_REQUIRING_APPROVAL.map((role) => ({
      id: role,
      name: role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      channel: getChannelForRole(role),
    }));
  }),
});

function getChannelForRole(role: string): "C1" | "C2" | "C3" | "ADMIN" {
  if (role.startsWith("c2_") || ["operations_manager", "logistics_coordinator", "fleet_manager", "data_analyst", "quality_assurance"].includes(role)) return "C2";
  if (role.startsWith("c3_") || ["emergency_coordinator", "dispatch_manager", "resource_allocator", "communication_officer", "incident_commander"].includes(role)) return "C3";
  if (["system_administrator", "security_officer", "audit_manager", "configuration_manager", "analytics_manager", "support_coordinator"].includes(role)) return "ADMIN";
  return "C1";
}
