# DROPi — Current Canonical Operational State

> **STATUS: CANONIC CURRENT CHECKPOINT**
> Updated: 2026-09-12
> Repository: `caliofmarian-ai/dropi-mobile`
>
> This file is the compact current operational checkpoint. It does not erase historical handover material. When an older handover/status note conflicts with current repository state, current `main`, active canon and this checkpoint take precedence for continuation until the historical handover is compacted/reconciled.

## 1. Project isolation

This repository represents the **real DROPi multimodal logistics application/ecosystem**.

Do not import implementation truth, PR/issue status, design state or acceptance conclusions from sibling/unrelated projects unless the Project Owner explicitly commands a cross-project comparison.

## 2. Source-of-truth order

For a new working session:

1. Read `canonical/CURRENT_STATE.md`.
2. Read `canonical/AI_DEVELOPMENT_HANDOVER_CANON.md`.
3. Read `canonical/DELIVERY_MULTIMODAL.md` and other domain canon relevant to the task.
4. Inspect current `main`, active issues/PRs and tests before implementation.
5. Read `canonical/SESSION_HANDOVER.md` for historical continuity, but do not treat its old session timestamp/branch as current state when contradicted by current repository evidence.

Repository code/contracts remain the implementation source of truth. Canon remains the strategic/governance authority. Conflicts are documented and reconciled rather than silently ignored.

## 3. Canonical main checkpoint

Canonical post-audit main:

`3eba39af8e3d6e8ab5cd052782a5bd3943eabdaa`

This SHA contains the merged 2026-09-12 canonical coverage/reconciliation audit after the coordinated dependency-maintenance wave through Expo SDK 54.0.37.

Audit implementation base before documentation reconciliation was `0b8f61093b48d6237013676f080cbcf0aeffad2b`.

Always re-read current `main` before new implementation work; this checkpoint records the audit boundary, not permission to ignore later commits.

## 4. Product identity

DROPi is a **multimodal logistics platform**, not a drone-only product.

Supported canonical transport concepts include:

- drone;
- auto;
- van;
- e-bike;
- staged/multimodal delivery;
- DronePort / vehicle depot / transfer hub;
- governed fallback.

Channel model:

- C1 — controlled public Marketplace / P2P / self-employed delivery operations;
- C2 — COS contractual controlled operations;
- C3 — EOC critical/emergency operations;
- ADMIN — governance/operations/audit authority.

Missing transport authority must fail closed; UI/server code must not silently convert unknown state into `drone`, `auto` or another mode.

## 5. Canonical roadmap state

### M1 — Application Core Foundation

`IN PROGRESS`

Key state:

- Auth & Accounts — substantial real implementation, still `in-progress` at epic level;
- Data Persistence & Sync — partial; offline strategy and some persisted preferences/addresses remain open;
- Order Management — partial/in-progress;
- Marketplace C1 — **reconciled on 2026-09-12 from `completed` back to `in-progress`** because #362/#364 and current source prove remaining canonical gaps;
- COS/C2 — ready/planned; user-facing governed-unavailable scaffolding is not operational completion;
- EOC/C3 — ready/planned; user-facing governed-unavailable scaffolding is not operational completion;
- Admin Operations — partial/in-progress;
- Payments & Wallet — planned/not materially implemented;
- Real-Time & Notifications — partial/in-progress.

### M2 — Audit Core Activation

`COMPLETED` at phase level; maintain regression gates for audit, privacy, attribution and traceability as new domains land.

### M3 — Logic Core / AI-DSS

`FUTURE`, with early partial infrastructure already present (agent identities, queue/state/reporting/orchestrator). Existing runner behavior is not evidence of full operational embedding.

### M4 — Physical Core / DronePort

`FUTURE`, with prototype Logistics Network UI already present. Static station/fleet/battery/maintenance data are not live authority. #468 protects this truthfulness boundary.

### M5 — Operational Core

`FUTURE`, with selected early operational slices already implemented (STOP/FALLBACK, mission state, GPS/WebSocket, proof/evidence). Real fleet/physical network and full execution stack remain incomplete.

### M6 — Public Front

`FUTURE`. Historical website/pitch/reference packages do not constitute current launch readiness.

## 6. Current high-priority open gaps

