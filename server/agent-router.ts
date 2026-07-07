/**
 * Agent Router — DROPi AI Agent Orchestrator tRPC API
 *
 * Exposes endpoints for admins to:
 *   - Submit single tasks or full orchestrator runs
 *   - Monitor the task queue (list, status)
 *   - View agent states (all 29 roles)
 *   - Read agent reports
 *   - Cancel pending tasks
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { agentTasks, agentState, agentReports } from "../drizzle/schema";
import { dispatchTask, dispatchRun } from "./_core/orchestrator";

// ===== SHARED VALIDATION =====

const ALL_DROPI_ROLES = [
  "customer", "merchant", "delivery_partner", "support_agent",
  "analyst", "compliance_officer", "fraud_detection",
  "performance_monitor", "incident_responder",
  "operations_manager", "logistics_coordinator", "fleet_manager",
  "c2_compliance_officer", "c2_performance_monitor", "c2_incident_responder",
  "data_analyst", "quality_assurance",
  "emergency_coordinator", "dispatch_manager", "resource_allocator",
  "communication_officer", "c3_data_analyst", "incident_commander",
  "system_administrator", "security_officer", "audit_manager",
  "configuration_manager", "analytics_manager", "support_coordinator",
] as const;

const dropiRoleEnum = z.enum(ALL_DROPI_ROLES);
const channelEnum = z.enum(["C1", "C2", "C3", "ADMIN"]);
const taskTypeEnum = z.enum(["audit", "validate", "simulate", "report", "custom"]);
const taskStatusEnum = z.enum(["pending", "running", "done", "failed", "cancelled"]);

// ===== ROUTER =====

export const agentRouter = router({
  /**
   * Submit a single task to the orchestrator queue.
   * The orchestrator will pick it up within POLL_INTERVAL_MS.
   */
  submitTask: adminProcedure
    .input(
      z.object({
        dropiRole: dropiRoleEnum,
        channel: channelEnum,
        taskType: taskTypeEnum,
        payload: z.record(z.string(), z.unknown()).optional(),
        priority: z.number().int().min(1).max(10).optional().default(5),
        agentUserId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const taskId = await dispatchTask({
        dropiRole: input.dropiRole,
        channel: input.channel,
        taskType: input.taskType,
        payload: input.payload,
        priority: input.priority,
        createdBy: ctx.user!.id,
        agentUserId: input.agentUserId,
      });
      return { taskId };
    }),

  /**
   * Submit a full orchestrator run — multiple tasks with the same runId.
   * Admin receives a notification when all tasks complete.
   */
  submitRun: adminProcedure
    .input(
      z.object({
        tasks: z
          .array(
            z.object({
              dropiRole: dropiRoleEnum,
              channel: channelEnum,
              taskType: taskTypeEnum,
              payload: z.record(z.string(), z.unknown()).optional(),
              priority: z.number().int().min(1).max(10).optional().default(5),
              agentUserId: z.number().int().positive().optional(),
            })
          )
          .min(1)
          .max(29),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { runId, taskIds } = await dispatchRun({
        tasks: input.tasks,
        createdBy: ctx.user!.id,
      });
      return { runId, taskIds, totalTasks: taskIds.length };
    }),

  /**
   * List tasks (queue view). Supports filtering by status, role, runId.
   */
  listTasks: adminProcedure
    .input(
      z.object({
        status: taskStatusEnum.optional(),
        dropiRole: dropiRoleEnum.optional(),
        orchestratorRunId: z.string().optional(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.status) conditions.push(eq(agentTasks.status, input.status));
      if (input.dropiRole) conditions.push(eq(agentTasks.dropiRole, input.dropiRole));
      if (input.orchestratorRunId) conditions.push(eq(agentTasks.orchestratorRunId, input.orchestratorRunId));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (input.page - 1) * input.limit;

      const [tasks, countRows] = await Promise.all([
        db.select().from(agentTasks).where(where).orderBy(desc(agentTasks.createdAt)).limit(input.limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(agentTasks).where(where),
      ]);

      return { tasks, total: countRows[0]?.count ?? 0 };
    }),

  /**
   * Cancel a pending task (cannot cancel running/done tasks).
   */
  cancelTask: adminProcedure
    .input(z.object({ taskId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db.select().from(agentTasks).where(eq(agentTasks.id, input.taskId)).limit(1);
      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      if (rows[0].status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot cancel task in status "${rows[0].status}"` });
      }

      await db.update(agentTasks).set({ status: "cancelled", completedAt: new Date() }).where(eq(agentTasks.id, input.taskId));
      return { success: true };
    }),

  /**
   * Get live state of all AI agents.
   * Returns one row per unique agentUserId registered in agentState.
   */
  listAgentStates: adminProcedure
    .input(
      z.object({
        channel: channelEnum.optional(),
        status: z.enum(["idle", "running", "waiting"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.channel) conditions.push(eq(agentState.channel, input.channel));
      if (input.status) conditions.push(eq(agentState.status, input.status));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const states = await db.select().from(agentState).where(where).orderBy(agentState.channel, agentState.dropiRole);
      return { states };
    }),

  /**
   * List agent reports. Supports filtering by role, channel, overallStatus.
   */
  listReports: adminProcedure
    .input(
      z.object({
        dropiRole: dropiRoleEnum.optional(),
        channel: channelEnum.optional(),
        overallStatus: z.enum(["ok", "attention", "critical"]).optional(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.dropiRole) conditions.push(eq(agentReports.dropiRole, input.dropiRole));
      if (input.channel) conditions.push(eq(agentReports.channel, input.channel));
      if (input.overallStatus) conditions.push(eq(agentReports.overallStatus, input.overallStatus));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (input.page - 1) * input.limit;

      const [reports, countRows] = await Promise.all([
        db.select().from(agentReports).where(where).orderBy(desc(agentReports.createdAt)).limit(input.limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(agentReports).where(where),
      ]);

      return { reports, total: countRows[0]?.count ?? 0 };
    }),

  /**
   * Get a single report by ID.
   */
  getReport: adminProcedure
    .input(z.object({ reportId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db.select().from(agentReports).where(eq(agentReports.id, input.reportId)).limit(1);
      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      }
      return rows[0];
    }),
});
