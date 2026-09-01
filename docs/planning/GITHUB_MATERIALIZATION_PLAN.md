# DROPi — GitHub Materialization Plan

> **Status:** PLANNING CANONICAL — RECONCILED 2026-09-01  
> **Initial generation:** 2026-08-02  
> **Repository:** `caliofmarian-ai/dropi-mobile`  
> **Archive SHA-256:** `82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5`  
> **Machine-readable authority:** `docs/planning/github_materialization_plan.json`

---

## Purpose

This document is the human-readable summary of the DROPi Mobile GitHub planning graph.
Exact labels, milestone definitions, issue bodies, stable IDs and dependencies are governed by the machine-readable JSON plan. The YAML file is a compact mirror intended for human inspection.

The planning graph preserves completed canonical recovery work and materializes the remaining roadmap without reopening CAN-001 through CAN-008.

---

## Reconciled Plan Shape

| Object | Count |
|---|---:|
| Canonical source documents inspected | 47 |
| Canonical/source conflicts or planning tensions tracked | 5 |
| Labels planned | 212 |
| Milestones | 7 |
| Program issues | 1 |
| Phase issues | 6 |
| Epic issues | 30 |
| Batch issues | 60 |
| Implementation issues | 120 |
| Owner-decision issues | 5 |
| Canonical-resolution issues | 3 |
| Audit issues | 1 |
| Verification issues | 1 |
| Documentation issues | 1 |
| **Total materialized issues** | **228** |

The 228 stable-ID planning issues are currently present in GitHub as issue numbers **#61 through #288**. A repository issue-search audit on 2026-09-01 returned `total_count=228` for bodies containing `dropi-planning-id`.

The earlier values `147 labels` and `233 issues` were draft-summary values and are superseded by the machine-readable plan and the live materialized graph. The difference in label count was primarily caused by the domain taxonomy not being included in the old human total.

---

## Milestones

| ID | GitHub milestone title | State | Purpose |
|---|---|---|---|
| M0 | Canonical Recovery & Certification | closed | CAN-001 through CAN-008 recovery/certification |
| M1 | Application Core Foundation | open | Auth, persistence, order flows, operational roles, payments, real-time foundations |
| M2 | Audit Core Activation | open | Audit, privacy, GDPR and operational traceability |
| M3 | Logic Core — AI/DSS | open | AI-agent framework, simulations, eligibility and route optimization |
| M4 | Physical Core — DronePort | open | DronePort digital operations and multimodal physical-core support |
| M5 | Operational Core — Supervised Delivery | open | Live supervised delivery, STOP/FALLBACK, GPS/geofencing and fleet operations |
| M6 | Public Front — Website & Launch | open | Public launch surfaces and complete-roadmap verification |

M0 is historical/completed. M1 is the active implementation milestone.

---

## GitHub Hierarchy

```text
PROG-001  Program (#61)
  ├─ PHASE-M1 .. PHASE-M6
  ├─ EPIC-001 .. EPIC-030
  ├─ BATCH-001 .. BATCH-060
  ├─ IMPL-001 .. IMPL-120
  ├─ OWNER-001 .. OWNER-005
  ├─ CANON-RES-001 .. CANON-RES-003
  ├─ AUDIT-001
  ├─ VERIFY-001
  └─ DOC-001
```

Every managed issue contains a stable marker:

```html
<!-- dropi-planning-id: EPIC-001 -->
```

The materializer uses this stable ID rather than issue number for deduplication and reconciliation.

---

## Current M1 Execution Context — 2026-09-01 Repository Audit

The materialization was produced from historical audits as well as implementation observations. Some child issues therefore describe work that has since been implemented on `main` but was never reconciled back into GitHub planning status.

The repository audit identified these examples:

