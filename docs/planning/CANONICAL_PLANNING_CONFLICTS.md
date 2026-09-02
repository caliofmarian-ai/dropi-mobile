# DROPi — Canonical Planning Conflicts Register

> **Status:** PLANNING CANONICAL — RECONCILED 2026-09-02  
> **Initial generation:** 2026-08-02  
> **Purpose:** Preserve material source tensions and route them to explicit owner/canonical decisions  
> **Rule:** No conflict is silently resolved in implementation planning.

---

## Authority Order

Planning comparisons use this precedence unless a newer explicit owner decision supersedes it:

`04-ZIP > HIST-EXTRACT > ACTIVE-CANON > BLUEPRINT > IMPLEMENTATION OBSERVATION`

Implementation observations can prove what currently exists, but they do not silently override higher canonical authority.

---

## CONFLICT-001 — Marketplace Separation vs Integrated Mobile Marketplace

**Severity:** Medium  
**Resolution issue:** **CANON-RES-001 — #283**  
**Status:** resolved 2026-09-02

### Tension
Higher-authority product material describes Marketplace as a separate controlled public surface whose outputs feed the operational app. Lower-authority blueprint/current implementation places Marketplace functionality inside the mobile application.

### Resolution
The recovered 04-ZIP canonical/frozen Marketplace annex controls. Marketplace is the public C1 offer-and-delivery-initiation layer and is strictly separated in responsibility from the execution application, pilot selection, delivery infrastructure and COS channels.

Shared backend/auth/order/audit primitives are allowed, but public discovery and checkout must remain modular so they can be hosted independently without changing Operational Core execution contracts. Existing integrated mobile Marketplace screens are implementation-stage surfaces, not architectural proof of inseparability.

**Resolution record:** `docs/planning/C1_MARKETPLACE_POSITIONING_RESOLUTION.md`

---

## CONFLICT-002 — Philippines Zone 0 Regulatory Scope vs EASA/FAA References

**Severity:** High  
**Resolution issue:** **CANON-RES-003 — #285**  
**Status:** unresolved / blocks final live-drone compliance scope

### Tension
Canonical materials contain EASA/FAA-oriented regulatory references while the first operational geography is Philippines Zone 0, whose locally binding aviation authority is CAAP.

### Impact
- M2 compliance/audit planning
- M5 live supervised delivery
- Geofencing and authority-reporting requirements

### Rule until resolved
Treat EASA/FAA material as reference/future-market input unless CANON-RES-003 establishes a binding requirement for Zone 0. Do not claim live regulatory readiness until the locally binding path is resolved.

