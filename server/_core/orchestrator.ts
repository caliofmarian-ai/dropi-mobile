/**
 * DROPi Orchestrator Service
 *
 * Central scheduler that drives the AI Agent pipeline:
 *
 *   Orchestrator → Agent X (task) → Agent X executes → Agent X reports
 *   → Orchestrator → Agent Y (next task) → … → Admin notification
 *
 * Key behaviors:
 * - Polls `agentTasks` every POLL_INTERVAL_MS for pending tasks
 * - Picks the highest-priority pending task (lowest priority number wins)
 * - Runs it via runAgentTask (async, non-blocking)
 * - After each completed run, checks if all tasks in the same
 *   orchestratorRunId are done — if so, notifies the admin
 * - Graceful: no crash on DB unavailability; retries on next poll
 *
 * Started once at server startup via startOrchestrator().
 */

import { and, asc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getDb } from "../db";
import { agentTasks, agentState, agentReports } from "../../drizzle/schema";
import { runAgentTask } from "./agent-runner";
import { notifyOwner } from "./notification";

// ===== CONFIG =====

const POLL_INTERVAL_MS = 8_000;       // Check queue every 8 seconds
const MAX_CONCURRENT_TASKS = 3;       // Max parallel agent executions
const RUN_COMPLETE_NOTIFY = true;     // Send owner notification when a run finishes

// ===== STATE =====

let isRunning = false;
let activeTaskCount = 0;
const activeRunIds = new Set<string>();

// ===== HELPERS =====

async function pickNextPendingTask() {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(agentTasks)
    .where(eq(agentTasks.status, "pending"))
    .orderBy(asc(agentTasks.priority), asc(agentTasks.createdAt))
    .limit(1);

  return rows.length > 0 ? rows[0] : null;
}

async function checkRunCompletion(orchestratorRunId: string): Promise<void> {
  if (!orchestratorRunId) return;
  if (activeRunIds.has(orchestratorRunId)) return;

  const db = await getDb();
  if (!db) return;

  // Check if any task in the run is still pending/running
  const remaining = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentTasks)
    .where(
      and(
        eq(agentTasks.orchestratorRunId, orchestratorRunId),
        sql`${agentTasks.status} IN ('pending', 'running')`
      )
    );

  const pendingCount = remaining[0]?.count ?? 1;
  if (pendingCount > 0) return;

  // All tasks done — build summary and notify
  activeRunIds.add(orchestratorRunId);
  try {
    const allTasks = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.orchestratorRunId, orchestratorRunId));

    const done = allTasks.filter((t) => t.status === "done").length;
    const failed = allTasks.filter((t) => t.status === "failed").length;
    const total = allTasks.length;

    // Gather all reports for this run
    const taskIds = allTasks.map((t) => t.id);
    let criticalCount = 0;
    let attentionCount = 0;
    const summaries: string[] = [];

    if (taskIds.length > 0) {
      for (const tid of taskIds) {
        const rep = await db
          .select()
          .from(agentReports)
          .where(eq(agentReports.taskId, tid))
          .limit(1);
        if (rep.length > 0) {
          if (rep[0].overallStatus === "critical") criticalCount++;
          if (rep[0].overallStatus === "attention") attentionCount++;
          if (rep[0].summary) summaries.push(`[${rep[0].dropiRole}] ${rep[0].summary}`);
        }
      }
    }

    const statusEmoji = criticalCount > 0 ? "🔴 CRITIC" : attentionCount > 0 ? "🟡 ATENȚIE" : "🟢 OK";
    const notifTitle = `DROPi Orchestrator — Run ${orchestratorRunId.substring(0, 8)} complet`;
    const notifContent = [
      `${statusEmoji} — ${done}/${total} taskuri finalizate${failed > 0 ? `, ${failed} eșuate` : ""}`,
      criticalCount > 0 ? `⚠️ ${criticalCount} probleme CRITICE detectate` : "",
      attentionCount > 0 ? `⚠️ ${attentionCount} probleme care necesită atenție` : "",
      "",
      "Sumar rapoarte:",
      ...summaries.slice(0, 5),
      summaries.length > 5 ? `... și ${summaries.length - 5} rapoarte suplimentare` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (RUN_COMPLETE_NOTIFY) {
      try {
        await notifyOwner({ title: notifTitle, content: notifContent });
        console.log(`[Orchestrator] Run ${orchestratorRunId} completed — owner notified`);
      } catch (err) {
        console.warn("[Orchestrator] Failed to notify owner:", err);
      }
    }

    console.log(`[Orchestrator] Run ${orchestratorRunId}: ${done}/${total} done, ${failed} failed — ${statusEmoji}`);
  } finally {
    // Keep the runId in the set to prevent duplicate notifications
    // (it's cleared on server restart, which is fine)
  }
}

