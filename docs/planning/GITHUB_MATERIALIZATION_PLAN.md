# DROPi — GitHub Materialization Plan

> **Status:** PLANNING CANONICAL — DO NOT DELETE  
> **Generated:** 2026-08-02  
> **Version:** 1.0.0  
> **Repository:** caliofmarian-ai/dropi-mobile  
> **Archive SHA-256:** `82a6015b8c968645307e36c8e4aa0351515f50333c08a6c5402a7819b7b747e5`

---

## Summary

| Item | Count |
|------|-------|
| Canonical sources inspected | 22 source groups (47 documents) |
| Conflicts detected | 5 (3 requiring owner decision, 2 requiring canonical resolution) |
| Labels planned | 147 |
| Milestones planned | 7 |
| Program issues | 1 |
| Phase issues | 6 |
| Epic issues | 30 |
| Batch issues | 60 |
| Implementation issues | 120 |
| Owner-decision issues | 5 |
| Canonical-resolution issues | 3 |
| Audit/Verify/Doc issues | 8 |
| **Total issues planned** | **233** |

---

## Planning Hierarchy

```
PROG-001: DROPi Mobile — Complete Canonical Roadmap Program
├── M0: Canonical Recovery (CLOSED — issues #42–#50 done)
├── M1: Application Core Foundation
│   ├── PHASE-M1
│   ├── EPIC-001: Auth & Accounts
│   │   ├── BATCH-001: Auth Core — OAuth, JWT, RBAC
│   │   │   ├── IMPL-001: Delivery Partner unverified status
│   │   │   ├── IMPL-002: Guard on mission endpoints
│   │   │   └── IMPL-003: Admin approval gate
│   │   └── BATCH-002: Account Management — Roles, Test Accounts
│   │       ├── IMPL-004: 29 test accounts seed
│   │       └── IMPL-005: Phantom mode complete
│   ├── EPIC-002: Data Persistence & Sync
│   │   ├── BATCH-003: DB Schema & Migrations finalization
│   │   └── BATCH-004: Replace mock data with real DB
│   ├── EPIC-003: Order Management
│   │   ├── BATCH-005: Order lifecycle C1
│   │   └── BATCH-006: Order C2/C3/Admin flows
│   ├── EPIC-004: Marketplace C1
│   │   ├── BATCH-007: Product catalog real data
│   │   ├── BATCH-008: Zonal search & P2P listings
│   │   └── BATCH-009: Checkout & payment integration
│   ├── EPIC-005: COS — C2 Channel
│   │   ├── BATCH-010: C2 contracted operations backend
│   │   └── BATCH-011: C2 SLA monitoring
│   ├── EPIC-006: EOC — C3 Channel
│   │   ├── BATCH-012: C3 emergency declaration & dispatch
│   │   └── BATCH-013: C3 resource allocation & OVERRIDE
│   ├── EPIC-007: Admin Operations
│   │   ├── BATCH-014: Admin phantom mode completion
│   │   └── BATCH-015: Admin approval panel
│   ├── EPIC-008: Payments & Wallet
│   │   ├── BATCH-016: Wallet real/promo balance
│   │   └── BATCH-017: Payment providers & commissions
│   ├── EPIC-009: Real-Time & Notifications
│   │   ├── BATCH-018: Push notifications for order status
│   │   └── BATCH-019: WebSocket live tracking
│   ├── EPIC-028: Security Module (transversal)
│   │   ├── BATCH-054: Security audit & pen testing
│   │   └── BATCH-055: Biometric authentication
│   ├── EPIC-029: Testing & QA (transversal)
│   │   ├── BATCH-056: QA Sprint 1-2 validation
│   │   └── BATCH-057: Test coverage expansion
│   └── EPIC-030: Deployment & Release (transversal)
│       ├── BATCH-058: Railway deployment optimization
│       └── BATCH-059: Android distribution EAS
├── M2: Audit Core Activation
│   ├── PHASE-M2
│   ├── EPIC-010: Audit Logging
│   │   ├── BATCH-020: Complete event logging system
│   │   └── BATCH-021: Audit log API & admin view
│   ├── EPIC-011: GDPR & Privacy Compliance
│   │   ├── BATCH-022: Consent management
│   │   └── BATCH-023: Data retention & deletion
│   └── EPIC-012: Operational Traceability
│       ├── BATCH-024: Proof of delivery system
│       └── BATCH-025: Incident audit trail
├── M3: Logic Core — AI/DSS
│   ├── PHASE-M3
│   ├── EPIC-013: AI Agents Framework
│   │   ├── BATCH-026: Base agent framework & dual accounts
│   │   └── BATCH-027: Agent simulation harness
│   ├── EPIC-014: AI Agents — C1 Marketplace (9)
│   │   └── BATCH-028: C1 agent implementation (9 agents)
│   ├── EPIC-015: AI Agents — C2 COS (8)
│   │   └── BATCH-029: C2 agent implementation (8 agents)
│   ├── EPIC-016: AI Agents — C3 EOC (6)
│   │   └── BATCH-030: C3 agent implementation (6 agents)
│   ├── EPIC-017: AI Agents — Admin & Support (11)
│   │   └── BATCH-031: Admin/Support agent implementation
│   └── EPIC-018: Eligibility Engine & Route Optimization
│       ├── BATCH-032: Delivery eligibility engine
│       └── BATCH-033: Route optimization service
├── M4: Physical Core — DronePort
│   ├── PHASE-M4
│   ├── EPIC-019: DronePort Digital Management
│   │   ├── BATCH-034: DronePort registry & status API
│   │   └── BATCH-035: DronePort digital twin
│   ├── EPIC-020: Multimodal Transfer
│   │   └── BATCH-036: Transfer hub & staged delivery logic
│   ├── EPIC-021: Battery & Charging Management
│   │   └── BATCH-037: Battery lifecycle tracking
│   └── EPIC-022: Safety Points & Emergency Landing
│       └── BATCH-038: Safety zones registry
├── M5: Operational Core — Supervised Delivery
│   ├── PHASE-M5
│   ├── EPIC-023: Delivery Execution Engine
│   │   ├── BATCH-039: Live delivery orchestration
│   │   └── BATCH-040: Pilot dispatch system
│   ├── EPIC-024: STOP & FALLBACK Mechanisms
│   │   ├── BATCH-041: STOP rules implementation
│   │   └── BATCH-042: FALLBACK triggers & weather
│   ├── EPIC-025: GPS, Geofencing & Weather
│   │   ├── BATCH-043: GPS tracking & geofencing
│   │   └── BATCH-044: Weather API & no-crowds rules
│   └── EPIC-026: Fleet Management Real
│       ├── BATCH-045: Drone fleet tracking
│       └── BATCH-046: Ground fleet & maintenance
└── M6: Public Front — Website
    ├── PHASE-M6
    └── EPIC-027: Website Marketing — Public Front
        ├── BATCH-047: Marketing website build
        └── BATCH-048: SEO & investor pages

OWNER-DECISION Issues (cross-cutting):
- OWNER-001: Biometric authentication timeline
- OWNER-002: WebSocket vs polling for Zone 0
- OWNER-003: Offline-first sync strategy
- OWNER-004: DronePort physical infrastructure timeline
- OWNER-005: AI agent activation sequence

CANONICAL-RESOLUTION Issues:
- CANON-RES-001: Marketplace separation vs integration
- CANON-RES-002: Client-presence rules enforcement
- CANON-RES-003: EASA compliance for Philippines Zone 0

VERIFICATION Issues:
- VERIFY-001: Sprint 1-2 spec compliance
- VERIFY-002: Complete implementation coverage
- AUDIT-001: API contract documentation
- DOC-001: Canonical source documentation
```