- **IMPL-001 / #158 — Delivery Partner unverified status:** implementation exists in registration/backend and the delivery-partner dashboard exposes the verification-required state. Requires regression verification and planning closure, not reimplementation.
- **IMPL-002 / #159 — Mission guards for unverified delivery partners:** guards exist on the blueprint-specified mission-affecting procedures (`b2bDelivery.pilotUpdateStatus`, `pilotSelection.updateAvailability`, `pilotSelection.updatePosition`). Test-registry verification is still incomplete.
- **IMPL-003 / #160 — Admin approval gate:** role-application approval/rejection backend exists and updates role/channel/account state with notifications. Requires regression verification and planning reconciliation.
- **IMPL-004 / #161 — Admin approvals UI:** `app/admin/approvals.tsx` exists and consumes the role-application API. Requires verification and planning reconciliation.
- **IMPL-010 / #167 — Replace mock/hardcoded dashboards:** partially complete. Customer/Merchant/Pilot core flows use tRPC-backed reads, but additional role dashboards still contain fixed/demo metrics and values.
- **IMPL-033 / #190 — WebSocket server:** transport exists and is mounted in the server runtime. It is not simply “missing”; it requires security/authorization hardening and verification because live-tracking identity is currently derived from connection query parameters.
- **IMPL-034 / #191 — Push notifications for order state changes:** still requires explicit wiring to order/mission state transitions; existing push infrastructure is already used for verification/role decisions.

Therefore `status:ready` in the materialized graph means **ready for repository-grounded reconciliation/execution**, not proof that the capability is absent from code.

---

## Immediate Execution Order

1. **Finish PR #60 planning certification.**
   - Run planning unit tests on the PR.
   - Verify the complete live GitHub materialization read-only against the JSON plan.
   - Prove stable-ID uniqueness and exact counts.
   - Do not merge if remote verification fails.

2. **Reconcile already-implemented M1 safety work before rewriting it.**
   - Verify IMPL-001..IMPL-004 against current code and targeted tests.
   - Close/update their GitHub planning status only after evidence exists.

3. **Repair P0/P1 gaps discovered by current-code audit.**
   - Authenticate/authorize WebSocket tracking identities and delivery access.
   - Remove hardcoded debug tracking IDs from user-facing dashboard paths.
   - Continue IMPL-010 until remaining role dashboards consume governed live contracts.
   - Implement IMPL-034 order/mission state push delivery.

4. **Then proceed through the M1 batch dependency graph** as represented in the JSON plan.

---

## Conflict / Owner-Decision Mapping

The reconciled mapping is maintained in `CANONICAL_PLANNING_CONFLICTS.md`.

| Topic | Planning issue |
|---|---|
| Marketplace separation vs integrated mobile marketplace | CANON-RES-001 — #283 |
| Client-presence enforcement details | CANON-RES-002 — #284 |
| Philippines Zone 0 regulatory scope / EASA references | CANON-RES-003 — #285 |
| Biometric authentication timing | OWNER-001 — #278 |
| WebSocket vs polling operating strategy | OWNER-002 — #279 |
| Offline-first sync strategy | OWNER-003 — #280 |
| DronePort physical infrastructure timing | OWNER-004 — #281 |
| AI-agent activation sequence | OWNER-005 — #282 |

No conflict is silently resolved by this planning document.

---

## Materialization Rules

1. The JSON plan is the exact source for managed GitHub objects.
2. Labels and milestones are materialized before issues.
3. Parent planning objects are materialized before children.
4. Closed CAN-001 through CAN-008 recovery issues remain historical and are not recreated.
5. Product code is outside the planning-materialization PR scope.
6. Canonical source files and `04.zip` are protected from mutation by the materialization workflow.
7. Stable IDs are the deduplication key.
8. Apply must be idempotent: a second apply creates zero labels, milestones and issues.
9. Pre-merge validation is read-only against GitHub state.
10. Mutating materialization is manual (`workflow_dispatch`) only after the workflow exists on the repository default branch.

---

## Verification Gate

PR #60 is ready to merge only when its PR validation proves:

- `04.zip` SHA-256 is unchanged;
- no protected canonical/product paths are modified;
- planning tests pass;
- JSON plan contains exactly 212 labels, 7 milestones and 228 unique stable-ID issues;
- live GitHub verification matches the machine-readable plan;
- no duplicate stable IDs exist.

Final-head certification must be observed on the actual PR head commit; bot-authored self-mutating repair commits are not treated as certification evidence because follow-on workflow execution can be suppressed by GitHub Actions token rules.

After merge, the manual materialization workflow may be invoked to execute apply → verify → second apply → second verify and record an idempotency result.

---

*Reconciled from repository state and live GitHub planning on 2026-09-01. No product code or canonical source was changed by this document.*