// ===== MAIN POLL LOOP =====

async function processTick(): Promise<void> {
  if (activeTaskCount >= MAX_CONCURRENT_TASKS) return;

  try {
    const task = await pickNextPendingTask();
    if (!task) return;

    activeTaskCount++;

    // Run asynchronously — do not await (allows concurrent tasks)
    runAgentTask(task.id)
      .then(async (result) => {
        if (!result.success) {
          console.warn(`[Orchestrator] Task ${task.id} failed: ${result.error}`);
        }
        // Check if the run is now complete
        if (task.orchestratorRunId) {
          await checkRunCompletion(task.orchestratorRunId);
        }
      })
      .catch((err) => {
        console.error(`[Orchestrator] Unexpected error for task ${task.id}:`, err);
      })
      .finally(() => {
        activeTaskCount--;
      });
  } catch (err) {
    console.error("[Orchestrator] Poll tick error:", err);
  }
}

// ===== PUBLIC API =====

/**
 * Start the orchestrator polling loop.
 * Called once at server startup.
 */
export function startOrchestrator(): void {
  if (isRunning) {
    console.warn("[Orchestrator] Already running, skipping start");
    return;
  }
  isRunning = true;

  const tick = async () => {
    if (!isRunning) return;
    await processTick();
    setTimeout(tick, POLL_INTERVAL_MS);
  };

  // First tick after a short delay to let the server finish starting
  setTimeout(tick, 3_000);
  console.log(`[Orchestrator] Started — polling every ${POLL_INTERVAL_MS / 1000}s, max ${MAX_CONCURRENT_TASKS} concurrent tasks`);
}

/**
 * Stop the orchestrator (graceful shutdown).
 */
export function stopOrchestrator(): void {
  isRunning = false;
  console.log("[Orchestrator] Stopped");
}

/**
 * Dispatch a single task to the queue and return its ID.
 * Convenience helper used by the agent router.
 */
export async function dispatchTask(opts: {
  dropiRole: string;
  channel: "C1" | "C2" | "C3" | "ADMIN";
  taskType: string;
  payload?: unknown;
  priority?: number;
  createdBy?: number;
  agentUserId?: number;
  orchestratorRunId?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const runId = opts.orchestratorRunId ?? randomUUID();

  const result = await db.insert(agentTasks).values({
    orchestratorRunId: runId,
    dropiRole: opts.dropiRole as any,
    channel: opts.channel,
    taskType: opts.taskType,
    payload: opts.payload ?? null,
    status: "pending",
    priority: opts.priority ?? 5,
    createdBy: opts.createdBy ?? null,
    agentUserId: opts.agentUserId ?? null,
  });

  return result[0].insertId;
}

/**
 * Dispatch multiple tasks as a single orchestrator run (same runId).
 * Tasks are processed in priority order by the orchestrator.
 */
export async function dispatchRun(opts: {
  tasks: Array<{
    dropiRole: string;
    channel: "C1" | "C2" | "C3" | "ADMIN";
    taskType: string;
    payload?: unknown;
    priority?: number;
    agentUserId?: number;
  }>;
  createdBy?: number;
}): Promise<{ runId: string; taskIds: number[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const runId = randomUUID();
  const taskIds: number[] = [];

  for (const t of opts.tasks) {
    const result = await db.insert(agentTasks).values({
      orchestratorRunId: runId,
      dropiRole: t.dropiRole as any,
      channel: t.channel,
      taskType: t.taskType,
      payload: t.payload ?? null,
      status: "pending",
      priority: t.priority ?? 5,
      createdBy: opts.createdBy ?? null,
      agentUserId: t.agentUserId ?? null,
    });
    taskIds.push(result[0].insertId);
  }

  console.log(`[Orchestrator] Run ${runId} dispatched — ${taskIds.length} tasks`);
  return { runId, taskIds };
}
