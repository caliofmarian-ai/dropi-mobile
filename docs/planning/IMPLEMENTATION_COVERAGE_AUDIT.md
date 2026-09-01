# DROPi — Implementation Coverage Audit

> **Status:** REPOSITORY-GROUNDED RECONCILIATION  
> **Initial audit:** 2026-08-02  
> **Reconciled against `main`:** 2026-09-01  
> **Repository baseline:** `8fa0bfac20e689824e12850afbc274268d34594e`  
> **Purpose:** distinguish what exists now, what still requires verification, and what is genuinely missing before implementation continues

---

## Scope and Interpretation

The initial coverage document compared the canonical corpus with repository state as understood on 2026-08-02. Several capabilities were subsequently found to exist already in `main`, while some older audit statements remained unchanged. This reconciliation corrects those statements.

The machine-readable planning graph remains the authority for stable issue IDs, labels, milestones and dependencies. This document is an implementation-state audit, not a replacement for `github_materialization_plan.json`.

### Status vocabulary

| Status | Meaning |
|---|---|
| `implemented_verified` | Implementation exists and current evidence/tests are sufficient for the stated capability |
| `implemented_needs_regression` | Implementation exists, but targeted regression/canonical verification is still missing |
| `partial` | A meaningful portion exists but acceptance is not complete |
| `missing` | Required behavior was not found in current `main` |
| `security_gap` | Capability exists but exposes a material authorization/data-integrity problem |
| `owner_or_canon_gate` | Scope/activation remains subject to an explicit owner/canonical decision |
| `future` | Correctly scheduled for a later milestone and must not be pulled forward casually |

---

# Executive Findings

1. **Sprint 6A security work is substantially implemented already.** Delivery-partner unverified state, mission-operation guards and admin role approval flows exist in code. The planning issues describing them as missing must be verified and reconciled rather than rewritten.
2. **The core C1 dashboards are no longer all mock-backed.** Customer, Merchant and Delivery Partner dashboards consume tRPC-backed operational reads, but several additional role dashboards still contain fixed/demo metrics.
3. **The WebSocket tracking server exists and is mounted.** The open planning task that describes it as absent is stale. However, its connection identity/authorization path requires hardening.
4. **Order/mission push notification wiring remains incomplete.** Push infrastructure exists, but the required status-transition hooks still need implementation/verification.
5. **AI framework scaffolding exists.** An agent router, orchestrator-facing task APIs and agent state/report persistence are present. This does not mean the complete 29-agent production system or activation criteria are complete.
6. **Several high-risk product shortcuts remain in user-facing code**, including hardcoded tracking IDs in Delivery Partner dashboard actions.
7. **Biometric authentication, localization EN/RO/TL and the governed offline-first sync strategy remain incomplete/not found.** Their timing is also connected to owner decisions.

---

# M1 — Application Core Foundation

## 2.1 Authentication & Accounts

| Capability | Current status | Repository evidence / finding | Planning action |
|---|---|---|---|
| Email/password registration | `implemented_verified` | `server/auth-router.ts` registration path exists; password hashing/auth infrastructure is active | Preserve; regression only when auth changes |
| Email verification | `implemented_verified` | canonical tRPC/auth-context path exists; prior raw-fetch/AsyncStorage split was remediated | Preserve |
| Password reset | `implemented_needs_regression` | reset flow and email infrastructure exist | Keep targeted auth regression coverage |
| Protected tRPC auth | `implemented_verified` | `server/_core/trpc.ts` requires `ctx.user` for `protectedProcedure` | Preserve |
| Admin authorization | `implemented_needs_regression` | `adminProcedure` permits legacy admin or `system_administrator`; needs role-boundary regression | Add RBAC negative tests |
| Audit middleware on protected/admin tRPC | `implemented_needs_regression` | protected/admin procedures attach async audit logging | M2 must verify complete event coverage |
| Delivery Partner starts unverified | `implemented_needs_regression` | auth registration explicitly sets `isVerified=false` for delivery partners; UI banner exists | **IMPL-001 #158: verify then reconcile/close** |
| Mission operation guard | `implemented_needs_regression` | guards found on `b2bDelivery.pilotUpdateStatus`, `pilotSelection.updateAvailability`, `pilotSelection.updatePosition`; mission UI also guards acceptance | **IMPL-002 #159: verify then reconcile/close** |
| Operational-role approval gate | `implemented_needs_regression` | registration creates pending role application / inactive state for approval-required roles | **IMPL-003 #160: verify then reconcile/close** |
| Admin approvals UI | `implemented_needs_regression` | `app/admin/approvals.tsx` consumes role-application review APIs | **IMPL-004 #161: verify then reconcile/close** |
| Exact token/session refresh contract | `partial` | authenticated token path exists, but current implementation must be re-audited against the exact active session invalidation/refresh requirements; do not overclaim a canonical refresh-token model | Keep in auth certification scope |
| 29 role test accounts | `partial` | role catalog exists; full deterministic seed/certification requires verification against planned issue | Execute governed seed issue rather than assuming absence/completion |
| Phantom mode | `partial` | UI/backend pieces exist historically; complete takeover/restore/audit safety needs verification | Keep planned batch |
| Company/partner account semantics | `partial_or_missing` | no basis to certify complete canonical company/partner lifecycle | Keep planned work |

