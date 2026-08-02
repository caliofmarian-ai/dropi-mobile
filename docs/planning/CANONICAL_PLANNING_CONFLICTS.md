# DROPi — Canonical Planning Conflicts Register

> **Status:** PLANNING CANONICAL — DO NOT DELETE  
> **Generated:** 2026-08-02  
> **Purpose:** Record of all detected conflicts between canonical sources that affect planning decisions  
> **Rule:** Conflicted items must NOT be silently resolved. Each must have an owner-decision or canonical-resolution issue.

---

## Conflict Detection Methodology

Conflicts are detected by comparing:
1. Claims across different authority-class sources
2. Implementation state vs. canonical requirements
3. Operational rules vs. practical feasibility

Priority: `04-ZIP` > `HIST-EXTRACT` > `ACTIVE-CANON` > `BLUEPRINT` > `IMPL`

---

## CONFLICT-001: Marketplace Separation vs. Integration

| Field | Value |
|-------|-------|
| ID | CONFLICT-001 |
| Severity | MEDIUM |
| Status | Unresolved — Requires Owner Decision |
| Blocking Issues | CANON-RES-001 |

**Source A (Higher Authority — 04-ZIP):**
- Cap. 06 (Product): Marketplace is a "separate controlled marketplace" with its own website
- "Flow: Marketplace → App — separate systems"
- Marketplace does NOT validate orders, does NOT select pilots, does NOT start delivery

**Source B (BLUEPRINT — Lower Authority):**
- `BLUEPRINT_MARKETPLACE_DROPI.md`: Marketplace implemented as part of the mobile app (C1 channel tab)
- Current implementation: Marketplace UI lives in the mobile app under C1 channel

**Conflict:**
The 04.zip canonical states a separate website/marketplace distinct from the app. The current implementation has marketplace embedded in the app.

**Impact:**
- EPIC-004 (Marketplace C1) may need separate website scope
- Could require separate web application project or clarification on "integrated app marketplace"

**Resolution Required:** CANON-RES-001  
**Blocking:** EPIC-004 final scope, EPIC-027 (Website) dependency

---

## CONFLICT-002: EASA Compliance Timeline for Philippines Zone 0

| Field | Value |
|-------|-------|
| ID | CONFLICT-002 |
| Severity | HIGH |
| Status | Unresolved — Requires Owner Decision |
| Blocking Issues | OWNER-004, OWNER-005 |

**Source A (04-ZIP — Cap. 23):**
- Detailed EASA multi-country compliance requirements
- EU-standard compliance framework for drone operations

**Source B (04-ZIP — Cap. 22):**
- Philippines Zone 0 is the starting point
- Philippines has its own drone regulations (CAAP — Civil Aviation Authority of Philippines)

**Conflict:**
Cap. 23 specifies EASA compliance framework, but Zone 0 is Philippines, not EU. EASA rules do not directly apply in Philippines. Philippines uses CAAP regulations. The canon does not explicitly resolve whether EASA is aspirational (for future EU expansion) or a current requirement.

**Impact:**
- EPIC-011 (GDPR & Privacy Compliance) and any drone compliance epics
- Blocking EPIC-023 (Delivery Execution) final compliance scope
- affects OWNER-004 (DronePort physical timeline)

**Resolution Required:** OWNER-004 (Philippines regulatory strategy)  
**Blocking:** Any live drone delivery epic until resolved

---

## CONFLICT-003: Client-Presence Rules — Canonical vs. Operational Reality

| Field | Value |
|-------|-------|
| ID | CONFLICT-003 |
| Severity | MEDIUM |
| Status | Unresolved — Requires Owner Decision |
| Blocking Issues | CANON-RES-002 |

**Source A (DELIVERY_MULTIMODAL.md — ACTIVE-CANON):**
- "Drone does NOT wait for client"
- "Drone does NOT negotiate reception"
- "Drone does NOT repeat delivery"
- "Failed reception triggers fallback"
- Client must complete tutorial and accept conditions

**Source B (BLUEPRINT/DROPi_ROADMAP_BY_LAYERS.md):**
- Mentions "client-presence rules" as feature to implement
- Does not specify enforcement mechanism

**Source C (Implementation):**
- No client-presence validation currently implemented
- Tutorial completion flow not yet implemented

**Conflict:**
The canonical rule (no-wait drone) is clear, but the enforcement mechanism (how the app verifies client presence at reception point, tutorial completion tracking, conditions acceptance) is underspecified in implementation sources.

