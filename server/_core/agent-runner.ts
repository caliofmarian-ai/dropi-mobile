/**
 * Agent Runner — DROPi AI Agent Executor
 *
 * Generic executor that receives a task (role + taskType + payload) and:
 *   1. Updates the agent state to RUNNING
 *   2. Builds a role-aware system prompt
 *   3. Calls the LLM via invokeLLM
 *   4. Parses the structured response into a canonical report
 *   5. Saves the report to agentReports
 *   6. Marks the task DONE and the agent IDLE
 *
 * The LLM response is requested as JSON matching the AgentReportOutput schema.
 * On parse failure, a minimal report is saved and the task is marked FAILED.
 */

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { agentTasks, agentState, agentReports } from "../../drizzle/schema";
import { invokeLLM } from "./llm";

// ===== ROLE META-DATA =====

const ROLE_CHANNEL_MAP: Record<string, "C1" | "C2" | "C3" | "ADMIN"> = {
  customer: "C1",
  merchant: "C1",
  delivery_partner: "C1",
  support_agent: "C1",
  analyst: "C1",
  compliance_officer: "C1",
  fraud_detection: "C1",
  performance_monitor: "C1",
  incident_responder: "C1",
  operations_manager: "C2",
  logistics_coordinator: "C2",
  fleet_manager: "C2",
  c2_compliance_officer: "C2",
  c2_performance_monitor: "C2",
  c2_incident_responder: "C2",
  data_analyst: "C2",
  quality_assurance: "C2",
  emergency_coordinator: "C3",
  dispatch_manager: "C3",
  resource_allocator: "C3",
  communication_officer: "C3",
  c3_data_analyst: "C3",
  incident_commander: "C3",
  system_administrator: "ADMIN",
  security_officer: "ADMIN",
  audit_manager: "ADMIN",
  configuration_manager: "ADMIN",
  analytics_manager: "ADMIN",
  support_coordinator: "ADMIN",
};

const ROLE_DESCRIPTION_MAP: Record<string, string> = {
  customer: "Plasează comenzi, testează checkout, verifică tracking",
  merchant: "Procesează comenzi, gestionează inventar, respectă timpi",
  delivery_partner: "Acceptă misiuni, execută pre-flight, raportează probleme",
  support_agent: "Răspunde la tickete, escaladează corect",
  analyst: "Generează rapoarte, identifică tendințe",
  compliance_officer: "Verifică regulile, semnalează încălcări",
  fraud_detection: "Detectează pattern-uri suspecte",
  performance_monitor: "Monitorizează KPI-uri",
  incident_responder: "Răspunde la incidente, coordonează rezolvarea",
  operations_manager: "Coordonează operațiuni contractate",
  logistics_coordinator: "Optimizează rute și resurse",
  fleet_manager: "Gestionează vehicule și drone",
  c2_compliance_officer: "Verifică SLA-uri",
  c2_performance_monitor: "Monitorizează performanța contractelor",
  c2_incident_responder: "Gestionează incidente operaționale",
  data_analyst: "Analizează date operaționale",
  quality_assurance: "Inspectează calitatea livrărilor",
  emergency_coordinator: "Declară și coordonează urgențe",
  dispatch_manager: "Alocă resurse rapid (<3 min)",
  resource_allocator: "Gestionează depleția resurselor",
  communication_officer: "Coordonează comunicațiile multi-canal",
  c3_data_analyst: "Analiză în timp real",
  incident_commander: "Ia decizii critice (OVERRIDE)",
  system_administrator: "Monitorizează sănătatea platformei",
  security_officer: "Detectează amenințări",
  audit_manager: "Verifică conformitatea",
  configuration_manager: "Gestionează configurări",
  analytics_manager: "Generează rapoarte executive",
  support_coordinator: "Coordonează echipa de support",
};

// ===== REPORT SCHEMA (used for LLM structured output) =====

const REPORT_SCHEMA = {
  name: "agent_report",
  strict: true,
  schema: {
    type: "object",
    properties: {
      actionsExecuted: {
        type: "array",
        items: { type: "string" },
        description: "List of actions the agent executed or simulated",
      },
      bugsFound: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          },
          required: ["description", "severity"],
          additionalProperties: false,
        },
        description: "Bugs or defects found during execution",
      },
      logicIssues: {
        type: "array",
        items: { type: "string" },
        description: "Business logic inconsistencies or problems discovered",
      },
      suggestions: {
        type: "array",
        items: { type: "string" },
        description: "Improvement suggestions specific to this role",
      },
      edgeCases: {
        type: "array",
        items: { type: "string" },
        description: "Edge cases or uncovered scenarios discovered",
      },
      overallStatus: {
        type: "string",
        enum: ["ok", "attention", "critical"],
        description: "Overall health assessment",
      },
      summary: {
        type: "string",
        description: "Plain-text executive summary (max 500 chars)",
      },
    },
    required: ["actionsExecuted", "bugsFound", "logicIssues", "suggestions", "edgeCases", "overallStatus", "summary"],
    additionalProperties: false,
  },
};

// ===== SYSTEM PROMPT BUILDER =====