### Authentication invariant risk

The schema-level `isVerified` default is `true`, while delivery-partner registration correctly overrides it to `false`. That creates a latent bypass risk if any future user-creation path inserts a delivery partner without explicitly setting verification state. The invariant should be enforced centrally or covered by tests proving every creation path is safe.

---

## 2.2 Data Persistence & Sync

| Capability | Current status | Evidence / finding | Planning action |
|---|---|---|---|
| Drizzle schema/migrations | `implemented_verified` | schema and migrations exist; canonical recovery/audit work preserved them | Preserve migration discipline |
| Production migration runner | `implemented_verified` | build/start toolchain includes migration/DB validation support | Preserve |
| Core tRPC live reads | `partial` | Customer/Merchant/Pilot operational dashboards consume `operations` router | Continue domain-by-domain replacement |
| Replace remaining fixed/demo dashboards | `partial` | Support/Analyst and other role surfaces still contain hardcoded metrics/tickets; C1 core is already live-backed | **IMPL-010 #167 remains active** |
| TanStack Query/tRPC cache path | `implemented_needs_regression` | React Query/tRPC are integrated in live screens | Verify invalidation after mutations |
| Offline-first transaction sync | `missing` / `owner_or_canon_gate` | AsyncStorage dependency is not proof of governed offline queue/conflict resolution | OWNER-003 #280 + planned implementation |
| Seed/reference operational data | `partial` | repository contains real DB pathways but not all domains have governed production seeds | Continue per planned batch |

### Hardcoded user-facing data defect

`app/(tabs)/index.tsx` currently exposes Delivery Partner quick actions with literal `deliveryId='1'` and `pilotId='1'`. These are not acceptable production identifiers. Tracking/broadcast actions must derive identity and delivery context from authenticated/current mission state or be removed until such context exists.

---

## 2.3 Order & Delivery Operations

| Capability | Current status | Evidence / finding | Planning action |
|---|---|---|---|
| Customer order reads | `implemented_needs_regression` | `operations.myOrders` backs customer dashboard | Verify ownership isolation and status consistency |
| Merchant order queue reads | `implemented_needs_regression` | merchant dashboard uses live tRPC order reads | Verify merchant ownership/isolation |
| Pilot mission reads | `implemented_needs_regression` | pilot dashboard/mission detail use live tRPC/b2b paths | Verify verification + pilot identity boundaries |
| Pilot forward-only status updates | `implemented_needs_regression` | `b2bDelivery.pilotUpdateStatus` exists with identity/transition guard and downstream hooks | Add explicit transition matrix tests in TEST_REGISTRY |
| Complete C1 lifecycle | `partial` | major runtime pieces exist, but full acceptance, notification and audit coverage is not certified | Keep M1 integration tests |
| C2 contracted operations | `partial` | substantial routers/UI exist, but no basis for complete canonical certification | Continue planned C2 batches |
| C3 emergency operations | `partial` | role/UI foundations exist; full declaration/dispatch/override acceptance not certified | Continue planned C3 batches |
| Order audit trail | `partial` | tRPC audit middleware exists but end-to-end order-event completeness is an M2 concern | M2 verification |