**Impact:**
- EPIC-023 (Delivery Execution Engine) needs specific acceptance criteria
- Tutorial completion tracking must be explicit in BATCH scope
- Conditions acceptance must be logged (L6 audit requirement)

**Resolution Required:** CANON-RES-002  
**Note:** Canon authority is clear; implementation detail needs specification, not resolution of authority conflict.

---

## CONFLICT-004: Real-Time — WebSocket vs. Polling Strategy

| Field | Value |
|-------|-------|
| ID | CONFLICT-004 |
| Severity | LOW |
| Status | Unresolved — Owner Decision Needed |
| Blocking Issues | OWNER-002 |

**Source A (AUDIT_TRACKING.md — Sprint 7):**
- Real-time WebSocket for live data is "Low priority" (Sprint 7)
- Score: 2.40 in prioritization matrix

**Source B (BLUEPRINT_SPRINT_ROADMAP.md):**
- Push notifications for order status (Sprint 6B) — MEDIUM priority
- These are different from WebSocket (push vs. real-time)

**Source C (Current Implementation):**
- `server/live-tracking.ts` exists (WebSocket partially implemented)
- `components/live-tracking-map` exists

**Conflict:**
Partial WebSocket implementation exists but not prioritized for completion. Canon doesn't specify whether to complete WebSocket or use polling for Zone 0 (low-connectivity environment).

**Impact:**
- BATCH for real-time features needs clear approach
- Zone 0 (Philippines) connectivity constraints not specified

**Resolution Required:** OWNER-002  
**Blocking:** EPIC-009 (Real-Time & Notifications) final implementation approach

---

## CONFLICT-005: AI Agent Activation Sequence

| Field | Value |
|-------|-------|
| ID | CONFLICT-005 |
| Severity | MEDIUM |
| Status | Unresolved — Owner Decision Needed |
| Blocking Issues | OWNER-005 |

**Source A (AI_AGENT_SYSTEM.md — ACTIVE-CANON):**
- Every role has dual human+AI account
- All 29 roles need AI agents
- AI agents operate autonomously until human takes over

**Source B (BLUEPRINT/DROPi_ROADMAP_BY_LAYERS.md):**
- AI agents are Phase 4 (L4 Logic Core)
- Dependency: L2 Application Core must be complete first
- L4 includes: framework (4.1), then C1 agents (4.2), C2 agents (4.3), C3 agents (4.4), Admin (4.5), Simulation (4.6), Eligibility (4.7)

**Source C (AUDIT_TRACKING.md):**
- "AI Agents: ❌ Doar documentat — Canonical definit, neimplementat"

**Conflict:**
Canon requires all 29 agents from the start (dual account at registration). But roadmap places agent implementation in Phase 4 (M3), after M1 completion. There's a gap: accounts exist in M1 but their AI agents don't exist until M3.

**Impact:**
- Dual account creation (human+AI) can be data-model-only in M1
- Full agent behavior implemented in M3
- This is a staging/phasing decision, not a technical conflict

**Resolution Required:** OWNER-005  
**Note:** Not a true conflict — a phasing decision. Owner must confirm whether M1 creates AI agent records (placeholder) or defers to M3.

---

## Summary

| ID | Severity | Status | Resolution Issue |
|----|----------|--------|-----------------|
| CONFLICT-001 | MEDIUM | Unresolved | CANON-RES-001 |
| CONFLICT-002 | HIGH | Unresolved | OWNER-004 |
| CONFLICT-003 | MEDIUM | Unresolved (impl detail) | CANON-RES-002 |
| CONFLICT-004 | LOW | Unresolved | OWNER-002 |
| CONFLICT-005 | MEDIUM | Unresolved (phasing) | OWNER-005 |

**Total Conflicts:** 5  
**Blocking High-Priority Epics:** CONFLICT-002 (drone compliance), CONFLICT-001 (marketplace scope)  
**Non-Blocking (phasing decisions):** CONFLICT-004, CONFLICT-005

---

## Rule: Conflict Preservation

These conflicts are preserved, not resolved by this document.  
Each conflict has a corresponding GitHub issue that requires owner or canonical decision before implementation of dependent work proceeds.

Dependent implementation issues MUST be labeled `status:blocked` and reference the blocking conflict issue.

---

*No canonical sources were modified to generate this document.*