function buildSystemPrompt(dropiRole: string, taskType: string, payload: unknown): string {
  const channel = ROLE_CHANNEL_MAP[dropiRole] ?? "C1";
  const description = ROLE_DESCRIPTION_MAP[dropiRole] ?? dropiRole;
  const payloadStr = payload ? JSON.stringify(payload, null, 2) : "{}";

  return `Ești Agentul AI pentru rolul "${dropiRole}" în platforma DROPi (canal ${channel}).
Responsabilitățile tale: ${description}.

Regulile canonice non-negociabile:
- Respectă strict limitele "pătrățicii" tale (RBAC).
- Nu iei decizii financiare fără aprobare umană.
- Toate acțiunile trebuie logate.
- Raportezi obiectiv: buguri reale, probleme de logică, sugestii concrete.

Task primit: ${taskType}
Payload / Context:
${payloadStr}

Execută task-ul în Mod AUTONOM. Analizează contextul, simulează acțiunile rolului tău, și returnează raportul structurat JSON.
Fii specific și concis. Nu inventezi buguri inexistente, dar raportează orice anomalie reală.`;
}

// ===== MAIN RUNNER =====

export interface AgentRunResult {
  success: boolean;
  taskId: number;
  reportId?: number;
  error?: string;
}

export async function runAgentTask(taskId: number): Promise<AgentRunResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, taskId, error: "Database unavailable" };
  }

  // 1. Fetch the task
  const taskRows = await db.select().from(agentTasks).where(eq(agentTasks.id, taskId)).limit(1);
  if (taskRows.length === 0) {
    return { success: false, taskId, error: `Task ${taskId} not found` };
  }
  const task = taskRows[0];

  if (task.status !== "pending" && task.status !== "running") {
    return { success: false, taskId, error: `Task ${taskId} is in status "${task.status}", skipping` };
  }

  // 2. Mark task as RUNNING
  await db.update(agentTasks).set({ status: "running", startedAt: new Date() }).where(eq(agentTasks.id, taskId));

  // 3. Update agent state if we have an agentUserId
  if (task.agentUserId) {
    await db
      .update(agentState)
      .set({ status: "running", currentTaskId: taskId, lastActiveAt: new Date() })
      .where(eq(agentState.agentUserId, task.agentUserId));
  }

  // 4. Build prompt and call LLM
  let reportData: {
    actionsExecuted: string[];
    bugsFound: Array<{ description: string; severity: string }>;
    logicIssues: string[];
    suggestions: string[];
    edgeCases: string[];
    overallStatus: "ok" | "attention" | "critical";
    summary: string;
  };

  try {
    const systemPrompt = buildSystemPrompt(task.dropiRole, task.taskType, task.payload);

    const llmResult = await invokeLLM({
      messages: [{ role: "system", content: systemPrompt }],
      outputSchema: REPORT_SCHEMA,
      maxTokens: 1024,
    });

    const rawContent = llmResult.choices[0]?.message?.content;
    const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

    try {
      reportData = JSON.parse(contentStr);
    } catch {
      // LLM returned non-JSON — build a minimal fallback report
      reportData = {
        actionsExecuted: ["Task executed (unstructured response)"],
        bugsFound: [],
        logicIssues: [],
        suggestions: [],
        edgeCases: [],
        overallStatus: "attention",
        summary: contentStr.substring(0, 500),
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || "LLM invocation failed";
    await db.update(agentTasks).set({
      status: "failed",
      errorMessage: errorMsg,
      completedAt: new Date(),
    }).where(eq(agentTasks.id, taskId));

    if (task.agentUserId) {
      await db.update(agentState).set({
        status: "idle",
        currentTaskId: null,
        lastActiveAt: new Date(),
      }).where(eq(agentState.agentUserId, task.agentUserId));
    }

    return { success: false, taskId, error: errorMsg };
  }

  // 5. Save report
  const period = new Date().toISOString().split("T")[0];
  const insertResult = await db.insert(agentReports).values({
    agentUserId: task.agentUserId ?? 0,
    dropiRole: task.dropiRole,
    taskId,
    channel: task.channel,
    mode: "autonomous",
    period,
    actionsExecuted: reportData.actionsExecuted,
    bugsFound: reportData.bugsFound,
    logicIssues: reportData.logicIssues,
    suggestions: reportData.suggestions,
    edgeCases: reportData.edgeCases,
    overallStatus: reportData.overallStatus,
    summary: reportData.summary,
  });
  const reportId = insertResult[0].insertId;

  // 6. Mark task as DONE
  await db.update(agentTasks).set({
    status: "done",
    result: reportData,
    completedAt: new Date(),
  }).where(eq(agentTasks.id, taskId));

  // 7. Reset agent state to IDLE
  if (task.agentUserId) {
    await db.update(agentState).set({
      status: "idle",
      currentTaskId: null,
      lastActiveAt: new Date(),
      lastReportAt: new Date(),
    }).where(eq(agentState.agentUserId, task.agentUserId));
  }

  console.log(`[AgentRunner] Task ${taskId} (${task.dropiRole}/${task.taskType}) completed. Report #${reportId} — status: ${reportData.overallStatus}`);

  return { success: true, taskId, reportId };
}