Some operational DTOs still carry placeholder values such as zero distance/estimated-time in paths where real calculations are not yet available. Those fields must not be presented as authoritative operational truth.

---

## 2.4 Marketplace C1

**Canonical scope remains conflicted.** Repository metadata describes DROPi as the operational core and explicitly says it is not a marketplace, while historical implementation contains marketplace functionality inside the mobile app.

| Capability | Current status | Planning action |
|---|---|---|
| Existing mobile marketplace screens/backend | `partial` | Do not delete blindly; inventory current behavior |
| Final marketplace ownership/location | `owner_or_canon_gate` | **CANON-RES-001 #283** must resolve separate web marketplace vs integrated app responsibility |
| Product/catalog real-data completion | `partial` | Continue only within non-conflicted safe scope |
| Checkout/payment boundary | `partial` | Coordinate with Payments epic and marketplace resolution |

---

## 2.5 C2 / 2.6 C3 / 2.7 Admin Operations

The initial audit reduced many of these areas to “UI only.” Current `main` contains substantially more server-side infrastructure than that statement implies. They are still not certified complete.

### C2
- role-specific dashboards and backend modules exist;
- pilot/delivery operational APIs exist;
- contracted operations, SLA and complete canonical boundary testing remain incomplete.

### C3
- role/channel foundations exist;
- emergency-domain completeness, override authority, incident command and rapid-dispatch acceptance require dedicated audit/tests.

### Admin
- admin router/procedures exist;
- role application review/approval/rejection is implemented;
- verification administration exists;
- agent administration/orchestration APIs exist;
- system-wide configuration/permission audit remains necessary.

---

## 2.8 Payments & Wallet

No current evidence supports declaring the complete canonical wallet/payment system finished. Treat it as `partial/missing by capability`, not as a monolithic absence.

Required certification areas include:
- real vs promotional balance separation;
- provider/payment intent contract;
- commissions;
- refunds;
- withdrawals;
- audit/reconciliation and failure semantics.

Continue through EPIC-008 planned batches after upstream order/marketplace boundaries are stable.

---

## 2.9 Real-Time & Notifications

| Capability | Current status | Evidence / finding | Planning action |
|---|---|---|---|
| Push notification infrastructure | `implemented_needs_regression` | `server/push-notifications.ts` and role/verification notification use exist | Preserve infrastructure |
| In-app notifications | `implemented_needs_regression` | notification router and notification center/preferences exist | Verify preferences + auth isolation |
| Order/mission status push | `missing_or_incomplete` | no complete evidence that every required `updateStatus`/`pilotUpdateStatus` transition notifies intended customer/merchant | **IMPL-034 #191 remains active** |
| WebSocket server | `implemented_needs_regression` | `server/live-tracking.ts` exists; `_core/index.ts` mounts it | Reclassify **IMPL-033 #190** from “missing server” to hardening/verification |
| WebSocket identity/authorization | `security_gap` | connection accepts role/pilotId/deliveryId from query parameters without an evident session/JWT ownership gate in the tracking connection path | **P0 hardening before production tracking** |
| Zone 0 transport policy | `owner_or_canon_gate` | WebSocket exists, but long-term WebSocket vs polling policy is unresolved | OWNER-002 #279 |

---

# M2 — Audit Core

Current audit infrastructure is better than the old “table only” description:

- tRPC protected/admin procedures invoke audit middleware;
- audit storage/router infrastructure exists;
- role approval and other sensitive operations create operational evidence.

However, **complete event coverage is not certified**. Non-tRPC paths, WebSocket events, high-risk state transitions, proof-of-delivery, incidents, privacy consent, retention and erasure remain M2 work.

Status: **partial — M2 remains required**.

---

# M3 — Logic Core / AI-DSS

The old statement “AI framework: no code” is incorrect.

Current repository evidence includes:
- `server/agent-router.ts`;
- orchestrator dispatch APIs;
- task queue operations;
- agent-state reads;
- agent-report persistence/read APIs;
- schema support for agent tasks/state/reports;
- role enumeration across 29 DROPi roles.

This is **framework/scaffolding**, not proof that all 29 agents are implemented, validated, simulated for one month, or authorized for autonomous production decisions.