---

## Milestones

| ID | Title | State | Entry Criteria | Exit Criteria |
|----|-------|-------|----------------|---------------|
| M0 | Canonical Recovery & Certification | CLOSED | — | CAN-001–CAN-008 completed (#42–#50) |
| M1 | Application Core Foundation | OPEN | M0 complete | L2 layers (2.1–2.9) fully implemented and tested |
| M2 | Audit Core Activation | OPEN | M1 core auth done | L6 (6.1–6.3) fully verified; GDPR compliant |
| M3 | Logic Core — AI/DSS | OPEN | M1+M2 complete | 29 agents operational; 1-month simulation passed |
| M4 | Physical Core — DronePort | OPEN | M3 complete | DronePort digital twin functional |
| M5 | Operational Core | OPEN | M4 complete | Live Zone 0 pilot delivery operational |
| M6 | Public Front | OPEN | M5 complete | Zone 0 launch ready; website live |

---

## Label Taxonomy

### Type Labels (18)
`type:program`, `type:phase`, `type:milestone`, `type:epic`, `type:batch`, `type:implementation`, `type:design`, `type:audit`, `type:documentation`, `type:verification`, `type:testing`, `type:security`, `type:compliance`, `type:operations`, `type:owner-decision`, `type:canonical-resolution`, `type:migration`, `type:release`

### Status Labels (10)
`status:ready`, `status:in-progress`, `status:blocked`, `status:needs-design`, `status:needs-audit`, `status:needs-owner-decision`, `status:future`, `status:historical`, `status:superseded`, `status:done`

### Priority Labels (4)
`priority:p0`, `priority:p1`, `priority:p2`, `priority:p3`

### Risk Labels (4)
`risk:critical`, `risk:high`, `risk:medium`, `risk:low`

### Authority Labels (6)
`authority:04-zip`, `authority:active-canon`, `authority:blueprint`, `authority:implementation`, `authority:conflicted`, `authority:derived`

### Platform Labels (8)
`platform:web`, `platform:android`, `platform:backend`, `platform:database`, `platform:infrastructure`, `platform:drone`, `platform:ground-logistics`, `platform:operations`

### Domain Labels (60+)
One per canonical domain. See `github_materialization_plan.json` for complete list.

### Phase Labels (7)
`phase:m0-canonical-recovery`, `phase:m1-application-core`, `phase:m2-audit-core`, `phase:m3-logic-core`, `phase:m4-physical-core`, `phase:m5-operational-core`, `phase:m6-public-front`

### Epic Labels (30)
`epic:auth-accounts`, `epic:data-persistence`, `epic:order-management`, `epic:marketplace-c1`, `epic:cos-c2`, `epic:eoc-c3`, `epic:admin-operations`, `epic:payments-wallet`, `epic:realtime-notifications`, `epic:audit-logging`, `epic:gdpr-privacy`, `epic:operational-traceability`, `epic:ai-agents-framework`, `epic:ai-agents-c1`, `epic:ai-agents-c2`, `epic:ai-agents-c3`, `epic:ai-agents-admin`, `epic:eligibility-engine`, `epic:droneport-management`, `epic:multimodal-transfer`, `epic:battery-management`, `epic:safety-points`, `epic:delivery-execution`, `epic:stop-fallback`, `epic:gps-geofencing`, `epic:fleet-management`, `epic:website-marketing`, `epic:security-module`, `epic:testing-qa`, `epic:deployment-release`

### Batch Labels (60)
`batch:b001` through `batch:b060`

**Total Labels: 147**

---

## Materialization Rules

1. Labels are created before issues
2. Milestones are created before issues
3. Parent issues are created before children
4. Closed completed work (#42–#50) is NOT reopened
5. No product code is modified
6. No canonical source is modified
7. No archive is modified
8. No audit input is modified
9. Script is idempotent (safe to run multiple times)
10. Duplicate detection uses stable IDs embedded in issue bodies

---

## Stable ID Schema

| Type | Pattern | Example |
|------|---------|---------|
| Program | `PROG-NNN` | `PROG-001` |
| Phase | `PHASE-MN` | `PHASE-M1` |
| Epic | `EPIC-NNN` | `EPIC-001` |
| Batch | `BATCH-NNN` | `BATCH-001` |
| Implementation | `IMPL-NNN` | `IMPL-001` |
| Owner Decision | `OWNER-NNN` | `OWNER-001` |
| Canonical Resolution | `CANON-RES-NNN` | `CANON-RES-001` |
| Audit | `AUDIT-NNN` | `AUDIT-001` |
| Verify | `VERIFY-NNN` | `VERIFY-001` |
| Documentation | `DOC-NNN` | `DOC-001` |

Stable IDs are embedded in issue bodies as: `<!-- dropi-planning-id: EPIC-001 -->`

---

## Dependencies

### Hard Dependencies (blocking)

| Dependent | Blocked By | Reason |
|-----------|-----------|--------|
| EPIC-003 | EPIC-001 | Orders require auth |
| EPIC-004 | EPIC-002 | Marketplace requires real DB |
| EPIC-008 | EPIC-004 | Payments require orders |
| EPIC-009 | EPIC-001 | Notifications require auth |
| EPIC-010 | M1 partial | Audit core needs core flows |
| EPIC-013 | M1+M2 | AI agents require full core |
| EPIC-019 | M3 | DronePort needs AI/DSS |
| EPIC-023 | M4 | Delivery needs physical infrastructure |
| EPIC-027 | M5 | Website is last |

### Conflict Blocks

| Dependent | Blocked By | Reason |
|-----------|-----------|--------|
| EPIC-004 final scope | CANON-RES-001 | Marketplace separation unclear |
| EPIC-023 compliance | OWNER-004 | EASA/Philippines regs unclear |
| EPIC-024 weather | OWNER-002 | Real-time strategy unclear |

---

*This plan is derived from complete canonical corpus inspection. Deviations from this plan require canonical justification.*