**Correction from the initial register:** this conflict is **not OWNER-004**. OWNER-004 (#281) governs DronePort physical-infrastructure timing. The regulatory interpretation is materialized as CANON-RES-003 (#285).

---

## CONFLICT-003 — Client-Presence Rules vs Enforcement Mechanism

**Severity:** Medium  
**Resolution issue:** **CANON-RES-002 — #284**  
**Status:** unresolved implementation detail

### Tension
The canonical delivery rule is clear: the drone does not wait, negotiate reception, or repeat delivery; failed reception triggers fallback. The exact app-side mechanism for proving tutorial completion, acceptance of conditions and reception readiness is not fully specified.

### Impact
- Delivery Execution Engine
- Client eligibility/readiness
- Audit logging of accepted conditions
- STOP/FALLBACK paths

### Rule until resolved
Preserve the canonical no-wait/fallback behavior and do not invent an irreversible client-presence mechanism before #284 resolves the exact enforcement contract.

---

## CONFLICT-004 — WebSocket vs Polling Strategy for Zone 0

**Severity:** Low as an architecture choice; **security impact is higher for the existing implementation**  
**Owner decision:** **OWNER-002 — #279**  
**Status:** unresolved operating-strategy decision

### Current repository reality
`server/live-tracking.ts` already implements a WebSocket transport and `server/_core/index.ts` mounts it at runtime. Therefore the work is not accurately described as “WebSocket missing”.

The 2026-09-01 audit also found that the current tracking connection derives `role`, `pilotId` and `deliveryId` from query parameters without an evident session/JWT authorization gate inside the WebSocket connection path. This is an implementation security gap independent of whether the long-term Zone 0 transport is WebSocket or polling.

### Impact
- EPIC-009 — Real-Time & Notifications
- live tracking privacy/authorization
- low-connectivity behavior

### Rule until resolved
OWNER-002 decides the transport strategy. Security/authentication of any enabled transport is mandatory regardless of that decision.

---

## CONFLICT-005 — AI Agent Activation Sequence

**Severity:** Medium  
**Owner decision:** **OWNER-005 — #282**  
**Status:** unresolved phasing decision

### Tension
Canonical role architecture expects human + AI identity concepts, while the layered roadmap schedules full AI-agent behavior for M3 after Application Core/Audit Core. Repository reality already contains an agent router/orchestration foundation, so “AI entirely unimplemented” is also too coarse.

### Impact
- account/data-model expectations in M1
- full autonomous behavior in M3
- simulation/readiness gates

### Rule until resolved
Do not equate the existence of AI-agent scaffolding with authorization for autonomous production operation. OWNER-005 determines when records/scaffolding become active behavior.

---

## CONFLICT-006 — P2P Public Listing vs Private Non-Commercial Parcel Model

**Severity:** Medium  
**Resolution issue:** **#294**  
**Status:** resolved 2026-09-02

### Tension
Some lower-authority/derived material described P2P as outside Marketplace, while delivery references used language implying Marketplace participation.

### Resolution
The recovered 04-ZIP canonical/frozen Marketplace annex explicitly supports both:

- private P2P delivery initiation for non-commercial users; and
- limited occasional public community offers, including donations, free transfers and occasional fixed-price sales without repetitive commercial character.

Public P2P/community offers are limited in active count, time-bounded, moderated, automatically audited, non-promoted and non-commercial. P2P is not equivalent to a recurring merchant storefront.

**Resolution record:** `docs/planning/C1_MARKETPLACE_POSITIONING_RESOLUTION.md`

---

## Related Owner Decisions That Are Not Canonical Conflicts

These decisions are material planning gates but should not be mislabeled as the resolution of one of the conflicts above:

| Issue | Topic |
|---|---|
| OWNER-001 — #278 | Biometric authentication timing and priority |
| OWNER-003 — #280 | Offline-first synchronization strategy |
| OWNER-004 — #281 | DronePort physical-infrastructure timing |

---

## Reconciled Summary

| Conflict | Severity | Decision / Resolution Issue | Status |
|---|---|---|---|
| Marketplace separation vs integrated mobile Marketplace | Medium | CANON-RES-001 #283 | Resolved 2026-09-02 |
| Philippines Zone 0 regulatory baseline vs EASA/FAA references | High | CANON-RES-003 #285 | Unresolved |
| Client-presence canonical rule vs enforcement mechanism | Medium | CANON-RES-002 #284 | Unresolved |
| WebSocket vs polling operating strategy | Low architecture / security hardening required | OWNER-002 #279 | Unresolved |
| AI-agent activation sequence | Medium | OWNER-005 #282 | Unresolved |
| P2P public listing vs private non-commercial parcel model | Medium | #294 | Resolved 2026-09-02 |

**Total tracked conflicts/tensions: 6. Resolved: 2. Unresolved: 4.**

---

## Preservation Rule

Dependent work may inspect or harden existing implementation, but it must not silently resolve a canonical/owner decision. When implementation evidence changes the understanding of an issue, planning status must be reconciled explicitly and verification evidence must be added.

*Reconciled against the materialized GitHub graph, the recovered 04-ZIP authority corpus, and repository state on 2026-09-02. No frozen canonical source was modified.*