| Capability | Status |
|---|---|
| Base orchestrator/API framework | `partial` |
| Persistent task/state/report model | `partial` |
| Complete C1/C2/C3/Admin agent behaviors | `future/partial by role` |
| Full simulation harness and 1-month acceptance | `future` |
| Autonomous activation sequence | `owner_or_canon_gate` — OWNER-005 #282 |
| Eligibility engine / route optimizer | `partial_or_future` |

Do not move M3 ahead of M1/M2 closure simply because scaffolding already exists.

---

# M4–M6

These milestones remain predominantly future/planned and should be audited when their dependency gates are satisfied.

Important exceptions:
- some DronePort/fleet/tracking UI/server scaffolding exists early;
- early scaffolding must not be interpreted as operational certification;
- Zone 0 drone regulatory scope remains gated by **CANON-RES-003 #285**;
- client-presence enforcement details remain gated by **CANON-RES-002 #284**;
- public Marketplace responsibility remains gated by **CANON-RES-001 #283**.

---

# Transversal Security Audit — Current P0/P1 Findings

## P0 — must be addressed before production trust

1. **WebSocket authentication/authorization**
   - Do not trust `role`, `pilotId` or `deliveryId` supplied by query string as identity.
   - Authenticate the socket session/token server-side.
   - Derive user/pilot identity from authenticated state.
   - Authorize subscriber access to the specific delivery.
   - Reject unauthenticated/unauthorized tracking connections.

2. **Remove hardcoded tracking identities**
   - Delete/replace `deliveryId='1'` and `pilotId='1'` user-facing navigation shortcuts.
   - Use current mission context only.

3. **Verification invariant enforcement**
   - Current delivery-partner registration correctly sets unverified state, but schema default `isVerified=true` can become a bypass if another creation path omits explicit state.
   - Enforce the role-dependent invariant centrally and add regression tests.

## P1 — next implementation/certification wave

4. Complete remaining live-data migration under **IMPL-010 #167**.
5. Implement/certify order/mission status push under **IMPL-034 #191**.
6. Add negative RBAC/ownership tests for order, mission, admin and tracking surfaces.
7. Execute the Sprint 1–2 QA/canonical compliance verification rather than relying on historical todo checkmarks.
8. Audit exact token refresh/session invalidation behavior against active canonical requirements.

---

# Still Missing / Not Found in Current Main

| Capability | Status / gate |
|---|---|
| Biometric authentication | not found; OWNER-001 #278 governs timing |
| Full offline-first transactional sync | not found; OWNER-003 #280 governs strategy |
| EN/RO/TL localization selector/framework | not found in current code search |
| Complete remaining hardcoded-dashboard replacement | partial; IMPL-010 #167 |
| Complete order-status push wiring | incomplete; IMPL-034 #191 |
| Certified WebSocket authorization | missing; existing transport must be hardened |
| Complete M2 privacy/retention/erasure package | future/incomplete |
| Complete 29-agent production behavior + simulation acceptance | future/incomplete |

---

# Planning Reconciliation Required

Before starting a large new implementation batch, GitHub status should be reconciled with code evidence:

| Planning item | Repository audit result | Next action |
|---|---|---|
| IMPL-001 #158 | implementation exists | targeted regression → mark done if PASS |
| IMPL-002 #159 | implementation exists | endpoint/security regression → mark done if PASS |
| IMPL-003 #160 | implementation exists | registration/approval tests → mark done if PASS |
| IMPL-004 #161 | implementation exists | admin UI/API journey tests → mark done if PASS |
| IMPL-010 #167 | partially implemented | continue remaining live-data migration |
| IMPL-033 #190 | server exists but security gap remains | redefine execution as auth/authorization hardening + verification |
| IMPL-034 #191 | infrastructure exists, transition wiring incomplete | implement required push hooks + tests |

---

# Current Continuation Pointer

1. **Certify and merge planning PR #60 only after read-only live GitHub verification passes.**
2. **Verify/reconcile IMPL-001..IMPL-004 instead of duplicating their code.**
3. **Address the P0 tracking/verification security findings.**
4. **Continue IMPL-010 (#167) and IMPL-034 (#191).**
5. **Proceed through M1 dependency order, then M2.**

This is the repository-grounded continuation point as of 2026-09-01.

---

*No product or canonical source was modified by this audit reconciliation. Findings describe `main` and map them back to the already-materialized GitHub planning graph.*