- #362 — Marketplace/Profile localization, currency, saved-address/map capture and related experience gaps.
- #364 — P2P consumable transaction consumer-side safety disclosure/acknowledgement + remaining live acceptance.
- #425 — remove synthetic transport authority such as unknown state becoming `auto`.
- #396 / #426 — map-first live tracking and authoritative private fixed-point/fallback data contract.
- #468 — Logistics Network prototype/live truthfulness boundary.
- #258 / #259 — real multimodal fleet registry and availability/assignment/location.
- #461 — controlled future Express 5 migration; Express major is not routine dependency maintenance.
- #475 — repository/public metadata still uses obsolete drone-only / `not a marketplace` identity and must be reconciled to current multimodal canon without rewriting historical archives.
- #476 — `main` is currently unprotected; define and enforce a stable PR/required-check gate without deadlocking path-specific workflows.
- #165 — source/live test-role infrastructure exists; owner Android/Phantom acceptance remains explicit.

## 7. Current truthfulness rules

1. `PROTOTYPE`, `MOCK`, `GOVERNED DATA UNAVAILABLE` and `LIVE` are different states and must never be conflated.
2. UI existence does not equal backend authority.
3. Static station/fleet/alert fixtures must not be presented as live operations.
4. Historical drone-only product wording is historical/reference material, not current product identity.
5. Owner/device acceptance is not inferred from source or CI when an issue explicitly requires it.
6. Repository metadata/public claims must follow current multimodal canon and must not overstate future C2/C3/Payments/Physical capabilities.

## 8. Audit status

**MERGED / VERIFIED.**

PR #371 — `AUDIT-001: canonical coverage audit and roadmap reconciliation` — merged on 2026-09-12 at `3eba39af8e3d6e8ab5cd052782a5bd3943eabdaa` with Privacy, operational regression, TypeScript and whitespace validation green.

#286 (`AUDIT-001` Sprint 1–2 QA validation) is completed.

#287 (`VERIFY-001` complete implementation coverage verification) is completed as a **coverage verification task**. Its closure means the roadmap was audited end-to-end and incomplete capabilities are traceable; it does not mean the product itself is fully implemented.

The prior 2026-09-06 audit report is superseded because its base and several defect conclusions became stale and it contained out-of-scope sibling-project material.

`AUDIT_TRACKING.md` remains a June historical snapshot. Its `96.2%` figure must not be used as current canonical product completion.

No replacement product-completion percentage is canonical yet; use phase/capability status until the owner approves a weighting method.

## 9. Repository governance state

- `main` was observed as unprotected during the audit; #476 owns branch/ruleset enforcement.
- The repository description still reflects obsolete drone-only / `not a marketplace` wording; #475 owns current public repository identity.
- Historical recovered packages may retain their original wording for provenance; they are not current product truth.
- Issue/PR status must not substitute for source evidence when the two have drifted; reconcile explicitly (as done for Marketplace #71).

## 10. Dependency maintenance state

A broad dependency cleanup was completed before the canonical audit, including compatible Expo SDK 54 patch maintenance and several server/tooling/security-compatible updates.

Npm Dependabot version-update PR generation is **temporarily frozen after the audit boundary** to preserve a stable execution/reorganization window. This does not change the security-update responsibility. Re-enable routine version updates in a controlled maintenance window with grouping and major-migration guards after the first post-audit priority wave is established.

## 11. Next execution order

Audit/reorganization is complete. Execute from fresh current-main branches in this order:

1. finish Priority-A M1 truthfulness/product gaps (#362, #364, #425, #396/#426, #468);
2. fix repository governance/identity drift (#475, #476) in parallel where it does not block product work;
3. reconcile/complete remaining M1 Order/Admin/Realtime batches;
4. implement C2/C3 and Payments with real backend authority, not UI-only scaffolding;
5. progress M3 eligibility/routing and AI operational embedding;
6. progress M4/M5 real fleet/DronePort/physical/operational stack;
7. rebuild/promote current Public Front only from evidence-backed capabilities.

## 12. Session close rule

At the end of substantial future work:

- update this checkpoint when the high-level current state changes;
- preserve historical evidence in Git/issues/audit reports;
- do not reintroduce a stale-session branch/SHA as current authority;
- never mix sibling projects into DROPi Mobile status.
